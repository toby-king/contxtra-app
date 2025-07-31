import React, { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import LinkInput from './components/LinkInput';
import ResultDisplay from './components/ResultDisplay';
import History from './components/History';
import Auth from './components/Auth';
import { analyzeLink, checkTrialUsage, trackAnalyzerUsage } from './services/api';
import useLocalStorage from './hooks/useLocalStorage';
import { supabase } from './lib/supabase';
import TrialExpiredModal from './components/TrialExpiredModal';
import { Link } from 'react-router-dom';

interface HistoryItem {
  url: string;
  timestamp: number;
}

interface UserMetrics {
  links_analyzed: number;
  visit_count: number;
  positive_ratings: number;
  negative_ratings: number;
  is_admin: boolean;
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('link-analyzer-history', []);
  const [session, setSession] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [metrics, setMetrics] = useState<UserMetrics>({
    links_analyzed: 0,
    visit_count: 0,
    positive_ratings: 0,
    negative_ratings: 0,
    is_admin: false
  });
  const [trialUsage, setTrialUsage] = useState<{ remaining_uses: number; trial_expired: boolean } | null>(null);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (profile && !error) {
        setIsAdmin(profile.is_admin || false);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Failed to check admin status:', err);
      setIsAdmin(false);
    }
  };

  const fetchUserMetrics = async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    console.log('Fetching user metrics for userId:', userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('links_analyzed, visit_count, positive_ratings, negative_ratings, is_admin')
        .eq('id', userId)
        .single();

      if (data && !error) {
        console.log('Fetched metrics from database:', data);
        console.log('Current links_analyzed value:', data.links_analyzed);
        setMetrics(data);
      } else if (error) {
        console.error('Error fetching user metrics:', error);
      }
    } catch (err) {
      console.error('Failed to fetch user metrics:', err);
    }
  };

  const incrementVisitCount = async (userId: string) => {
    // Check if we've already tracked a visit for this session
    const sessionKey = `visit_tracked_${userId}`;
    const hasTrackedThisSession = sessionStorage.getItem(sessionKey);
    
    if (hasTrackedThisSession) {
      return;
    }

    try {
      const { error } = await supabase.rpc('increment_visit_count', {
        user_id: userId
      });

      if (error) {
        console.error('Error incrementing visit count:', error);
      } else {
        sessionStorage.setItem(sessionKey, 'true');
        await fetchUserMetrics();
      }
    } catch (err) {
      console.error('Failed to increment visit count:', err);
    }
  };

  const incrementLinksAnalyzed = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      return;
    }

    try {
      // First get the current value
      const { data: currentData, error: fetchError } = await supabase
        .from('profiles')
        .select('links_analyzed')
        .eq('id', userId)
        .single();
        
      if (fetchError) {
        return;
      }
      
      const currentCount = currentData?.links_analyzed || 0;
      
      // Now increment it
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          links_analyzed: currentCount + 1
        })
        .eq('id', userId)
        .select();
        
      if (error) {
        console.error('Failed to increment links_analyzed:', error);
      } else {
        // Refresh metrics to show updated count
        await fetchUserMetrics();
      }
    } catch (err) {
      console.error('Error in incrementLinksAnalyzed:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(currentSession);
          setCurrentUser(currentSession?.user || null);
          if (currentSession?.user?.id) {
            await checkAdminStatus(currentSession.user.id);
            await fetchUserMetrics();
            await incrementVisitCount(currentSession.user.id);
          } else {
            // Check trial usage for non-authenticated users
            try {
              const response = await fetch('https://api.ipify.org?format=json');
              const { ip } = await response.json();
              const usage = await checkTrialUsage(ip);
              setTrialUsage(usage);
            } catch (err) {
              console.error('Failed to check trial usage:', err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      }
    };

    initializeSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (url: string) => {
    // Local variables to hold response data and error
    let responseData: any = null;
    let responseError: string | null = null;

    if (!session && trialUsage?.trial_expired) {
      setShowTrialExpiredModal(true);
      return;
    }

    setIsLoading(true);
    
    try {
      if (!session) {
        // Get current IP
        const response = await fetch('https://api.ipify.org?format=json');
        const { ip } = await response.json();
        
        // Track actual usage of analyzer
        const usage = await trackAnalyzerUsage(ip);
        setTrialUsage(usage);

        if (usage.trial_expired) {
          setShowTrialExpiredModal(true);
          return;
        }
      }

      const response = await analyzeLink(url);
      
      if (response.error) {
        responseError = response.error;
      } else {
        responseData = response.data;
        
        const newHistoryItem = { url, timestamp: Date.now() };
        setHistory((prev) => {
          const filtered = prev.filter(item => item.url !== url);
          return [newHistoryItem, ...filtered].slice(0, 10);
        });

        // Increment links_analyzed for authenticated users
        if (session?.user?.id) {
          await incrementLinksAnalyzed();
        }
      }
    } catch (err) {
      responseError = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error(err);
    } finally {
      setResult(responseData);
      setError(responseError);
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (url: string) => {
    handleSubmit(url);
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleSignOut = async () => {
    try {
      // Clear session storage for visit tracking first
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('visit_tracked_')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }
      
      // The auth state change listener will handle clearing the state,
      // but we can also clear it immediately for better UX
      setMetrics({
        links_analyzed: 0,
        visit_count: 0,
        positive_ratings: 0,
        negative_ratings: 0,
        is_admin: false
      });
      setIsAdmin(false);
      setCurrentUser(null);
      setSession(null);
      setTrialUsage(null);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  const handleStartSignUp = () => {
    setShowTrialExpiredModal(false);
    setShowAuth(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {showTrialExpiredModal && (
        <TrialExpiredModal onSignUp={handleStartSignUp} />
      )}
      
      {showAuth && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAuth(false);
            }
          }}
        >
          <Auth onAuthSuccess={() => setShowAuth(false)} onClose={() => setShowAuth(false)} />
        </div>
      )}
      
      <header className="pt-12 pb-6 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src="/icon.png" alt="Logo" className="w-12 h-12" />
            <img src="/textmark.png" alt="CONTXTRA Logo" className="h-8" />
          </div>
          <p className="text-slate-600 max-w-lg mx-auto mt-4">
            Paste any X or Bluesky URL below and get additional context
          </p>
          {!session && (
            <div className="mt-4">
              {!trialUsage?.trial_expired && trialUsage?.remaining_uses !== undefined && (
                <p className="text-sm text-slate-600 mb-2">
                  Trial Mode: {trialUsage.remaining_uses} uses remaining
                </p>
              )}
              <button
                onClick={() => setShowAuth(true)}
                className="px-4 py-2 bg-[#622D91] hover:bg-[#4a2170] text-white rounded-full text-sm font-medium transition-colors duration-200"
              >
                {trialUsage?.trial_expired ? 'Sign up for full access' : 'Log in or sign up for unlimited access'}
              </button>
            </div>
          )}
          {session && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="text-sm text-slate-600">
                Posts Analysed: <span className="font-semibold">{metrics.links_analyzed}</span>
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <Link
                    to="/admin-dashboard"
                    className="px-4 py-2 bg-[#622D91] hover:bg-[#4a2170] text-white rounded-full text-sm font-medium transition-colors duration-200"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-[#622D91] hover:bg-[#4a2170] text-white rounded-full text-sm font-medium transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pb-12">
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="relative">
            <LinkInput onSubmit={handleSubmit} isLoading={isLoading} />
            {history.length > 0 && (
              <div className="relative mt-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between px-4 py-2 text-left text-sm text-slate-600 bg-white rounded-[24px] border border-slate-200 hover:bg-slate-50"
                >
                  <span>Recent Links ({history.length})</span>
                  <ChevronDown
                    size={16}
                    className={`transform transition-transform ${showHistory ? 'rotate-180' : ''}`}
                  />
                </button>
                {showHistory && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-[24px] border border-slate-200 shadow-lg z-10">
                    <History
                      items={history}
                      onSelectItem={handleSelectHistory}
                      onClearHistory={handleClearHistory}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <ResultDisplay
            data={result}
            isLoading={isLoading}
            error={error}
            isAuthenticated={!!session?.user?.id}
          />
        </div>
      </main>

      <footer className="py-4 px-4 text-center text-sm text-slate-500">
        <div className="mb-2">
          <span className="inline-block px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-medium">
            v1.1.0
          </span>
        </div>
        <p>© CONTXTRA 2025. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
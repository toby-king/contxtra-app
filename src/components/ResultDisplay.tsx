import React from 'react';
import { XCircle, ExternalLink, ThumbsUp, ThumbsDown, AlertCircle, ImageOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Article } from '../services/api';

interface ResultDisplayProps {
  data: {
    matched_articles: Article[];
  } | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, isLoading, error, isAuthenticated }) => {
  const [progress, setProgress] = React.useState(0);
  const [imageErrors, setImageErrors] = React.useState<Set<string>>(new Set());
  const [loadingText, setLoadingText] = React.useState('Fetching context');
  const [hasRatedCurrentAnalysis, setHasRatedCurrentAnalysis] = React.useState(false);
  const [currentRating, setCurrentRating] = React.useState<'positive' | 'negative' | null>(null);

  React.useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (isLoading) {
      setProgress(0);
      setLoadingText('Fetching context');
      setHasRatedCurrentAnalysis(false);
      setCurrentRating(null);
      
      let currentProgress = 0;
      const startTime = Date.now();
      const expectedDuration = 9500; // 9.5 seconds

      progressInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const calculatedProgress = Math.min((elapsedTime / expectedDuration) * 100, 98);
        
        if (calculatedProgress < 98) {
          setProgress(calculatedProgress);
          
          // Update text based on progress
          if (calculatedProgress >= 75) {
            setLoadingText('Matching relevant articles');
          } else if (calculatedProgress >= 50) {
            setLoadingText('Searching thousands of articles');
          }
        } else {
          clearInterval(progressInterval);
          setProgress(98); // Stop at 98% until complete
        }
      }, 50);
    } else {
      setProgress(100);
      setLoadingText('Fetching context');
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isLoading]);

  const handleRating = async (isPositive: boolean) => {
    if (!isAuthenticated || hasRatedCurrentAnalysis || !data) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc(
        isPositive ? 'increment_positive_rating' : 'increment_negative_rating',
        { user_id: user.id }
      );

      if (error) {
        console.error('Error submitting rating:', error);
        return;
      }

      setHasRatedCurrentAnalysis(true);
      setCurrentRating(isPositive ? 'positive' : 'negative');
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  };

  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set(prev).add(url));
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 animate-fade-in">
        <div className="bg-white rounded-[24px] p-6 shadow-md">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-[#622D91] to-[#8B5CF6] rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <p className="text-slate-600 font-medium flex items-center">
              {loadingText}
              <span className="ml-1 animate-pulse-dots">
                <span className="animate-dot-1">.</span>
                <span className="animate-dot-2">.</span>
                <span className="animate-dot-3">.</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 animate-fade-in">
        <div className="bg-red-50 border border-red-200 rounded-[24px] p-6 shadow-md">
          <div className="flex items-start space-x-3">
            <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (data && (!data.matched_articles || data.matched_articles.length === 0)) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 animate-fade-in">
        <div className="bg-white rounded-[24px] p-6 shadow-md">
          <div className="flex items-start space-x-3 text-slate-600">
            <AlertCircle size={20} className="shrink-0 mt-1" />
            <div>
              <p className="font-medium mb-3">No matching articles found. This could be due to one of the following reasons:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>The post doesn't include text</li>
                <li>The post doesn't include sufficient content for CONTXTRA to analyse</li>
                <li>No articles found - post doesn't contain newsworthy topic, or articles are yet to be written about this topic</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getButtonTitle = (isPositiveButton: boolean) => {
    if (!isAuthenticated) return 'Log in to rate';
    if (hasRatedCurrentAnalysis) return 'You have already rated this result';
    return isPositiveButton ? 'Rate Positive' : 'Rate Negative';
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 animate-fade-in">
      <div className="bg-white rounded-[24px] p-6 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Analysis Results</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleRating(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-[24px] transition-colors ${
                hasRatedCurrentAnalysis
                  ? currentRating === 'positive'
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-slate-100 text-slate-400 cursor-default'
                  : isAuthenticated
                    ? 'hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              disabled={!isAuthenticated || hasRatedCurrentAnalysis}
              title={getButtonTitle(true)}
            >
              <ThumbsUp size={18} className={
                hasRatedCurrentAnalysis && currentRating === 'positive' 
                  ? 'text-green-600' 
                  : !isAuthenticated || hasRatedCurrentAnalysis
                    ? 'text-slate-400'
                    : 'text-slate-600'
              } />
              <span className="text-sm">Helpful</span>
            </button>
            <button
              onClick={() => handleRating(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-[24px] transition-colors ${
                hasRatedCurrentAnalysis
                  ? currentRating === 'negative'
                    ? 'bg-red-100 text-red-700 cursor-default'
                    : 'bg-slate-100 text-slate-400 cursor-default'
                  : isAuthenticated
                    ? 'hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              disabled={!isAuthenticated || hasRatedCurrentAnalysis}
              title={getButtonTitle(false)}
            >
              <ThumbsDown size={18} className={
                hasRatedCurrentAnalysis && currentRating === 'negative' 
                  ? 'text-red-600' 
                  : !isAuthenticated || hasRatedCurrentAnalysis
                    ? 'text-slate-400'
                    : 'text-slate-600'
              } />
              <span className="text-sm">Not Helpful</span>
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {data.matched_articles.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-slate-50 p-4 rounded-[24px] border border-slate-200 hover:bg-slate-100 transition-colors duration-200"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 mb-2">{article.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">{article.description}</p>
                  <div className="text-xs text-slate-500">
                    Source: {article.source}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {article.urlToImage && !imageErrors.has(article.urlToImage) ? (
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={() => handleImageError(article.urlToImage)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-200 rounded-lg flex items-center justify-center">
                      <ImageOff size={24} className="text-slate-400" />
                    </div>
                  )}
                  <ExternalLink size={16} className="text-slate-400 shrink-0" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
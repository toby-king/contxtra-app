import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2, AlertCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthProps {
  onAuthSuccess: () => void;
  onClose: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const addToMailerLite = async (email: string, fullName: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-to-mailerlite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          email,
          full_name: fullName
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.warn('MailerLite integration warning:', result);
        // Don't throw error - we don't want to fail signup if MailerLite fails
      } else {
        console.log('Successfully added to MailerLite:', result);
      }
    } catch (error) {
      console.warn('MailerLite integration failed:', error);
      // Don't throw error - we don't want to fail signup if MailerLite fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setError('Please enter your name');
        return;
      }

      if (!agreedToPrivacy) {
        setError('Please read and agree to our Privacy Policy');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name
            }
          }
        });
        
        if (authError) throw authError;

        // Add to MailerLite after successful signup
        await addToMailerLite(email, name);
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (authError) throw authError;
      }
      
      onAuthSuccess();
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('For security purposes, you can only request this after')) {
          setError('Too many attempts. Please wait a few minutes before trying again.');
        } else if (err.message === 'Invalid login credentials') {
          setError(isSignUp 
            ? 'This email is already registered. Please try signing in instead.'
            : 'Invalid email or password. Please check your credentials and try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setName('');
    setAgreedToPrivacy(false);
  };

  return (
    <div className="w-full max-w-md mx-auto relative" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-[24px] shadow-md p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-center justify-center gap-4 mb-8">
          <img src="/icon.png" alt="Logo" className="w-12 h-12" />
          <img src="/textmark.png" alt="Link Analyzer" className="h-8" />
        </div>
        
        <h2 className="text-2xl font-semibold text-center mb-6">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-[24px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-[24px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-[24px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
              required
              minLength={6}
            />
            {isSignUp && (
              <p className="mt-1 text-xs text-slate-500">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          {isSignUp && (
            <div className="flex items-start space-x-3">
              <input
                id="privacy-policy"
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                className="mt-1 h-4 w-4 text-[#622D91] focus:ring-[#622D91] border-slate-300 rounded"
                required={isSignUp}
              />
              <label htmlFor="privacy-policy" className="text-sm text-slate-700 leading-relaxed">
                I have read and agree to the{' '}
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#622D91] hover:text-[#4a2170] underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-[24px]">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-2 px-4 rounded-[24px] text-sm font-medium text-slate-800 bg-[#fbd050] hover:bg-[#f8c83e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fbd050] disabled:opacity-50 transition-colors duration-200 mt-6"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isSignUp ? (
              <>
                <UserPlus size={20} className="mr-2" />
                Sign Up
              </>
            ) : (
              <>
                <LogIn size={20} className="mr-2" />
                Sign In
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="w-full text-sm text-[#622D91] hover:text-[#4a2170] transition-colors duration-200 mt-4"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
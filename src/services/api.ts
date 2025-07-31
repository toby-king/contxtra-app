import { supabase } from '../lib/supabase';

export interface Article {
  title: string;
  description: string;
  content: string;
  url: string;
  source: string;
  score: number;
  urlToImage: string;
}

export interface ApiResponse {
  data: {
    matched_articles: Article[];
  } | null;
  error: string | null;
}

interface TrialUsage {
  remaining_uses: number;
  trial_expired: boolean;
}

export const checkTrialUsage = async (ip: string): Promise<TrialUsage> => {
  const { data, error } = await supabase.rpc('check_trial_usage', {
    client_ip: ip
  });
  
  if (error) throw error;
  return data;
};

export const trackAnalyzerUsage = async (ip: string): Promise<TrialUsage> => {
  const { data, error } = await supabase.rpc('track_analyzer_usage', {
    client_ip: ip
  });
  
  if (error) throw error;
  return data;
};

export const analyzeLink = async (url: string): Promise<ApiResponse> => {
  try {
    const response = await fetch('https://contxtra-api-267101235988.us-central1.run.app/find-articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'include',
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        throw new Error(`Network response error: ${response.status} - No parsable error message from server.`);
      }

      if (errorData && typeof errorData === 'object' && errorData.detail) {
        throw new Error(`API Error (${response.status}): ${errorData.detail}`);
      } else if (Array.isArray(errorData) && errorData.length > 0 && errorData[0].loc && errorData[0].msg) {
        const firstError = errorData[0];
        throw new Error(`Validation Error (${response.status}): ${firstError.msg} at ${firstError.loc.join('.')}`);
      } else {
        throw new Error(`API Error (${response.status}): ${JSON.stringify(errorData)}`);
      }
    }
    
    const data = await response.json();
    
    return {
      data,
      error: null
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};
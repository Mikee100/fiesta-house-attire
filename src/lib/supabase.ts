import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const isConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!isConfigured) {
  console.warn("Supabase credentials missing. Portfolio data will fallback to local mock.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Portfolio = {
  id: string;
  title: string;
  slug: string;
  order: number;
  created_at: string;
};

export type PortfolioImage = {
  id: string;
  portfolio_id: string;
  url: string;
  order: number;
  created_at: string;
};

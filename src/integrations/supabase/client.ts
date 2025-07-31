// Import the Supabase client creation function and the Database type
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Load the Supabase URL and API key from environment variables
// These variables are defined in the .env file and accessed using Vite's `import.meta.env`
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL; // The base URL of your Supabase project
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY; // The public API key (anon key) for your Supabase project

// Create and export a Supabase client instance
// The client is configured to interact with your Supabase database using the provided URL and API key
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
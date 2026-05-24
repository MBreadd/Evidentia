import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://isrrpbgonhgdsifwbrol.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzcnJwYmdvbmhnZHNpZndicm9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjM2MDksImV4cCI6MjA5NTAzOTYwOX0.repr7wlHe4sg8M6Hd4fhyqfDGRGXsT5vTtPpHNtuHWw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://slvtkdnrydybeebbcfcz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdnRrZG5yeWR5YmVlYmJjZmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTgzOTIsImV4cCI6MjA4MDA5NDM5Mn0.dWGWBkWrg8GMCGiCnhK3K81w7M65y6u2dbDPXlLAqH8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

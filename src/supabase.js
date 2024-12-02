import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://qtbqzufcvvaqaadcqsbj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0YnF6dWZjdnZhcWFhZGNxc2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwNjg2NTEsImV4cCI6MjA0ODY0NDY1MX0.V_3fnZuMaICuShj5z2gpgy_ZzOm6jDWomJhNqwaMJkE')

export default supabase;
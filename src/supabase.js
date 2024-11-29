import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabase = createClient('https://upwupaixeibkffuhkisg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3VwYWl4ZWlia2ZmdWhraXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5MzMxMTAsImV4cCI6MjA0NzUwOTExMH0.PH43er5FqXqil2qKTUZzZ_FsstwtWJ9rEGchI3x-9iw')

export default supabase;
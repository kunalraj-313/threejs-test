import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase URL and anon key
const supabaseUrl = 'https://eoaghysijntknexkhvzh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWdoeXNpam50a25leGtodnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNjc4NTcsImV4cCI6MjA3MTk0Mzg1N30.VgVHV--TD0O-56Ath-LbhyI0Y9V1aVtlk1VZF6NpRR8'

export const supabase = createClient(supabaseUrl, supabaseKey)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://ekutpyoysckhjytbffqo.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrdXRweW95c2NraGp5dGJmZnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMjMwNjYsImV4cCI6MjA4OTg5OTA2Nn0.iBi1DraNzSzgh-H6FKM7ji4AZ8OlRrQClYU2hQdgzyY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

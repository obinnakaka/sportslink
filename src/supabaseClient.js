import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://corlbqrrqzcbdaxniheo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcmxicXJycXpjYmRheG5paGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3ODQzNTAsImV4cCI6MjA4MDM2MDM1MH0.oQWIv5ZG3hFZY1G9Jr7BX5YOMyDGlU9uLbjDV_4S0NM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;

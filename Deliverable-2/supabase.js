const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || "https://eyvslczgyicehohpdoek.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dnNsY3pneWljZWhvaHBkb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTY0NjYsImV4cCI6MjA5MDE3MjQ2Nn0.nwc0Pp9X8Uwh_NVRLt3Em8UOq2XHTMs1mSacC1RpAEA";

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase configuration is missing.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;

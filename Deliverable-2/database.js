const { createClient } = require('@supabase/supabase-js');

// Configured for Deliverable 2 using the lightweight Supabase backend
const supabaseUrl = 'https://eyvslczgyicehohpdoek.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dnNsY3pneWljZWhvaHBkb2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1OTY0NjYsImV4cCI6MjA5MDE3MjQ2Nn0.nwc0Pp9X8Uwh_NVRLt3Em8UOq2XHTMs1mSacC1RpAEA';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
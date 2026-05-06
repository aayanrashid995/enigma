require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Fail-safe to ensure the server stops if keys aren't found
if (!supabaseUrl || !supabaseKey) {
    console.error("FATAL ERROR: Supabase credentials missing from .env file.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
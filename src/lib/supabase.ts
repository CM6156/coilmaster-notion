import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with updated credentials
const supabaseUrl = 'https://ojqhiqkxdskbjnhzpemt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qcWhpcWt4ZHNrYmpuaHpwZW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MzY3MDcsImV4cCI6MjA2MzMxMjcwN30.7DWuGn_Nn_m2w88p4wDnv1z8_LZrhKR4CGJEDOj-Ong';

// Create a single supabase client instance for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

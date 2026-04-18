import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://vkylxedxgcxrxfezmaau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZreWx4ZWR4Z2N4cnhmZXptYWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1Mjg1NTcsImV4cCI6MjA5MjEwNDU1N30.QLAB88lwIAwc0IZ2bOwF8cw3QBkcidW9zac7LCvaMiw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

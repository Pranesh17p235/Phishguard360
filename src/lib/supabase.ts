import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qafengzorxqkmcaoxibi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZmVuZ3pvcnhxa21jYW94aWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MTU1ODIsImV4cCI6MjA5Nzk5MTU4Mn0.PPlHk4jgF7ck4sPOqlwrg-vP-oW3l_flxtv_Iwe8x4E'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

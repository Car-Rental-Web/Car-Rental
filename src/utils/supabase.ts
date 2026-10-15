import {createClient} from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey)


const supabaseLaundryUrl = import.meta.env.VITE_SUPABASE_LAUNDRY_URL;
const supabaseLaundryKey = import.meta.env.VITE_SUPABASE_LAUNDRY_ANON_KEY;

export const supabaseLaundry = createClient(supabaseLaundryUrl, supabaseLaundryKey)


const supabaseWaterUrl = import.meta.env.VITE_SUPABASE_WATER_URL;
const supabaseWaterKey = import.meta.env.VITE_SUPABASE_WATER_ANON_KEY;

export const supabaseWater = createClient(supabaseWaterUrl, supabaseWaterKey)

console.log(
  "laundry:",
  supabaseLaundryUrl,
  supabaseLaundryKey?.length,
  supabaseLaundryKey?.slice(0, 12),
);
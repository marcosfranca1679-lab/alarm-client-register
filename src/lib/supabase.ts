import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://adyauaubmitdkfbutgix.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Ugmm5Baa21OQAqPF4wB_9A_EdqzF0gx";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

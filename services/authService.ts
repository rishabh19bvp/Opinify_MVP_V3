import { createClient } from '@supabase/supabase-js';

// It's recommended to store these in environment variables
// For this example, we'll hardcode them but you should use a .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Make sure .env file is set up correctly.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sends an OTP to the user's phone number by invoking our custom Edge Function.
 * @param phone The user's phone number with country code.
 */
export const sendOtp = async (phone: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

/**
 * Verifies the OTP and signs the user in.
 * @param phone The user's phone number.
 * @param token The OTP token from the SMS.
 */
export const verifyOtp = async (phone: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

/**
 * Signs the current user out.
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}; 
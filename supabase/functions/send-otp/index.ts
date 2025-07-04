// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Hello from Functions!")

// Function to generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      throw new Error('Phone number is required.');
    }

    const otp = generateOTP();
    const authKey = Deno.env.get('MSG91_AUTH_KEY');
    
    // As per the PRD, we are hardcoding the sender ID for now.
    const senderId = 'OPNIFY'; 

    if (!authKey) {
      throw new Error('MSG91_AUTH_KEY is not set in project secrets.');
    }

    // Construct the message. ##OTP## is the placeholder Msg91 uses.
    const message = `Your OTP for Opinify is ##OTP##.`;
    
    // Construct the URL for the Msg91 API
    const url = `http://api.msg91.com/api/sendotp.php?authkey=${authKey}&mobile=${phone}&message=${encodeURIComponent(message)}&sender=${senderId}&otp=${otp}`;

    const response = await fetch(url, {
      method: 'GET',
    });

    const responseData = await response.json();

    if (responseData.type !== 'success') {
      throw new Error(responseData.message || 'Failed to send OTP via Msg91.');
    }

    // For security, we only return a success message, not the OTP itself.
    return new Response(
      JSON.stringify({
        message: 'An OTP has been sent to your phone number.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-otp' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

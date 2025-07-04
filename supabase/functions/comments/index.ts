// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { authenticate } from '../_shared/authMiddleware.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url);
  const pollId = url.searchParams.get('poll_id');
  const commentId = url.searchParams.get('id');

  // GET is public
  if (req.method === 'GET') {
    if (!pollId) return new Response(JSON.stringify({ error: 'poll_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const { data, error } = await supabase
      .from('comments')
      .select('*, author:users(*)')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Other methods require auth
  const authResult = await authenticate(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  switch(req.method) {
    case 'POST': {
      const { content, poll_id, parent_comment_id } = await req.json();
      const { data, error } = await supabase
        .from('comments')
        .insert({ content, poll_id, user_id: user.id, parent_comment_id })
        .select()
        .single();
      
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(data), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    case 'PUT': {
      if (!commentId) return new Response(JSON.stringify({ error: 'Comment ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { content } = await req.json();
      const { data, error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', commentId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    case 'DELETE': {
      if (!commentId) return new Response(JSON.stringify({ error: 'Comment ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ message: 'Comment deleted' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    default:
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/comments' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

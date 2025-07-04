import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { authenticate } from '../_shared/authMiddleware.ts'
import { z } from 'https://deno.land/x/zod/mod.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
)

const pollCreateSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  options: z.array(z.object({
    text: z.string().min(1, { message: "Option text cannot be empty" })
  })).min(2, { message: "Must have at least two options" }),
  category_id: z.number().int().positive(),
  ward_id: z.number().int().positive(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url);
  const pollId = url.searchParams.get('id');

  // Publicly accessible GET requests
  if (req.method === 'GET') {
    if (pollId) {
      // Get a single poll
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          options (*, votes (count)),
          author:users (*),
          category:categories (*),
          ward:wards (*)
        `)
        .eq('id', pollId)
        .single();
      
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } else {
      // Get all polls
      const { data, error } = await supabase
        .from('polls')
        .select(`*, options (*), author:users (*), category:categories (*), ward:wards (*)`);
      
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  // Authenticated requests
  const authResult = await authenticate(req);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  switch (req.method) {
    case 'POST': {
      const body = await req.json();
      const validation = pollCreateSchema.safeParse(body);

      if (!validation.success) {
        return new Response(JSON.stringify({ error: validation.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { title, description, options, category_id, ward_id } = validation.data;
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert({ title, description, user_id: user.id, category_id, ward_id })
        .select()
        .single();

      if (pollError) return new Response(JSON.stringify({ error: pollError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const optionsWithPollId = options.map(opt => ({ ...opt, poll_id: pollData.id }));
      const { error: optionsError } = await supabase.from('options').insert(optionsWithPollId);

      if (optionsError) return new Response(JSON.stringify({ error: optionsError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      
      return new Response(JSON.stringify(pollData), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    case 'PUT': {
       if (!pollId) return new Response(JSON.stringify({ error: 'Poll ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const updates = await req.json();
      const { data, error } = await supabase
        .from('polls')
        .update(updates)
        .eq('id', pollId)
        .eq('user_id', user.id) // Ensure only owner can update
        .select()
        .single();

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    case 'DELETE': {
      if (!pollId) return new Response(JSON.stringify({ error: 'Poll ID is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId)
        .eq('user_id', user.id); // Ensure only owner can delete

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ message: 'Poll deleted' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    default:
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})

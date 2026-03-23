import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { workspace_id, line_items, save, deal_id } = await req.json()
    
    if (!workspace_id) {
      return new Response(JSON.stringify({ error: 'workspace_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const total_net = line_items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)

    let calculation_id = null
    if (save) {
      const { data, error } = await supabase
        .from('dev_calculations')
        .insert({
          workspace_id,
          created_by: req.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000000',
          deal_id,
          line_items,
          total_net
        })
        .select('id')
        .single()
      
      if (error) throw error
      calculation_id = data.id
    }

    return new Response(
      JSON.stringify({
        total_net,
        calculation_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

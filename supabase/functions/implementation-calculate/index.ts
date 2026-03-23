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

    let suma_jdn = 0
    let suma_mies = 0
    let suma_rocz = 0

    const line_items_with_subtotals = line_items.map((item: any) => {
      const subtotal = (item.cena || 0) * (item.ilosc || 0)
      if (['Jednorazowo', 'Ratalna', 'Leasing'].includes(item.model)) {
        suma_jdn += subtotal
      } else if (item.model === 'Miesięcznie') {
        suma_mies += subtotal
      } else if (item.model === 'Rocznie') {
        suma_rocz += subtotal
      }
      return { ...item, subtotal }
    })

    let calculation_id = null
    if (save) {
      const { data, error } = await supabase
        .from('implementation_calculations')
        .insert({
          workspace_id,
          created_by: req.headers.get('x-user-id') || '00000000-0000-0000-0000-000000000000',
          deal_id,
          line_items: line_items_with_subtotals,
          suma_jdn,
          suma_mies,
          suma_rocz
        })
        .select('id')
        .single()
      
      if (error) throw error
      calculation_id = data.id
    }

    return new Response(
      JSON.stringify({
        line_items_with_subtotals,
        suma_jdn,
        suma_mies,
        suma_rocz,
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

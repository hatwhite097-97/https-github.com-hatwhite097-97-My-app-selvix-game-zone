import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const action = payload.action;
    const apiKey = Deno.env.get('SPEEDPESA_API_KEY');

    if (!apiKey) {
      throw new Error('SpeedPesa API key not configured');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey
    }

    if (action === 'REQUEST_PAYMENT') {
      const response = await fetch('https://api.speedpesa.com/v1/payments/request', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phonenumber: payload.phonenumber, // Format: 255750020767
          amount: payload.amount.toString(),
          reference: 'TX-' + Date.now()
        })
      });
      const data = await response.json();
      return new Response(JSON.stringify({ success: true, message: "Malipo yameombwa", data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    if (action === 'CHECK_STATUS') {
      const response = await fetch(`https://api.speedpesa.com/v1/payments/status/${payload.reference}`, {
        method: 'GET',
        headers
      });
      const data = await response.json();
      const currentStatus = data.status;

      // Update Supabase DB if payment was successful
      if (currentStatus === 'SUCCESS') {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'SUCCESS' })
          .eq('reference', payload.reference)
      }

      return new Response(JSON.stringify({ success: true, status: currentStatus }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'DISBURSEMENT') {
      const response = await fetch('https://api.speedpesa.com/v1/disbursements/withdraw', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phonenumber: payload.phonenumber,
          amount: payload.amount.toString(),
          reference: 'WD-' + Date.now()
        })
      });
      const data = await response.json();
      return new Response(JSON.stringify({ success: true, message: "Kutoa fedha kumeshughulikiwa", data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'CHECK_BALANCE') {
      const response = await fetch('https://api.speedpesa.com/v1/merchant/balance', {
        method: 'GET',
        headers
      });
      const data = await response.json();
      return new Response(JSON.stringify({ success: true, balance: data.balance }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ success: false, message: "Action haitambuliki" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

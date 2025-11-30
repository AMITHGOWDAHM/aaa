import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('=== CREATE ORDER FUNCTION STARTED ===');
  
  try {
    // Parse request body
    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { amount, currency = 'INR', dataset_id } = requestBody;

    // Validate input
    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount);
      return new Response(
        JSON.stringify({ error: 'Invalid amount', received: amount }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Razorpay credentials from environment
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    console.log('Environment check:');
    console.log('- RAZORPAY_KEY_ID exists:', !!razorpayKeyId);
    console.log('- RAZORPAY_KEY_SECRET exists:', !!razorpayKeySecret);
    console.log('- Key ID starts with rzp_:', razorpayKeyId?.startsWith('rzp_'));
    console.log('- Key ID length:', razorpayKeyId?.length);

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Missing Razorpay credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Payment service configuration error',
          debug: {
            hasKeyId: !!razorpayKeyId,
            hasKeySecret: !!razorpayKeySecret,
            keyIdPrefix: razorpayKeyId?.substring(0, 8) || 'none'
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate key format
    if (!razorpayKeyId.startsWith('rzp_')) {
      console.error('Invalid Razorpay key format:', razorpayKeyId.substring(0, 10));
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Razorpay key format',
          keyPrefix: razorpayKeyId.substring(0, 10)
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Basic Auth header
    const credentials = `${razorpayKeyId}:${razorpayKeySecret}`;
    const auth = btoa(credentials);
    console.log('Auth header created, length:', auth.length);

    // Prepare order data
    const orderData = {
      amount: Math.round(amount), // Amount should already be in paise
      currency: currency,
      payment_capture: 1,
      notes: {
        dataset_id: dataset_id?.toString() || '',
        created_via: 'supabase_edge_function',
        timestamp: new Date().toISOString()
      }
    };

    console.log('Order data prepared:', {
      ...orderData,
      notes: { ...orderData.notes, dataset_id: orderData.notes.dataset_id }
    });

    // Call Razorpay API to create order
    console.log('Calling Razorpay API...');
    
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0'
      },
      body: JSON.stringify(orderData),
    });

    console.log('Razorpay response status:', razorpayResponse.status);
    console.log('Razorpay response headers:', Object.fromEntries(razorpayResponse.headers.entries()));

    const responseText = await razorpayResponse.text();
    console.log('Razorpay response body:', responseText);
    
    if (!razorpayResponse.ok) {
      console.error('Razorpay API error details:', {
        status: razorpayResponse.status,
        statusText: razorpayResponse.statusText,
        headers: Object.fromEntries(razorpayResponse.headers.entries()),
        body: responseText
      });
      
      // Try to parse error response
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch (e) {
        errorDetails = { raw_response: responseText };
      }
      
      return new Response(
        JSON.stringify({
          error: 'Razorpay API failed',
          status: razorpayResponse.status,
          details: errorDetails,
          debug_info: {
            keyIdUsed: razorpayKeyId.substring(0, 12) + '...',
            requestAmount: amount,
            requestCurrency: currency
          }
        }),
        {
          status: razorpayResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse successful response
    let orderResult;
    try {
      orderResult = JSON.parse(responseText);
      console.log('Razorpay order created successfully:', {
        id: orderResult.id,
        amount: orderResult.amount,
        currency: orderResult.currency,
        status: orderResult.status
      });
    } catch (parseError) {
      console.error('Failed to parse Razorpay response:', parseError);
      return new Response(
        JSON.stringify({
          error: 'Invalid response from payment gateway',
          raw_response: responseText.substring(0, 500)
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('=== CREATE ORDER FUNCTION COMPLETED SUCCESSFULLY ===');

    return new Response(
      JSON.stringify(orderResult),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('=== CREATE ORDER FUNCTION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
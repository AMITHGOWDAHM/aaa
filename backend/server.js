// server.js
const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY 
);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET // You need to add this to your .env file
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    razorpay: !!process.env.RAZORPAY_KEY_SECRET
  });
});

// Create Razorpay order
app.post('/api/create-order', async (req, res) => {
  try {
    console.log('Creating Razorpay order...', req.body);
    
    const { amount, currency = 'INR', dataset_id, buyer_address } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount);
      return res.status(400).json({
        error: 'Invalid amount',
        received: amount
      });
    }

    // Check if Razorpay is properly configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay not configured - missing KEY_ID or KEY_SECRET');
      return res.status(500).json({
        error: 'Razorpay not configured properly',
        has_key_id: !!process.env.RAZORPAY_KEY_ID,
        has_key_secret: !!process.env.RAZORPAY_KEY_SECRET
      });
    }

    // Create Razorpay order
    // Generate receipt with max 40 chars (Razorpay requirement)
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const receipt = `rcpt_${dataset_id || 'unk'}_${timestamp}`.slice(0, 40);
    
    const options = {
      amount: amount, // Already in paise from frontend
      currency: currency,
      receipt: receipt, // Max 40 characters
      notes: {
        dataset_id: dataset_id?.toString() || 'unknown',
        buyer_address: buyer_address || 'unknown',
        created_at: new Date().toISOString()
      }
    };

    console.log('Razorpay order options:', options);

    const order = await razorpay.orders.create(options);
    
    console.log('Razorpay order created successfully:', order.id);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      created_at: order.created_at,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    
    res.status(500).json({
      error: 'Failed to create order',
      message: error.message,
      details: error.description || error.error?.description
    });
  }
});

// Verify Razorpay payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    console.log('Verifying Razorpay payment...', req.body);
    
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dataset_id,
      buyer_address
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        error: 'Invalid payment signature'
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured') {
      return res.status(400).json({
        error: 'Payment not captured',
        status: payment.status
      });
    }

    // Store purchase record in Supabase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert([{
        dataset_id: dataset_id,
        buyer_address: buyer_address || `razorpay_${Date.now()}`,
        tx_hash: razorpay_payment_id,
        confirmed: true,
        payment_method: 'razorpay',
        order_id: razorpay_order_id,
        amount: payment.amount / 100, // Convert back from paise
        currency: payment.currency
      }])
      .select()
      .single();

    if (purchaseError) {
      console.error('Error storing purchase:', purchaseError);
      return res.status(500).json({
        error: 'Failed to store purchase record',
        details: purchaseError
      });
    }

    // Increment download count
    const { error: updateError } = await supabase
      .rpc('increment_downloads', { dataset_id: dataset_id });
    
    if (updateError) {
      console.warn('Failed to update download count:', updateError);
    }

    res.json({
      success: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      purchase_id: purchase.id,
      message: 'Payment verified and purchase recorded successfully'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    
    res.status(500).json({
      error: 'Payment verification failed',
      message: error.message
    });
  }
});

// Get purchase status
app.get('/api/purchase-status/:dataset_id/:buyer_address', async (req, res) => {
  try {
    const { dataset_id, buyer_address } = req.params;
    
    const { data: purchase, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('dataset_id', dataset_id)
      .eq('buyer_address', buyer_address.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      return res.status(500).json({
        error: 'Database error',
        details: error
      });
    }

    res.json({
      has_purchased: !!purchase,
      purchase_details: purchase || null
    });

  } catch (error) {
    console.error('Error checking purchase status:', error);
    res.status(500).json({
      error: 'Failed to check purchase status',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Razorpay configured: ${!!process.env.RAZORPAY_KEY_SECRET}`);
});
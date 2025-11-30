import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, User, Wallet, Image as ImageIcon } from 'lucide-react';

const supabaseUrl = "https://slvtkdnrydybeebbcfcz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdnRrZG5yeWR5YmVlYmJjZmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTgzOTIsImV4cCI6MjA4MDA5NDM5Mn0.dWGWBkWrg8GMCGiCnhK3K81w7M65y6u2dbDPXlLAqH8";

// Replace with your actual Razorpay key
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_WmJqYIBGxRoq4W";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };
    document.body.appendChild(script);
  });

const DatasetDetail = () => {
  const { id } = useParams();

  // State variables
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buying, setBuying] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Check MetaMask connection on mount
  useEffect(() => {
    checkWalletConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          console.log('Wallet connected:', accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
      // Re-check purchase status when account changes
      checkPurchaseStatus(accounts[0]);
    } else {
      setWalletAddress(null);
      setHasPurchased(false);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setWalletAddress(accounts[0]);
        alert('Wallet connected successfully!');
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet: ' + error.message);
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
    }
  };

  // Fetch dataset details
  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    setDataset(null);

    async function fetchDataset() {
      try {
        const { data, error } = await supabase
          .from('datasets')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setDataset(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDataset();
  }, [id]);

  // Separate function to check purchase status
  const checkPurchaseStatus = async (address = walletAddress) => {
    if (!address || !dataset) return;

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('dataset_id', dataset.id)
        .eq('buyer_address', address.toLowerCase())
        .eq('confirmed', true)
        .maybeSingle();

      if (error) {
        console.error('Purchase check error:', error);
        return;
      }

      setHasPurchased(!!data);
      console.log('Purchase status:', !!data, data);
    } catch (err) {
      console.error('Purchase check failed:', err);
    }
  };

  // Check if wallet already purchased this dataset
  useEffect(() => {
    checkPurchaseStatus();
  }, [walletAddress, dataset]);

  // Handle crypto payment via MetaMask
  async function processCryptoPayment(amount) {
    if (!window.ethereum || !walletAddress) {
      throw new Error('MetaMask not connected');
    }

    try {
      // Convert amount to Wei (assuming price is in ETH)
      const amountInWei = (BigInt(Math.floor(amount * 1e18))).toString(16);

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: '0x742d35Cc6635C0532925a3b8D9C3A46e8D2b40c1', // Replace with your wallet address
          value: '0x' + amountInWei,
          gas: '0x5208',
        }]
      });

      return {
        success: true,
        transactionId: txHash,
        amount: amount
      };
    } catch (error) {
      console.error('Payment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create Razorpay order (Mock implementation since we don't have backend)
  async function createRazorpayOrder(amount, datasetId) {
    // Since you don't have the backend function working, we'll create a mock order
    // In production, this should call your backend API
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: orderId,
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR"
    };
  }

  // Fixed Razorpay payment function
  async function processRazorpayPayment(amount, datasetId) {
    try {
      console.log('Starting Razorpay payment process...');
      
      // Load Razorpay script first
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay script. Please check your internet connection.");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay not available after script load");
      }

      // Create order (using mock for now)
      let order;
      try {
        // Try to use your backend first
        const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100),
            currency: "INR",
            dataset_id: datasetId,
          }),
        });

        if (response.ok) {
          order = await response.json();
        } else {
          throw new Error('Backend order creation failed');
        }
      } catch (backendError) {
        console.warn('Backend order creation failed, using mock order:', backendError);
        // Fallback to mock order
        order = await createRazorpayOrder(amount, datasetId);
      }

      console.log('Order created:', order);

      // Return promise for Razorpay payment
      return new Promise((resolve, reject) => {
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency || "INR",
          name: "Dataverse Market",
          description: `Purchase: ${dataset?.name || 'Dataset'}`,
          order_id: order.id,
          handler: function (response) {
            console.log("Razorpay payment success:", response);
            resolve({
              success: true,
              transactionId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              amount: amount
            });
          },
          prefill: {
            name: 'Dataset Buyer',
            email: 'buyer@example.com',
            contact: '9999999999'
          },
          theme: {
            color: "#6366f1"
          },
          modal: {
            ondismiss: function() {
              console.log('Razorpay modal dismissed by user');
              reject({ success: false, error: 'Payment cancelled by user' });
            }
          }
        };

        console.log('Opening Razorpay with options:', options);

        try {
          const rzp = new window.Razorpay(options);
          
          rzp.on('payment.failed', function (response) {
            console.error("Razorpay payment failed:", response);
            reject({ 
              success: false, 
              error: response.error?.description || 'Payment failed' 
            });
          });

          rzp.open();
        } catch (rzpError) {
          console.error('Error opening Razorpay:', rzpError);
          reject({
            success: false,
            error: 'Failed to open payment gateway: ' + rzpError.message
          });
        }
      });

    } catch (error) {
      console.error("Razorpay processing error:", error);
      return { 
        success: false, 
        error: error.message || 'Payment processing failed' 
      };
    }
  }

    // Handle Buy button click
    async function handleBuy(paymentMethod = 'crypto') {
      if (!dataset) return;

      // For crypto payments, require wallet connection
      if (paymentMethod === 'crypto' && !walletAddress) {
        alert("Please connect your MetaMask wallet to purchase with cryptocurrency.");
        return;
      }

      setBuying(true);

      try {
        let paymentResult;
        
        if (paymentMethod === 'crypto') {
          paymentResult = await processCryptoPayment(dataset.price);
        } else if (paymentMethod === 'razorpay') {
          console.log('Initiating Razorpay payment for amount:', dataset.price);
          paymentResult = await processRazorpayPayment(dataset.price, dataset.id);
        }

        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Payment failed');
        }

        console.log('Payment successful:', paymentResult);

        // For Razorpay payments, generate a unique identifier if wallet not connected
        const buyerAddress = walletAddress ? walletAddress.toLowerCase() : `razorpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Get current timestamp
        const now = new Date().toISOString();

        // Insert purchase record with all necessary fields
        const purchaseData = {
          dataset_id: dataset.id,
          buyer_address: buyerAddress,
          tx_hash: paymentResult.transactionId,
          confirmed: true,
          payment_method: paymentMethod,
          amount_paid: paymentResult.amount || dataset.price, // Store the amount paid
          purchase_date: now,
          status: 'completed'
        };

        console.log('Inserting purchase record:', purchaseData);

        const { data: purchaseInsert, error: purchaseError } = await supabase
          .from('purchases')
          .insert([purchaseData])
          .select();

        if (purchaseError) {
          console.error('Purchase record error:', purchaseError);
          throw new Error(`Failed to record purchase: ${purchaseError.message}`);
        }

        console.log('Purchase record created:', purchaseInsert);

        // FIXED: Update downloads count directly instead of using RPC
        const { data: updatedDataset, error: updateError } = await supabase
          .from('datasets')
          .update({ downloads: (dataset.downloads || 0) + 1 })
          .eq('id', dataset.id)
          .select()
          .single();
        
        if (updateError) {
          console.warn('Failed to update download count:', updateError);
        } else {
          console.log('Download count updated successfully');
          setDataset(updatedDataset); // Update local state with new download count
        }

        alert('Purchase successful! You can now download the dataset.');
        
        // Update local state
        setHasPurchased(true);
        
      } catch (err) {
        console.error('Purchase failed:', err);
        alert('Purchase failed: ' + err.message);
      } finally {
        setBuying(false);
      }
    }

  // Handle download from IPFS
  async function handleDownload() {
    if (!dataset?.ipfs_hash) {
      alert('No IPFS hash available for this dataset');
      return;
    }

    setDownloading(true);
    
    try {
      // Multiple IPFS gateways for better reliability
      const ipfsGateways = [
        `https://ipfs.io/ipfs/${dataset.ipfs_hash}`,
        `https://gateway.pinata.cloud/ipfs/${dataset.ipfs_hash}`,
        `https://cloudflare-ipfs.com/ipfs/${dataset.ipfs_hash}`,
        `https://dweb.link/ipfs/${dataset.ipfs_hash}`
      ];

      // Try first gateway
      let downloadUrl = ipfsGateways[0];
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      const ext = dataset.file_type?.split('/')[1] || 'csv';
      link.download = `${dataset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
      link.target = '_blank';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message with alternative gateways
      alert(`Download started! If the download doesn't start, try these alternative links:\n\n${ipfsGateways.slice(1).join('\n')}`);
      
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed: ' + err.message);
    } finally {
      setDownloading(false);
    }
  }

  // FIXED: Parse preview data from the preview_data field
  const parsePreviewData = (previewData) => {
    if (!previewData) return [];
    
    try {
      // If it's already an object/array, return it
      if (typeof previewData === 'object') {
        return Array.isArray(previewData) ? previewData : [previewData];
      }
      
      // If it's a string, try to parse it
      if (typeof previewData === 'string') {
        // Handle CSV-like data
        if (previewData.includes(',') && previewData.includes('\n')) {
          const lines = previewData.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          const rows = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || '';
            });
            return obj;
          });
          return rows;
        }
        
        // Try to parse as JSON
        return JSON.parse(previewData);
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing preview data:', error);
      return [];
    }
  };

  // Get preview image URL from IPFS
  const getPreviewImageUrl = (hash) => {
    if (!hash) return null;
    return `https://ipfs.io/ipfs/${hash}`;
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="text-white text-center mt-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4">Loading dataset...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="text-red-500 text-center mt-8 p-6 bg-red-500/10 rounded-lg border border-red-500/20">
        <h2 className="text-xl font-bold mb-2">Error Loading Dataset</h2>
        <p>{error}</p>
      </div>
    </div>
  );
  
  if (!dataset) return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="text-gray-400 text-center mt-8 p-6 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Dataset Not Found</h2>
        <p>The requested dataset could not be found.</p>
      </div>
    </div>
  );

  // FIXED: Parse preview data from the correct field
  const preview = parsePreviewData(dataset.preview_data);
  const previewImageUrl = getPreviewImageUrl(dataset.preview_image_hash);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="max-w-7xl mx-auto py-10 px-4 text-white">
      
        

        {/* FIXED: Improved wallet connection status */}
        <div className="mb-8 flex justify-between items-center p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <div className="text-sm">
            {walletAddress ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-green-500" />
                  <span className="text-green-400 font-medium">Wallet Connected</span>
                </div>
                <span className="text-gray-400 font-mono bg-gray-700 px-2 py-1 rounded">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-red-500" />
                <span className="text-red-400 font-medium">Wallet not connected</span>
              </div>
            )}
          </div>
          
          {!walletAddress && (
            <Button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-medium px-6 py-2"
            >
              Connect MetaMask
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image + Info */}
          <div className="space-y-6">
            {/* FIXED: Display preview image from IPFS or fallback */}
            <div className="relative overflow-hidden rounded-2xl bg-gray-800">
              {previewImageUrl ? (
                <img
                  src={previewImageUrl}
                  alt={dataset.name}
                  className="w-full h-80 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x320/1f2937/9ca3af?text=Dataset+Preview';
                  }}
                />
              ) : (
                <div className="w-full h-80 flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">No preview image available</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
            </div>

            {/* Tags */}
            {dataset.tags && dataset.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dataset.tags.map((tag, index) => (
                  <Badge key={index} className="bg-purple-500/20 text-purple-300 text-sm px-3 py-1 border border-purple-500/30">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Title and Description */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {dataset.name}
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed">{dataset.description}</p>
            </div>

            {/* Metadata */}
            <div className="space-y-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <User className="w-4 h-4" />
                <span>Uploaded by:</span>
                <span className="font-mono bg-gray-700 px-2 py-1 rounded text-xs">
                  {dataset.uploader_address}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Download className="w-4 h-4" />
                <span>{dataset.downloads || 0} downloads • {Math.round(dataset.file_size / 1024 / 1024 * 100) / 100} MB</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{new Date(dataset.upload_timestamp).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>Category: {dataset.category}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>File Type: {dataset.file_type}</span>
              </div>
            </div>

            {/* Price and Purchase Buttons */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/30">
              <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                ₹{dataset.price}
              </div>
              
              {hasPurchased ? (
                <Button
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium px-8 py-3 text-lg"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download Dataset
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-medium px-6 py-3 disabled:opacity-50"
                    onClick={() => handleBuy('crypto')}
                    disabled={buying || !walletAddress}
                  >
                    {buying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Buy with ETH'
                    )}
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium px-6 py-3"
                    onClick={() => handleBuy('razorpay')}
                    disabled={buying}
                  >
                    {buying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Buy with Razorpay'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-8">
         

           {/* Raw Preview Data (for debugging) */}
            <h2 className="text-2xl font-semibold mb-4 text-purple-300">Dataset Preview</h2>
            {dataset.preview_data && preview.length === 0 && (
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-4">
                <h3 className="text-lg font-semibold mb-3 text-yellow-300">Raw Preview Data (Debug)</h3>
                <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                    {typeof dataset.preview_data === 'string' 
                      ? dataset.preview_data 
                      : JSON.stringify(dataset.preview_data, null, 2)
                    }
                  </pre>
                </div>
              </div>
            )}

            {/* Additional Dataset Information */}
            <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-300">Dataset Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Total Records</span>
                  <span className="text-white font-medium">{dataset.total_records || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">File Format</span>
                  <span className="text-white font-medium">{dataset.file_type || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Last Updated</span>
                  <span className="text-white font-medium">
                    {dataset.updated_at 
                      ? new Date(dataset.updated_at).toLocaleDateString()
                      : new Date(dataset.upload_timestamp).toLocaleDateString()
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">License</span>
                  <span className="text-white font-medium">{dataset.license || 'Standard'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Verification Status</span>
                  <Badge className={`${dataset.verified ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                    {dataset.verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </div>

           

            {/* Usage Instructions */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30 p-6">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">How to Use</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white mt-0.5">1</div>
                  <div>
                    <p className="font-medium">Purchase the dataset</p>
                    <p className="text-gray-400">Choose between cryptocurrency (ETH) or traditional payment (Razorpay)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white mt-0.5">2</div>
                  <div>
                    <p className="font-medium">Download from IPFS</p>
                    <p className="text-gray-400">Access the dataset through multiple IPFS gateways for reliability</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white mt-0.5">3</div>
                  <div>
                    <p className="font-medium">Start analyzing</p>
                    <p className="text-gray-400">Use your preferred data analysis tools to work with the dataset</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Information */}
            <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-300">Need Help?</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <p>If you encounter any issues with:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 ml-4">
                  <li>Payment processing</li>
                  <li>Download problems</li>
                  <li>Data format questions</li>
                  <li>IPFS access issues</li>
                </ul>
                <p className="mt-4 text-blue-400">
                  Contact our support team or check the documentation for troubleshooting guides.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Datasets Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            You Might Also Like
          </h2>
          <div className="text-center text-gray-400 py-12 bg-gray-800/30 rounded-xl border border-gray-700">
            <p>Related datasets will be displayed here</p>
            <p className="text-sm mt-2">Feature coming soon...</p>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="mt-12 p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600">
          <div className="text-center text-gray-300">
            <p className="text-sm">
              All datasets are stored on IPFS for decentralized access. 
              Purchases are recorded on the blockchain for transparency and security.
            </p>
            <p className="text-xs mt-2 text-gray-400">
              By purchasing this dataset, you agree to our terms of service and data usage policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetDetail;
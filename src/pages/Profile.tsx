
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeb3 } from '@/contexts/Web3Context';
import { createClient } from '@supabase/supabase-js';
import { User, Upload, Download, Wallet, Calendar, Eye, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';

const supabaseUrl = "https://slvtkdnrydybeebbcfcz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdnRrZG5yeWR5YmVlYmJjZmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTgzOTIsImV4cCI6MjA4MDA5NDM5Mn0.dWGWBkWrg8GMCGiCnhK3K81w7M65y6u2dbDPXlLAqH8";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Profile = () => {
  const { account, isConnected, balance } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadedDatasets, setUploadedDatasets] = useState([]);
  const [purchasedDatasets, setPurchasedDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's uploaded datasets and purchases when account changes
  useEffect(() => {
    if (!account) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch uploaded datasets
        const { data: uploaded, error: uploadError } = await supabase
          .from('datasets')
          .select('*')
          .eq('uploader_address', account.toLowerCase());

        if (uploadError) {
          console.error('Error fetching uploaded datasets:', uploadError);
        } else {
          setUploadedDatasets(uploaded || []);
        }

        // Fetch purchased datasets
        const { data: purchases, error: purchaseError } = await supabase
          .from('purchases')
          .select('*')
          .eq('buyer_address', account.toLowerCase())
          .eq('confirmed', true);

        if (purchaseError) {
          console.error('Error fetching purchases:', purchaseError);
        } else if (purchases && purchases.length > 0) {
          // Fetch dataset details for each purchase
          const datasetIds = purchases.map(p => p.dataset_id);
          const { data: datasets, error: datasetError } = await supabase
            .from('datasets')
            .select('*')
            .in('id', datasetIds);

          if (datasetError) {
            console.error('Error fetching purchased dataset details:', datasetError);
          } else {
            // Merge purchases with dataset details
            const merged = purchases.map(purchase => {
              const dataset = datasets?.find(d => d.id === purchase.dataset_id);
              return {
                ...purchase,
                ...dataset,
                purchaseDate: purchase.purchase_date,
              };
            });
            setPurchasedDatasets(merged);
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [account]);

  // Calculate stats from real data
  const totalEarnings = uploadedDatasets.reduce((sum, dataset) => sum + (dataset.downloads || 0) * (dataset.price || 0), 0);
  const totalSpent = purchasedDatasets.reduce((sum, purchase) => sum + (purchase.amount_paid || 0), 0);
  const totalDownloads = uploadedDatasets.reduce((sum, dataset) => sum + (dataset.downloads || 0), 0);

  if (!isConnected) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="bg-black/40 border-purple-500/20">
            <CardContent className="p-12">
              <User className="w-16 h-16 mx-auto mb-4 text-purple-400" />
              <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">
                Please connect your MetaMask wallet to view your profile.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <Card className="bg-black/40 border-purple-500/20 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </h1>
                <p className="text-gray-400 mb-4">DataVerse Genesis Member</p>
                
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="flex items-center text-purple-400">
                    <Wallet className="w-4 h-4 mr-2" />
                    <span>{parseFloat(balance).toFixed(4)} ETH</span>
                  </div>
                  <div className="flex items-center text-blue-400">
                    <Upload className="w-4 h-4 mr-2" />
                    <span>{uploadedDatasets.length} Datasets Uploaded</span>
                  </div>
                  <div className="flex items-center text-cyan-400">
                    <Download className="w-4 h-4 mr-2" />
                    <span>{purchasedDatasets.length} Datasets Purchased</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 border-purple-500/20">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-2">
                ₹{totalEarnings.toFixed(2)}
              </div>
              <div className="text-gray-300 text-sm">Total Earnings</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-purple-500/20">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-2">
                ₹{totalSpent.toFixed(2)}
              </div>
              <div className="text-gray-300 text-sm">Total Spent</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-purple-500/20">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-cyan-400 mb-2">
                {uploadedDatasets.length}
              </div>
              <div className="text-gray-300 text-sm">Datasets Uploaded</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-purple-500/20">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">
                {totalDownloads}
              </div>
              <div className="text-gray-300 text-sm">Total Downloads</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-black/40 border border-purple-500/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              Overview
            </TabsTrigger>
            <TabsTrigger value="uploaded" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              My Datasets
            </TabsTrigger>
            <TabsTrigger value="purchased" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
              Purchased
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="bg-black/40 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {uploadedDatasets.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                      <div className="flex items-center">
                        <Upload className="w-4 h-4 text-purple-400 mr-2" />
                        <span className="text-white text-sm">Uploaded {uploadedDatasets.length} dataset(s)</span>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {uploadedDatasets[0]?.upload_timestamp 
                          ? new Date(uploadedDatasets[0].upload_timestamp).toLocaleDateString()
                          : 'Recently'}
                      </span>
                    </div>
                  )}
                  
                  {purchasedDatasets.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                      <div className="flex items-center">
                        <Download className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="text-white text-sm">Purchased {purchasedDatasets.length} dataset(s)</span>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {purchasedDatasets[0]?.purchase_date 
                          ? new Date(purchasedDatasets[0].purchase_date).toLocaleDateString()
                          : 'Recently'}
                      </span>
                    </div>
                  )}
                  
                  {totalEarnings > 0 && (
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                      <div className="flex items-center">
                        <Wallet className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-white text-sm">Earned ₹{totalEarnings.toFixed(2)}</span>
                      </div>
                      <span className="text-gray-400 text-xs">from sales</span>
                    </div>
                  )}

                  {uploadedDatasets.length === 0 && purchasedDatasets.length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      <p>No activity yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Performing Datasets */}
              <Card className="bg-black/40 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Top Performing Datasets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {uploadedDatasets.length > 0 ? (
                    uploadedDatasets
                      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
                      .slice(0, 5)
                      .map((dataset) => (
                        <div key={dataset.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex-1">
                            <div className="text-white font-medium line-clamp-1">{dataset.name}</div>
                            <div className="text-gray-400 text-sm">{dataset.downloads || 0} downloads</div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-purple-400 font-medium">₹{((dataset.downloads || 0) * (dataset.price || 0)).toFixed(2)}</div>
                            <div className="text-gray-400 text-sm">earned</div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <p>No uploaded datasets yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="uploaded" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">My Uploaded Datasets</h2>
              <Link to="/analyzer">
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Dataset
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : uploadedDatasets.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {uploadedDatasets.map((dataset) => (
                  <Card key={dataset.id} className="bg-black/40 border-purple-500/20">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-white text-lg line-clamp-2">{dataset.name}</CardTitle>
                        <Badge 
                          variant="secondary" 
                          className={dataset.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                        >
                          {dataset.status || 'active'}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Price:</span>
                          <div className="text-purple-400 font-medium">₹{dataset.price || '0'}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Downloads:</span>
                          <div className="text-white font-medium">{dataset.downloads || 0}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Quality Score:</span>
                          <div className="text-green-400 font-medium">
                            {dataset.quality_score ? `${Math.round(dataset.quality_score)}%` : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Upload Date:</span>
                          <div className="text-white font-medium">
                            {new Date(dataset.upload_timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link to={`/dataset/${dataset.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/20">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20">
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-black/40 border-purple-500/20">
                <CardContent className="p-12 text-center">
                  <Upload className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Datasets Uploaded Yet</h3>
                  <p className="text-gray-400 mb-6">Start uploading datasets to the marketplace</p>
                  <Link to="/analyzer">
                    <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload First Dataset
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="purchased" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Purchased Datasets</h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : purchasedDatasets.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {purchasedDatasets.map((dataset) => (
                  <Card key={dataset.id} className="bg-black/40 border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-white text-lg line-clamp-2">{dataset.name}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Price Paid:</span>
                          <div className="text-purple-400 font-medium">₹{dataset.amount_paid || '0'}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Size:</span>
                          <div className="text-white font-medium">{((dataset.file_size || 0) / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Seller:</span>
                          <div className="text-blue-400 font-medium">
                            {dataset.uploader_address 
                              ? `${dataset.uploader_address.slice(0, 6)}...${dataset.uploader_address.slice(-4)}`
                              : 'Unknown'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Purchase Date:</span>
                          <div className="text-white font-medium">
                            {new Date(dataset.purchaseDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link to={`/dataset/${dataset.id}`} className="flex-1">
                          <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </Link>
                        <Link to={`/dataset/${dataset.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/20">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-black/40 border-purple-500/20">
                <CardContent className="p-12 text-center">
                  <Download className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Purchased Datasets</h3>
                  <p className="text-gray-400 mb-6">Explore the marketplace to find and purchase datasets</p>
                  <Link to="/marketplace">
                    <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                      Browse Marketplace
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;


import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeb3 } from '@/contexts/Web3Context';
import { User, Upload, Download, Wallet, Calendar, Eye } from 'lucide-react';

// Mock data for demonstration
const mockUserStats = {
  totalUploaded: 12,
  totalPurchased: 8,
  totalEarnings: '5.7',
  totalSpent: '2.3',
};

const mockUploadedDatasets = [
  {
    id: '1',
    name: 'E-commerce Customer Behavior',
    price: '0.5',
    downloads: 245,
    earnings: '2.4',
    uploadDate: '2024-01-15',
    status: 'active',
  },
  {
    id: '2',
    name: 'Social Media Analytics',
    price: '0.8',
    downloads: 89,
    earnings: '1.2',
    uploadDate: '2024-01-10',
    status: 'active',
  },
];

const mockPurchasedDatasets = [
  {
    id: '3',
    name: 'Global Climate Data 2023',
    price: '1.2',
    seller: '0x9876...3210',
    purchaseDate: '2024-01-12',
    size: '15.8 MB',
  },
  {
    id: '4',
    name: 'Stock Market Analytics',
    price: '2.0',
    seller: '0x5555...9999',
    purchaseDate: '2024-01-08',
    size: '8.7 MB',
  },
];

const Profile = () => {
  const { account, isConnected, balance } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');

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
                    <span>{mockUserStats.totalUploaded} Datasets Uploaded</span>
                  </div>
                  <div className="flex items-center text-cyan-400">
                    <Download className="w-4 h-4 mr-2" />
                    <span>{mockUserStats.totalPurchased} Datasets Purchased</span>
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
                {mockUserStats.totalEarnings} ETH
              </div>
              <div className="text-gray-300 text-sm">Total Earnings</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-purple-500/20">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-2">
                {mockUserStats.totalSpent} ETH
              </div>
              <div className="text-gray-300 text-sm">Total Spent</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-purple-500/20">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-cyan-400 mb-2">
                {mockUserStats.totalUploaded}
              </div>
              <div className="text-gray-300 text-sm">Datasets Uploaded</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/40 border-purple-500/20">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">
                {mockUploadedDatasets.reduce((sum, dataset) => sum + dataset.downloads, 0)}
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
                  <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                    <div className="flex items-center">
                      <Upload className="w-4 h-4 text-purple-400 mr-2" />
                      <span className="text-white text-sm">Uploaded new dataset</span>
                    </div>
                    <span className="text-gray-400 text-xs">2 days ago</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                    <div className="flex items-center">
                      <Download className="w-4 h-4 text-blue-400 mr-2" />
                      <span className="text-white text-sm">Purchased climate data</span>
                    </div>
                    <span className="text-gray-400 text-xs">1 week ago</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <div className="flex items-center">
                      <Wallet className="w-4 h-4 text-green-400 mr-2" />
                      <span className="text-white text-sm">Earned 0.5 ETH from sales</span>
                    </div>
                    <span className="text-gray-400 text-xs">1 week ago</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performing Datasets */}
              <Card className="bg-black/40 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Top Performing Datasets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockUploadedDatasets.map((dataset) => (
                    <div key={dataset.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <div className="text-white font-medium">{dataset.name}</div>
                        <div className="text-gray-400 text-sm">{dataset.downloads} downloads</div>
                      </div>
                      <div className="text-right">
                        <div className="text-purple-400 font-medium">{dataset.earnings} ETH</div>
                        <div className="text-gray-400 text-sm">earned</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="uploaded" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">My Uploaded Datasets</h2>
              <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                <Upload className="w-4 h-4 mr-2" />
                Upload New Dataset
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockUploadedDatasets.map((dataset) => (
                <Card key={dataset.id} className="bg-black/40 border-purple-500/20">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-lg">{dataset.name}</CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={dataset.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                      >
                        {dataset.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Price:</span>
                        <div className="text-purple-400 font-medium">{dataset.price} ETH</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Downloads:</span>
                        <div className="text-white font-medium">{dataset.downloads}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Earnings:</span>
                        <div className="text-green-400 font-medium">{dataset.earnings} ETH</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Upload Date:</span>
                        <div className="text-white font-medium">
                          {new Date(dataset.uploadDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="purchased" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Purchased Datasets</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockPurchasedDatasets.map((dataset) => (
                <Card key={dataset.id} className="bg-black/40 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{dataset.name}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Price Paid:</span>
                        <div className="text-purple-400 font-medium">{dataset.price} ETH</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Size:</span>
                        <div className="text-white font-medium">{dataset.size}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Seller:</span>
                        <div className="text-blue-400 font-medium">{dataset.seller}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Purchase Date:</span>
                        <div className="text-white font-medium">
                          {new Date(dataset.purchaseDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;

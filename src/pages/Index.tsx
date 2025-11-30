
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWeb3 } from '@/contexts/Web3Context';
import { Upload, Search, Wallet, Grid2x2 } from 'lucide-react';

const Index = () => {
  const { isConnected, connectWallet } = useWeb3();

  const features = [
    {
      icon: Upload,
      title: 'Upload Datasets',
      description: 'Securely upload your datasets to IPFS and monetize your data.',
      color: 'from-purple-500 to-blue-500',
    },
    {
      icon: Search,
      title: 'Discover Data',
      description: 'Browse and purchase high-quality datasets from the community.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Wallet,
      title: 'Earn Crypto',
      description: 'Get paid in ETH for your valuable datasets and earn royalties.',
      color: 'from-cyan-500 to-purple-500',
    },
    {
      icon: Grid2x2,
      title: 'Decentralized',
      description: 'Built on blockchain technology for transparency and trust.',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20" />
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            DataVerse Genesis
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            The world's first decentralized marketplace for datasets. Upload, discover, and trade data on the blockchain.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isConnected ? (
              <>
                <Link to="/marketplace">
                  <Button size="lg" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8">
                    <Search className="w-5 h-5 mr-2" />
                    Explore Marketplace
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button size="lg" variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 px-8">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Dataset
                  </Button>
                </Link>
              </>
            ) : (
              <Button 
                size="lg" 
                onClick={connectWallet}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Connect Wallet to Get Started
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
            Why Choose DataVerse?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-black/40 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">1,000+</div>
              <div className="text-gray-300">Datasets Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">500+</div>
              <div className="text-gray-300">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">50+ ETH</div>
              <div className="text-gray-300">Total Volume</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

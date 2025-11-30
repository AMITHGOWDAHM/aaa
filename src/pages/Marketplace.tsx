import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Download, Calendar, User, Image, Star, TrendingUp, Clock, Filter, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Initialize Supabase client
const supabaseUrl = "https://slvtkdnrydybeebbcfcz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdnRrZG5yeWR5YmVlYmJjZmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTgzOTIsImV4cCI6MjA4MDA5NDM5Mn0.dWGWBkWrg8GMCGiCnhK3K81w7M65y6u2dbDPXlLAqH8";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Marketplace = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoadErrors, setImageLoadErrors] = useState(new Set());
  const [walletAddress, setWalletAddress] = useState(null);
  const [userPurchases, setUserPurchases] = useState(new Set());

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = ['all', 'Business', 'Science', 'Finance', 'Technology', 'Healthcare'];

  // Check wallet connection on mount
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
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
    } else {
      setWalletAddress(null);
      setUserPurchases(new Set());
    }
  };

  // Fetch user's purchases when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      fetchUserPurchases();
    } else {
      setUserPurchases(new Set());
    }
  }, [walletAddress]);

  const fetchUserPurchases = async () => {
    if (!walletAddress) return;

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('dataset_id')
        .eq('buyer_address', walletAddress.toLowerCase())
        .eq('confirmed', true);

      if (error) {
        console.error('Error fetching purchases:', error);
        return;
      }

      const purchasedIds = new Set(data.map(purchase => purchase.dataset_id));
      setUserPurchases(purchasedIds);
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    }
  };

  // Enhanced function to format date properly
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown date';
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Unknown date';
    }
  };

  // Function to get image URL from preview_image_hash
  const getImageUrl = (previewImageHash) => {
    if (!previewImageHash) return null;
    
    // If it's already a full URL, return as is
    if (previewImageHash.startsWith('http')) {
      return previewImageHash;
    }
    
    // If it's an IPFS hash, construct the URL
    if (previewImageHash.startsWith('Qm') || previewImageHash.startsWith('baf')) {
      return `https://ipfs.io/ipfs/${previewImageHash}`;
    }
    
    // If it's stored in Supabase storage, construct the URL
    const { data } = supabase.storage
      .from('dataset-previews')
      .getPublicUrl(previewImageHash);
    
    return data.publicUrl;
  };

  const handleImageError = (datasetId) => {
    setImageLoadErrors(prev => new Set([...prev, datasetId]));
  };

  useEffect(() => {
    async function fetchDatasets() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('datasets')
        .select('*, preview_image_hash, quality_score, quality_label, suggested_price');

      if (error) {
        setError(error.message);
      } else {
        setDatasets(data || []);
      }
      setLoading(false);
    }
    fetchDatasets();
  }, []);

  // Filter and sort datasets
  const filteredAndSortedDatasets = datasets
    .filter(dataset => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        dataset.name?.toLowerCase().includes(term) ||
        dataset.description?.toLowerCase().includes(term) ||
        (dataset.tags && dataset.tags.some(tag => tag.toLowerCase().includes(term)));
      const matchesCategory = filterCategory === 'all' || dataset.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return parseFloat(a.price || 0) - parseFloat(b.price || 0);
        case 'price-high':
          return parseFloat(b.price || 0) - parseFloat(a.price || 0);
        case 'popular':
          return (b.downloads || 0) - (a.downloads || 0);
        case 'newest':
        default:
          // Handle both upload_timestamp and uploadDate fields
          const aDate = new Date(a.upload_timestamp || a.uploadDate || 0).getTime();
          const bDate = new Date(b.upload_timestamp || b.uploadDate || 0).getTime();
          return bDate - aDate;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading amazing datasets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️</div>
          <p className="text-red-400 text-lg">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
                Dataset Marketplace
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full"></div>
            </div>
            <p className="text-gray-300 text-xl max-w-2xl mx-auto leading-relaxed">
              Discover and purchase high-quality datasets from the community. 
              <span className="text-purple-400 font-semibold"> Power your AI projects</span> with premium data.
            </p>
            <div className="flex justify-center gap-8 mt-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>Premium Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span>Trending Datasets</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Fresh Content</span>
              </div>
            </div>
          </div>

          {/* Wallet Connection Status */}
          {walletAddress && (
            <div className="mb-8 flex justify-center">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-3 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-medium">Wallet Connected:</span>
                <span className="text-green-400 font-mono text-sm bg-green-500/20 px-2 py-1 rounded">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            </div>
          )}

          {/* Enhanced Search and Filters */}
          <div className="mb-8">
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20 shadow-2xl">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                  <Input
                    placeholder="Search datasets, tags, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 bg-black/40 border-purple-500/30 text-white placeholder-gray-400 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>

                <div className="flex gap-3">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full md:w-[200px] h-12 bg-black/40 border-purple-500/30 text-white rounded-xl">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-purple-500/30">
                      {categories.map(category => (
                        <SelectItem key={category} value={category} className="text-white hover:bg-purple-500/20">
                          {category === 'all' ? 'All Categories' : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[200px] h-12 bg-black/40 border-purple-500/30 text-white rounded-xl">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-purple-500/30">
                      <SelectItem value="newest" className="text-white hover:bg-purple-500/20">Newest First</SelectItem>
                      <SelectItem value="popular" className="text-white hover:bg-purple-500/20">Most Popular</SelectItem>
                      <SelectItem value="price-low" className="text-white hover:bg-purple-500/20">Price: Low to High</SelectItem>
                      <SelectItem value="price-high" className="text-white hover:bg-purple-500/20">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Results Count */}
          <div className="mb-8 flex justify-between items-center">
            <p className="text-gray-300 text-lg">
              Showing <span className="text-purple-400 font-semibold">{filteredAndSortedDatasets.length}</span> of <span className="text-purple-400 font-semibold">{datasets.length}</span> datasets
            </p>
            {filteredAndSortedDatasets.length > 0 && (
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live marketplace</span>
              </div>
            )}
          </div>

          {/* Enhanced Dataset Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedDatasets.length > 0 ? (
              filteredAndSortedDatasets.map((dataset) => {
                const imageUrl = getImageUrl(dataset.preview_image_hash);
                const hasImageError = imageLoadErrors.has(dataset.id);
                const isOwned = userPurchases.has(dataset.id);
                
                return (
                  <Card key={dataset.id} className="bg-black/30 backdrop-blur-lg border-purple-500/20 hover:border-purple-400/50 transition-all duration-500 group hover:shadow-2xl hover:shadow-purple-500/20 rounded-2xl overflow-hidden">
                    <div className="aspect-video overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20 relative">
                      {imageUrl && !hasImageError ? (
                        <img
                          src={imageUrl}
                          alt={dataset.name || 'Dataset preview'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={() => handleImageError(dataset.id)}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <Image className="w-16 h-16 text-purple-400/50 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Preview Coming Soon</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-purple-500/80 text-white border-0 backdrop-blur-sm">
                          {dataset.category || 'General'}
                        </Badge>
                      </div>
                      {isOwned && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-green-500/80 text-white border-0 backdrop-blur-sm flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Owned</span>
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-xl line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {dataset.name || 'Untitled Dataset'}
                      </CardTitle>
                      <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">
                        {dataset.description || 'No description available'}
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Enhanced Tags */}
                      <div className="flex flex-wrap gap-2">
                        {dataset.tags?.slice(0, 3).map((tag, index) => (
                          <Badge 
                            key={`${tag}-${index}`} 
                            variant="secondary" 
                            className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 text-xs border border-purple-500/30 hover:from-purple-500/30 hover:to-blue-500/30 transition-all"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {dataset.tags?.length > 3 && (
                          <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 text-xs">
                            +{dataset.tags.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {/* Enhanced Meta Information */}
                      <div className="space-y-3 text-sm">
                        {/* Quality Score Display */}
                        {dataset.quality_score !== null && dataset.quality_score !== undefined && (
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                            <span className="flex items-center text-green-300 font-medium">
                              ⭐ Quality Score
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="text-lg font-bold text-green-400">{Math.round(dataset.quality_score)}%</div>
                              <div className="text-xs px-2 py-1 bg-green-500/30 text-green-300 rounded font-semibold">
                                {dataset.quality_label || 'Good'}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                          <span className="flex items-center text-gray-300">
                            <User className="w-4 h-4 mr-2 text-purple-400" />
                            {dataset.uploader_address ? 
                              `${dataset.uploader_address.slice(0, 6)}...${dataset.uploader_address.slice(-4)}` : 
                              'Anonymous'
                            }
                          </span>
                          <span className="text-purple-300 font-medium">{dataset.format || dataset.file_type || 'N/A'}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                          <span className="flex items-center text-gray-300">
                            <Download className="w-4 h-4 mr-2 text-green-400" />
                            {dataset.downloads || 0} downloads
                          </span>
                          <span className="text-blue-300 font-medium">{dataset.size || 'N/A'}</span>
                        </div>

                        <div className="flex items-center p-3 bg-black/20 rounded-lg">
                          <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                          <span className="text-gray-300">
                            {formatDate(dataset.upload_timestamp || dataset.uploadDate)}
                          </span>
                        </div>
                      </div>

                      {/* Enhanced Price and Actions */}
                      <div className="pt-6 border-t border-purple-500/20">
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            {dataset.price ? `₹${dataset.price}` : 'Free'}
                          </div>

                          <div className="flex gap-2">
                            <Link to={`/dataset/${dataset.id}`}>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            
                            {isOwned ? (
                              <Link to={`/dataset/${dataset.id}`}>
                                <Button 
                                  size="sm" 
                                  className="bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                              </Link>
                            ) : (
                              <Link to={`/dataset/${dataset.id}`}>
                                <Button 
                                  size="sm" 
                                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                                >
                                  Buy Now
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-16 col-span-full">
                <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-12 border border-purple-500/20">
                  <Search className="w-20 h-20 mx-auto mb-6 text-purple-400/50" />
                  <h3 className="text-2xl font-bold text-white mb-4">No datasets found</h3>
                  <p className="text-gray-400 text-lg mb-6">Try adjusting your search terms or filters</p>
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setFilterCategory('all');
                    }}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
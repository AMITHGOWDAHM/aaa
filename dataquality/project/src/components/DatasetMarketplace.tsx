import React from 'react';
import { DollarSign, CheckCircle, Star, TrendingUp, ExternalLink } from 'lucide-react';


interface DatasetMarketplaceProps {
  qualityScore: number;
  fileName: string;
  datasetSize: number;
  onUploadToMarketplace: (listingData: any) => void;
}

export const DatasetMarketplace: React.FC<DatasetMarketplaceProps> = ({
  qualityScore,
  fileName,
  datasetSize,
  onUploadToMarketplace
}) => {
  const isEligibleForSale = qualityScore >= 75;

  const getSuggestedPrice = () => {
    const basePrice = Math.floor(datasetSize / 1000) * 5; // $5 per 1000 rows
    const qualityMultiplier = qualityScore / 100;
    return Math.max(10, Math.round(basePrice * qualityMultiplier));
  };

  const handleRedirectToUpload = () => {
    // Store dataset info in localStorage for the upload page to use
    const datasetInfo = {
      fileName,
      qualityScore,
      datasetSize,
      suggestedPrice: getSuggestedPrice(),
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('datasetInfo', JSON.stringify(datasetInfo));
    
    // Redirect to upload page
    window.open('http://localhost:8080/upload', '_blank');
  };

  if (!isEligibleForSale) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Dataset Marketplace</h3>
          <p className="text-gray-600 mb-4">
            Your dataset needs a quality score of 75% or higher to be eligible for marketplace listing.
          </p>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-500 mb-1">{qualityScore}%</div>
            <div className="text-sm text-gray-600">Current Quality Score</div>
            <div className="text-sm text-red-600 mt-2">
              Need {75 - qualityScore}% more to qualify
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 mr-2" />
          <Star className="w-6 h-6 text-yellow-500" />
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">Premium Quality Dataset!</h3>
        <p className="text-green-700 mb-4">
          Your dataset meets our quality standards and is eligible for marketplace listing.
        </p>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="text-2xl font-bold text-green-600">{qualityScore}%</div>
            <div className="text-sm text-gray-600">Quality Score</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="text-2xl font-bold text-blue-600">{datasetSize.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Records</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="text-2xl font-bold text-purple-600">${getSuggestedPrice()}</div>
            <div className="text-sm text-gray-600">Suggested Price</div>
          </div>
        </div>

        <div className="bg-white/70 rounded-lg p-4 mb-6 border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">Ready for Blockchain Marketplace</h4>
          <p className="text-sm text-green-700 mb-3">
            List your high-quality dataset on our decentralized marketplace and earn cryptocurrency from data sales.
          </p>
          <div className="flex items-center justify-center text-xs text-green-600">
            <span className="flex items-center mr-4">
              <CheckCircle className="w-3 h-3 mr-1" />
              IPFS Storage
            </span>
            <span className="flex items-center mr-4">
              <CheckCircle className="w-3 h-3 mr-1" />
              Smart Contracts
            </span>
            <span className="flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Crypto Payments
            </span>
          </div>
        </div>

        <button
          onClick={handleRedirectToUpload}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <DollarSign className="w-5 h-5 mr-2" />
          List on Blockchain Marketplace
          <ExternalLink className="w-4 h-4 ml-2" />
        </button>
        
        <p className="text-xs text-green-600 mt-3">
          Opens in new tab • Connect wallet required • IPFS & blockchain powered
        </p>
      </div>
    </div>
  );
};
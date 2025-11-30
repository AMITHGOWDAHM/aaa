import React, { useEffect, useState } from 'react';
import { CheckCircle, Database, Star, TrendingUp } from 'lucide-react';

interface DatasetInfo {
  fileName: string;
  qualityScore: number;
  datasetSize: number;
  suggestedPrice: number;
  timestamp: string;
}

export const UploadPageIntegration: React.FC = () => {
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);

  useEffect(() => {
    // Check if we have dataset info from the quality checker
    const storedInfo = localStorage.getItem('datasetInfo');
    if (storedInfo) {
      try {
        const info = JSON.parse(storedInfo);
        setDatasetInfo(info);
        // Clear the stored info after using it
        localStorage.removeItem('datasetInfo');
      } catch (error) {
        console.error('Error parsing stored dataset info:', error);
      }
    }
  }, []);

  if (!datasetInfo) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center mb-4">
          <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
          <Star className="w-5 h-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-bold text-green-800">Pre-Qualified Dataset Detected!</h3>
        </div>
        
        <p className="text-green-700 mb-4">
          Your dataset has been analyzed and meets our quality standards for marketplace listing.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg p-3 border border-green-200 text-center">
            <Database className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-800 truncate" title={datasetInfo.fileName}>
              {datasetInfo.fileName}
            </div>
            <div className="text-xs text-gray-600">File Name</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200 text-center">
            <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-600">{datasetInfo.qualityScore}%</div>
            <div className="text-xs text-gray-600">Quality Score</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200 text-center">
            <div className="text-lg font-bold text-blue-600">{datasetInfo.datasetSize.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Records</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200 text-center">
            <div className="text-lg font-bold text-purple-600">${datasetInfo.suggestedPrice}</div>
            <div className="text-xs text-gray-600">Suggested Price</div>
          </div>
        </div>
        
        <div className="bg-white/70 rounded-lg p-3 border border-green-200">
          <p className="text-sm text-green-700 text-center">
            <strong>Ready for upload!</strong> Your dataset quality has been verified. 
            Fill out the form below to list it on the blockchain marketplace.
          </p>
        </div>
      </div>
    </div>
  );
};
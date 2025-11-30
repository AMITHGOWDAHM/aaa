import React from 'react';
import { BarChart3, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { QualityMetrics as QualityMetricsType } from '../types/dataset';

interface QualityMetricsProps {
  metrics: QualityMetricsType;
  qualityScore: number;
}

export const QualityMetrics: React.FC<QualityMetricsProps> = ({ metrics, qualityScore }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5" />;
    if (score >= 60) return <TrendingUp className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  const totalMissingValues = Object.values(metrics.missingValues).reduce((sum, count) => sum + count, 0);
  const totalOutliers = Object.values(metrics.outliers).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Quality Metrics
        </h3>
        <div className={`flex items-center px-3 py-2 rounded-full ${getScoreColor(qualityScore)}`}>
          {getScoreIcon(qualityScore)}
          <span className="ml-2 font-semibold">{qualityScore}/100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{metrics.totalRows.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Rows</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{metrics.totalColumns}</div>
          <div className="text-sm text-gray-600">Columns</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{metrics.completeness.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Completeness</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{metrics.duplicates}</div>
          <div className="text-sm text-gray-600">Duplicates</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Column Analysis</h4>
          <div className="space-y-2">
            {Object.entries(metrics.dataTypes).map(([column, type]) => (
              <div key={column} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-800">{column}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    type === 'numeric' ? 'bg-blue-100 text-blue-700' :
                    type === 'text' ? 'bg-green-100 text-green-700' :
                    type === 'date' ? 'bg-purple-100 text-purple-700' :
                    type === 'boolean' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {type}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{metrics.uniqueValues[column]} unique</span>
                  {metrics.missingValues[column] > 0 && (
                    <span className="text-red-600">{metrics.missingValues[column]} missing</span>
                  )}
                  {metrics.outliers[column] > 0 && (
                    <span className="text-orange-600">{metrics.outliers[column]} outliers</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
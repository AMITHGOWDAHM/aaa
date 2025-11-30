import React from 'react';
import { Brain, AlertCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { AIInsight } from '../types/dataset';

interface AIInsightsProps {
  insights: AIInsight[];
  isLoading: boolean;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ insights, isLoading }) => {
  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'suggestion':
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
      default:
        return <Brain className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInsightStyle = (category: string) => {
    switch (category) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'suggestion':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
      <div className="flex items-center mb-6">
        <Brain className="w-5 h-5 mr-2 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-800">AI-Powered Insights</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Analyzing data with Gemini AI...</span>
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No insights available. Make sure your API key is configured correctly.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`border-l-4 p-4 rounded-lg ${getInsightStyle(insight.category)}`}
            >
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.category)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-800 capitalize">
                      {insight.category}
                    </span>
                    {insight.column && (
                      <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                        {insight.column}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{insight.message}</p>
                  {insight.recommendation && (
                    <div className="mt-2 p-3 bg-white/50 rounded border border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Recommendation:</strong> {insight.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
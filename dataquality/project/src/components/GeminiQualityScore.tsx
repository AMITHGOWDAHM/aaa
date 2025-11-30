import React from 'react';
import { Brain, CheckCircle, AlertTriangle, AlertCircle, Download, FileText, BarChart3, Lightbulb, AlertOctagon, Wrench } from 'lucide-react';

interface GeminiQualityScoreProps {
  score: number | null;
  insights: string;
  isLoading: boolean;
  fileName: string;
  datasetSize: number;
}

export const GeminiQualityScore: React.FC<GeminiQualityScoreProps> = ({ 
  score, 
  insights, 
  isLoading, 
  fileName, 
  datasetSize 
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-8 h-8" />;
    if (score >= 60) return <AlertTriangle className="w-8 h-8" />;
    return <AlertCircle className="w-8 h-8" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Quality';
    if (score >= 60) return 'Good Quality';
    if (score >= 40) return 'Fair Quality';
    return 'Poor Quality';
  };

  const exportReport = () => {
    const report = {
      fileName,
      datasetSize,
      analysisDate: new Date().toISOString(),
      qualityScore: score,
      qualityLabel: score ? getScoreLabel(score) : 'Unknown',
      insights: insights,
      analyzedBy: 'Gemini AI'
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini_quality_report_${fileName.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatInsights = (insightsText: string) => {
    const sections = [
      { title: 'Data Quality Analysis', icon: BarChart3, emoji: '📊', color: 'blue' },
      { title: 'Issues Identified', icon: AlertOctagon, emoji: '⚠️', color: 'red' },
      { title: 'Recommendations', icon: Lightbulb, emoji: '💡', color: 'yellow' },
      { title: 'Immediate Actions', icon: Wrench, emoji: '🔧', color: 'green' }
    ];

    return sections.map((section, index) => {
      const regex = new RegExp(`${section.emoji}\\s*${section.title.toUpperCase().replace(/\s+/g, '\\s+')}[:\\s]*([\\s\\S]*?)(?=${sections[index + 1]?.emoji}|$)`, 'i');
      const match = insightsText.match(regex);
      
      if (match && match[1]) {
        const points = match[1]
          .split('•')
          .filter(point => point.trim())
          .map(point => point.trim());

        return {
          ...section,
          points
        };
      }
      return null;
    }).filter(Boolean);
  };

  const getSectionColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      green: 'bg-green-50 border-green-200 text-green-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center">
          <Brain className="w-6 h-6 mr-3 text-purple-600" />
          Gemini AI Quality Assessment
        </h3>
        {score !== null && (
          <button
            onClick={exportReport}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-6"></div>
          <h4 className="text-xl font-semibold text-gray-700 mb-2">Analyzing Dataset Quality</h4>
          <p className="text-gray-600 text-center max-w-md">
            Gemini AI is examining your dataset structure, completeness, consistency, and overall quality...
          </p>
        </div>
      ) : score === null ? (
        <div className="text-center py-16 text-gray-500">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No quality assessment available</p>
          <p className="text-sm mt-2">Upload a dataset to get started</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Quality Score Display */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreColor(score)} mb-4`}>
              <div className="text-center">
                <div className="text-3xl font-bold">{score}</div>
                <div className="text-sm font-medium">/ 100</div>
              </div>
            </div>
            <h4 className="text-2xl font-bold text-gray-800 mb-2">{getScoreLabel(score)}</h4>
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              {getScoreIcon(score)}
              <span className="text-lg">Dataset Quality Score</span>
            </div>
          </div>

          {/* Dataset Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-t border-b border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{fileName}</div>
              <div className="text-sm text-gray-600">File Name</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{datasetSize.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Gemini AI</div>
              <div className="text-sm text-gray-600">Analyzed By</div>
            </div>
          </div>

          {/* AI Insights - Point-wise Format */}
          {insights && (
            <div className="space-y-6">
              <h5 className="text-xl font-bold text-gray-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                AI Analysis & Recommendations
              </h5>
              
              {formatInsights(insights).map((section, index) => {
                if (!section) return null;
                
                const IconComponent = section.icon;
                
                return (
                  <div key={index} className={`rounded-lg p-6 border-2 ${getSectionColor(section.color)}`}>
                    <h6 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="text-2xl mr-2">{section.emoji}</span>
                      <IconComponent className="w-5 h-5 mr-2" />
                      {section.title}
                    </h6>
                    <ul className="space-y-3">
                      {section.points.map((point, pointIndex) => (
                        <li key={pointIndex} className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-current rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              
              {/* Fallback for unstructured insights */}
              {formatInsights(insights).length === 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <div className="whitespace-pre-wrap leading-relaxed">{insights}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
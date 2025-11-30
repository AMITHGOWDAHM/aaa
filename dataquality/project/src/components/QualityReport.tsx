import React from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { QualityReport as QualityReportType } from '../types/dataset';

interface QualityReportProps {
  report: QualityReportType;
  fileName: string;
}

export const QualityReport: React.FC<QualityReportProps> = ({ report, fileName }) => {
  const generateReport = () => {
    const reportContent = {
      fileName,
      analysisDate: report.timestamp,
      overallScore: report.overallScore,
      summary: {
        totalRows: report.metrics.totalRows,
        totalColumns: report.metrics.totalColumns,
        completeness: report.metrics.completeness,
        duplicates: report.metrics.duplicates
      },
      columnAnalysis: Object.entries(report.metrics.dataTypes).map(([column, type]) => ({
        column,
        dataType: type,
        uniqueValues: report.metrics.uniqueValues[column],
        missingValues: report.metrics.missingValues[column],
        outliers: report.metrics.outliers[column] || 0
      })),
      insights: report.insights
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality_report_${fileName.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Quality Report
        </h3>
        <button
          onClick={generateReport}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          Generated on {new Date(report.timestamp).toLocaleString()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Dataset Summary</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>File: {fileName}</li>
              <li>Rows: {report.metrics.totalRows.toLocaleString()}</li>
              <li>Columns: {report.metrics.totalColumns}</li>
              <li>Quality Score: {report.overallScore}/100</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Key Issues</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Completeness: {report.metrics.completeness.toFixed(1)}%</li>
              <li>Duplicates: {report.metrics.duplicates}</li>
              <li>Total Outliers: {Object.values(report.metrics.outliers).reduce((sum, count) => sum + count, 0)}</li>
              <li>AI Insights: {report.insights.length}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
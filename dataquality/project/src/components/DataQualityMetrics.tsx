import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Database, TrendingDown, Eye } from 'lucide-react';

interface DataQualityMetricsProps {
  data: any[];
  fileName: string;
}

interface QualityMetrics {
  totalRows: number;
  totalColumns: number;
  missingValues: { [column: string]: number };
  errorValues: { [column: string]: number };
  duplicateRows: number;
  emptyRows: number;
  inconsistentFormats: { [column: string]: number };
  totalMissingCells: number;
  totalErrorCells: number;
  completeness: number;
}

export const DataQualityMetrics: React.FC<DataQualityMetricsProps> = ({ data, fileName }) => {
  const calculateMetrics = (): QualityMetrics => {
    if (!data || data.length === 0) {
      return {
        totalRows: 0,
        totalColumns: 0,
        missingValues: {},
        errorValues: {},
        duplicateRows: 0,
        emptyRows: 0,
        inconsistentFormats: {},
        totalMissingCells: 0,
        totalErrorCells: 0,
        completeness: 0
      };
    }

    const columns = Object.keys(data[0] || {});
    const totalRows = data.length;
    const totalColumns = columns.length;

    // Calculate missing values
    const missingValues: { [column: string]: number } = {};
    const errorValues: { [column: string]: number } = {};
    const inconsistentFormats: { [column: string]: number } = {};

    columns.forEach(column => {
      let missing = 0;
      let errors = 0;
      let inconsistent = 0;
      const formats = new Set<string>();

      data.forEach(row => {
        const value = row[column];
        
        // Check for missing values
        if (isMissingValue(value)) {
          missing++;
        } else {
          // Check for error values
          if (isErrorValue(value)) {
            errors++;
          }
          
          // Check for format consistency
          const format = getValueFormat(value);
          formats.add(format);
        }
      });

      missingValues[column] = missing;
      errorValues[column] = errors;
      inconsistentFormats[column] = Math.max(0, formats.size - 1); // -1 because 1 format is consistent
    });

    // Calculate duplicate rows
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    const duplicateRows = totalRows - uniqueRows.size;

    // Calculate empty rows
    const emptyRows = data.filter(row => 
      Object.values(row).every(value => isMissingValue(value))
    ).length;

    // Calculate totals
    const totalMissingCells = Object.values(missingValues).reduce((sum, count) => sum + count, 0);
    const totalErrorCells = Object.values(errorValues).reduce((sum, count) => sum + count, 0);
    const totalCells = totalRows * totalColumns;
    const completeness = totalCells > 0 ? ((totalCells - totalMissingCells - totalErrorCells) / totalCells) * 100 : 0;

    return {
      totalRows,
      totalColumns,
      missingValues,
      errorValues,
      duplicateRows,
      emptyRows,
      inconsistentFormats,
      totalMissingCells,
      totalErrorCells,
      completeness
    };
  };

  const isMissingValue = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      return trimmed === '' || 
             trimmed === 'null' || 
             trimmed === 'undefined' || 
             trimmed === 'na' || 
             trimmed === 'n/a' || 
             trimmed === 'nan' || 
             trimmed === 'none' || 
             trimmed === 'nil' || 
             trimmed === '-' || 
             trimmed === '--' || 
             trimmed === '?' || 
             trimmed === 'missing' || 
             trimmed === 'empty';
    }
    
    return false;
  };

  const isErrorValue = (value: any): boolean => {
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      return trimmed.includes('#error') ||
             trimmed.includes('#div/0!') ||
             trimmed.includes('#value!') ||
             trimmed.includes('#ref!') ||
             trimmed.includes('#name?') ||
             trimmed.includes('#num!') ||
             trimmed.includes('#n/a') ||
             trimmed.includes('error') ||
             trimmed === 'inf' ||
             trimmed === '-inf' ||
             trimmed === 'infinity';
    }
    
    if (typeof value === 'number') {
      return !isFinite(value) && !isNaN(value); // Infinity values
    }
    
    return false;
  };

  const getValueFormat = (value: any): string => {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      // Date patterns
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return 'date-iso';
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return 'date-us';
      if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return 'date-dash';
      
      // Number patterns
      if (/^\d+$/.test(trimmed)) return 'integer';
      if (/^\d+\.\d+$/.test(trimmed)) return 'decimal';
      if (/^\$\d+(\.\d{2})?$/.test(trimmed)) return 'currency';
      if (/^\d+%$/.test(trimmed)) return 'percentage';
      
      // Email pattern
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'email';
      
      // Phone patterns
      if (/^\+?\d{10,15}$/.test(trimmed.replace(/[\s\-\(\)]/g, ''))) return 'phone';
      
      return 'text';
    }
    
    return 'unknown';
  };

  const metrics = calculateMetrics();

  const getMetricColor = (value: number, threshold: number = 0) => {
    if (value === 0) return 'text-green-600 bg-green-100';
    if (value <= threshold) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
      <div className="flex items-center mb-6">
        <Database className="w-6 h-6 mr-3 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-800">Data Quality Metrics</h3>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{metrics.totalRows.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Rows</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{metrics.totalColumns}</div>
          <div className="text-sm text-gray-600">Columns</div>
        </div>
        <div className={`rounded-lg p-4 border ${getMetricColor(metrics.totalMissingCells, metrics.totalRows * 0.05)}`}>
          <div className="text-2xl font-bold">{metrics.totalMissingCells.toLocaleString()}</div>
          <div className="text-sm">Missing Values</div>
        </div>
        <div className={`rounded-lg p-4 border ${getMetricColor(metrics.totalErrorCells)}`}>
          <div className="text-2xl font-bold">{metrics.totalErrorCells.toLocaleString()}</div>
          <div className="text-sm">Error Values</div>
        </div>
      </div>

      {/* Quality Issues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={`rounded-lg p-4 border ${getMetricColor(metrics.duplicateRows, metrics.totalRows * 0.01)}`}>
          <div className="flex items-center mb-2">
            <TrendingDown className="w-5 h-5 mr-2" />
            <span className="font-semibold">Duplicate Rows</span>
          </div>
          <div className="text-2xl font-bold">{metrics.duplicateRows.toLocaleString()}</div>
          <div className="text-sm">
            {metrics.totalRows > 0 ? ((metrics.duplicateRows / metrics.totalRows) * 100).toFixed(1) : 0}% of total
          </div>
        </div>

        <div className={`rounded-lg p-4 border ${getMetricColor(metrics.emptyRows)}`}>
          <div className="flex items-center mb-2">
            <Eye className="w-5 h-5 mr-2" />
            <span className="font-semibold">Empty Rows</span>
          </div>
          <div className="text-2xl font-bold">{metrics.emptyRows.toLocaleString()}</div>
          <div className="text-sm">
            {metrics.totalRows > 0 ? ((metrics.emptyRows / metrics.totalRows) * 100).toFixed(1) : 0}% of total
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            <span className="font-semibold text-green-800">Data Completeness</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{metrics.completeness.toFixed(1)}%</div>
          <div className="text-sm text-green-700">Valid data cells</div>
        </div>
      </div>

      {/* Column-wise Analysis */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
          Column-wise Issues
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Column</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">Missing</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">Errors</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">Format Issues</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">Quality</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(metrics.missingValues).map(column => {
                const missing = metrics.missingValues[column];
                const errors = metrics.errorValues[column];
                const formatIssues = metrics.inconsistentFormats[column];
                const totalIssues = missing + errors + formatIssues;
                const quality = metrics.totalRows > 0 ? ((metrics.totalRows - totalIssues) / metrics.totalRows) * 100 : 100;
                
                return (
                  <tr key={column} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 border-b">{column}</td>
                    <td className="px-4 py-3 text-center text-sm border-b">
                      <span className={`px-2 py-1 rounded-full text-xs ${getMetricColor(missing, metrics.totalRows * 0.05)}`}>
                        {missing}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm border-b">
                      <span className={`px-2 py-1 rounded-full text-xs ${getMetricColor(errors)}`}>
                        {errors}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm border-b">
                      <span className={`px-2 py-1 rounded-full text-xs ${getMetricColor(formatIssues)}`}>
                        {formatIssues}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm border-b">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        quality >= 95 ? 'text-green-700 bg-green-100' :
                        quality >= 85 ? 'text-yellow-700 bg-yellow-100' :
                        'text-red-700 bg-red-100'
                      }`}>
                        {quality.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-semibold text-gray-800 mb-2">Quality Summary</h5>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• <strong>{metrics.totalMissingCells.toLocaleString()}</strong> missing values across all columns</p>
          <p>• <strong>{metrics.totalErrorCells.toLocaleString()}</strong> error values detected</p>
          <p>• <strong>{metrics.duplicateRows.toLocaleString()}</strong> duplicate rows found</p>
          <p>• <strong>{metrics.emptyRows.toLocaleString()}</strong> completely empty rows</p>
          <p>• Overall data completeness: <strong>{metrics.completeness.toFixed(1)}%</strong></p>
        </div>
      </div>
    </div>
  );
};
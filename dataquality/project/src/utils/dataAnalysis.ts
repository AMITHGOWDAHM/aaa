import { DatasetRow, QualityMetrics } from '../types/dataset';

export const analyzeDataset = (data: DatasetRow[]): QualityMetrics => {
  if (!data || data.length === 0) {
    return {
      totalRows: 0,
      totalColumns: 0,
      completeness: 0,
      duplicates: 0,
      missingValues: {},
      dataTypes: {},
      uniqueValues: {},
      outliers: {}
    };
  }

  const columns = Object.keys(data[0]);
  const totalRows = data.length;
  const totalColumns = columns.length;

  // Calculate missing values
  const missingValues: { [key: string]: number } = {};
  const uniqueValues: { [key: string]: number } = {};
  const dataTypes: { [key: string]: string } = {};
  const outliers: { [key: string]: number } = {};

  columns.forEach(column => {
    const values = data.map(row => row[column]);
    const nonNullValues = values.filter(val => !isMissingValue(val));
    
    missingValues[column] = totalRows - nonNullValues.length;
    uniqueValues[column] = new Set(nonNullValues).size;
    
    // Determine data type
    if (nonNullValues.length > 0) {
      const sampleValue = nonNullValues[0];
      if (typeof sampleValue === 'number' || (!isNaN(Number(sampleValue)) && sampleValue !== '')) {
        dataTypes[column] = 'numeric';
        
        // Calculate outliers for numeric columns using IQR method
        const numericValues = nonNullValues
          .map(val => Number(val))
          .filter(val => !isNaN(val) && isFinite(val));
        
        if (numericValues.length > 4) { // Need at least 5 values for meaningful outlier detection
          numericValues.sort((a, b) => a - b);
          const q1Index = Math.floor(numericValues.length * 0.25);
          const q3Index = Math.floor(numericValues.length * 0.75);
          const q1 = numericValues[q1Index];
          const q3 = numericValues[q3Index];
          const iqr = q3 - q1;
          
          if (iqr > 0) {
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            outliers[column] = numericValues.filter(val => val < lowerBound || val > upperBound).length;
          } else {
            outliers[column] = 0;
          }
        } else {
          outliers[column] = 0;
        }
      } else if (typeof sampleValue === 'boolean' || 
                 sampleValue === 'true' || sampleValue === 'false' ||
                 sampleValue === true || sampleValue === false) {
        dataTypes[column] = 'boolean';
        outliers[column] = 0;
      } else if (isValidDate(sampleValue)) {
        dataTypes[column] = 'date';
        outliers[column] = 0;
      } else {
        dataTypes[column] = 'text';
        outliers[column] = 0;
      }
    } else {
      dataTypes[column] = 'unknown';
      outliers[column] = 0;
    }
  });

  // Calculate duplicates
  const duplicates = totalRows - new Set(data.map(row => JSON.stringify(row))).size;

  // Calculate completeness
  const totalCells = totalRows * totalColumns;
  const totalMissingCells = Object.values(missingValues).reduce((sum, count) => sum + count, 0);
  const completeness = totalCells > 0 ? ((totalCells - totalMissingCells) / totalCells) * 100 : 0;

  return {
    totalRows,
    totalColumns,
    completeness,
    duplicates,
    missingValues,
    dataTypes,
    uniqueValues,
    outliers
  };
};

// Enhanced function to detect missing values
const isMissingValue = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  
  // Handle string values
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
           trimmed === 'empty' ||
           trimmed === '#n/a' ||
           trimmed === '#null!' ||
           trimmed === '#div/0!' ||
           trimmed === '#value!' ||
           trimmed === '#ref!' ||
           trimmed === '#name?' ||
           trimmed === '#num!';
  }
  
  // Handle numeric values
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value);
  }
  
  return false;
};

const isValidDate = (value: any): boolean => {
  if (!value || isMissingValue(value)) return false;
  
  // Try to parse as date
  const date = new Date(value);
  if (date instanceof Date && !isNaN(date.getTime())) {
    // Additional check for reasonable date range (not too far in past/future)
    const year = date.getFullYear();
    return year > 1900 && year < 2100;
  }
  
  // Check for common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
  ];
  
  const stringValue = String(value);
  return datePatterns.some(pattern => pattern.test(stringValue));
};

export const calculateQualityScore = (metrics: QualityMetrics): number => {
  let score = 100;
  
  // Deduct points for missing data (more aggressive penalty)
  const missingDataPenalty = (100 - metrics.completeness) * 0.8;
  score -= missingDataPenalty;
  
  // Deduct points for duplicates
  const duplicateRate = metrics.totalRows > 0 ? (metrics.duplicates / metrics.totalRows) * 100 : 0;
  score -= duplicateRate * 0.5;
  
  // Deduct points for outliers
  const totalOutliers = Object.values(metrics.outliers).reduce((sum, count) => sum + count, 0);
  const outlierRate = metrics.totalRows > 0 ? (totalOutliers / metrics.totalRows) * 100 : 0;
  score -= outlierRate * 0.3;
  
  // Bonus for data consistency (high unique value ratios in appropriate columns)
  const avgUniqueRatio = Object.values(metrics.uniqueValues).reduce((sum, count) => 
    sum + (count / metrics.totalRows), 0) / metrics.totalColumns;
  
  if (avgUniqueRatio > 0.8) {
    score += 5; // Bonus for high data diversity
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
};
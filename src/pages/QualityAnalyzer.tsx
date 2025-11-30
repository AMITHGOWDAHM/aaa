import React, { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  Database, 
  Sparkles, 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Download, 
  BarChart3, 
  Lightbulb, 
  AlertOctagon, 
  Wrench, 
  Wifi, 
  WifiOff,
  ChevronLeft,
  ChevronRight,
  Table,
  TrendingDown,
  Eye,
  DollarSign,
  Star,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
interface DatasetRow {
  [key: string]: any;
}

interface QualityAssessment {
  score: number;
  insights: string;
}

interface QualityAnalyzerProps {
  apiKey?: string;
  onMarketplaceRedirect?: (datasetInfo: any) => void;
  showMarketplace?: boolean;
  className?: string;
}

const QualityAnalyzer: React.FC<QualityAnalyzerProps> = ({ 
  apiKey = 'AIzaSyCKLGCn2pS62lrQ8G5m-PUrqLNSuETyijI',
  onMarketplaceRedirect,
  showMarketplace = true,
  className = ''
}) => {
  // Main state
  const [data, setData] = useState<DatasetRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [insights, setInsights] = useState<string>('');
  
  // Preview state
  const [currentPage, setCurrentPage] = useState(0);
  const maxRows = 5;

  // Initialize Gemini AI
  let genAI: GoogleGenerativeAI | null = null;
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
  }

  // Fallback quality assessment
  const generateFallbackAssessment = (data: DatasetRow[]): QualityAssessment => {
    const columns = Object.keys(data[0] || {});
    const totalRows = data.length;
    
    // Calculate comprehensive metrics
    const missingValues: { [key: string]: number } = {};
    const errorValues: { [key: string]: number } = {};
    const dataTypes: { [key: string]: string } = {};
    
    columns.forEach(column => {
      const values = data.map(row => row[column]);
      const nonNullValues = values.filter(val => val !== null && val !== undefined && val !== '');
      missingValues[column] = totalRows - nonNullValues.length;
      
      let errors = 0;
      nonNullValues.forEach(val => {
        const str = String(val).toLowerCase();
        if (str.includes('#error') || str.includes('#div/0!') || str.includes('#value!') || 
            str === 'inf' || str === '-inf' || str === 'error') {
          errors++;
        }
      });
      errorValues[column] = errors;
      
      if (nonNullValues.length > 0) {
        const sampleValue = nonNullValues[0];
        if (typeof sampleValue === 'number' || !isNaN(Number(sampleValue))) {
          dataTypes[column] = 'numeric';
        } else if (typeof sampleValue === 'boolean') {
          dataTypes[column] = 'boolean';
        } else if (/^\d{4}-\d{2}-\d{2}/.test(String(sampleValue))) {
          dataTypes[column] = 'date';
        } else {
          dataTypes[column] = 'text';
        }
      }
    });

    const duplicates = totalRows - new Set(data.map(row => JSON.stringify(row))).size;
    const totalCells = totalRows * columns.length;
    const totalMissingCells = Object.values(missingValues).reduce((sum, count) => sum + count, 0);
    const totalErrorCells = Object.values(errorValues).reduce((sum, count) => sum + count, 0);
    const completeness = ((totalCells - totalMissingCells - totalErrorCells) / totalCells) * 100;
    
    // More accurate score calculation
    let score = 100;
    const missingPercentage = (totalMissingCells / totalCells) * 100;
    const errorPercentage = (totalErrorCells / totalCells) * 100;
    const duplicatePercentage = (duplicates / totalRows) * 100;
    
    score -= Math.min(missingPercentage * 0.8, 40);
    score -= Math.min(duplicatePercentage * 2, 20);
    score -= Math.min(errorPercentage * 5, 15);
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Identify critical columns
    const criticalColumns = Object.entries(missingValues)
      .filter(([_, count]) => count > totalRows * 0.2)
      .map(([col]) => col);

    const insights = `
📊 DATA QUALITY ANALYSIS:
• Dataset contains ${totalRows.toLocaleString()} rows across ${columns.length} columns
• Data completeness: ${completeness.toFixed(1)}% with ${totalMissingCells.toLocaleString()} missing values (${missingPercentage.toFixed(1)}%)
• Error values detected: ${totalErrorCells.toLocaleString()} (${errorPercentage.toFixed(1)}%)
• Duplicate records: ${duplicates} (${duplicatePercentage.toFixed(1)}% of total)

⚠️ ISSUES IDENTIFIED:
• Missing data in ${Object.values(missingValues).filter(count => count > 0).length} columns${criticalColumns.length > 0 ? ` - CRITICAL in: ${criticalColumns.join(', ')}` : ''}
• Duplicate records may indicate data collection or import issues (${duplicatePercentage.toFixed(1)}%)
• Error values detected in ${Object.values(errorValues).filter(count => count > 0).length} columns

💡 RECOMMENDATIONS:
• Implement data imputation for missing values in ${criticalColumns.length > 0 ? criticalColumns.join(', ') : 'all affected columns'}
• Investigate and remove duplicate records to improve data integrity
• Validate and fix error values detected in the dataset
• Establish data validation rules for future data collection

🔧 IMMEDIATE ACTIONS:
• Review columns with >20% missing values: ${criticalColumns.length > 0 ? criticalColumns.join(', ') : 'None identified'}
• Remove ${duplicates} duplicate record${duplicates !== 1 ? 's' : ''}
• Standardize data types across all columns (${Object.entries(dataTypes).map(([col, type]) => `${col}: ${type}`).join(', ')})
    `;

    return { score, insights };
  };

  // Gemini AI analysis
  const generateQualityAssessment = async (data: DatasetRow[]): Promise<QualityAssessment> => {
    try {
      if (!genAI) {
        throw new Error('Gemini AI not available');
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const columns = Object.keys(data[0] || {});
      const totalRows = data.length;
      
      // Calculate comprehensive metrics
      const missingValues: { [key: string]: number } = {};
      const errorValues: { [key: string]: number } = {};
      const dataTypes: { [key: string]: string } = {};
      const uniqueValues: { [key: string]: number } = {};
      const formatIssues: { [key: string]: number } = {};
      
      columns.forEach(column => {
        const values = data.map(row => row[column]);
        const nonNullValues = values.filter(val => val !== null && val !== undefined && val !== '');
        const uniqueSet = new Set(nonNullValues.map(v => String(v).toLowerCase()));
        
        missingValues[column] = totalRows - nonNullValues.length;
        uniqueValues[column] = uniqueSet.size;
        
        // Detect errors
        let errors = 0;
        nonNullValues.forEach(val => {
          const str = String(val).toLowerCase();
          if (str.includes('#error') || str.includes('#div/0!') || str.includes('#value!') || 
              str === 'inf' || str === '-inf' || str === 'error') {
            errors++;
          }
        });
        errorValues[column] = errors;
        
        // Determine data type
        if (nonNullValues.length > 0) {
          const sampleValue = nonNullValues[0];
          if (typeof sampleValue === 'number' || !isNaN(Number(sampleValue))) {
            dataTypes[column] = 'numeric';
          } else if (typeof sampleValue === 'boolean') {
            dataTypes[column] = 'boolean';
          } else if (/^\d{4}-\d{2}-\d{2}/.test(String(sampleValue))) {
            dataTypes[column] = 'date';
          } else {
            dataTypes[column] = 'text';
          }
          
          // Check for format inconsistencies
          const formats = new Set<string>();
          nonNullValues.forEach(val => {
            const str = String(val);
            if (dataTypes[column] === 'numeric' && isNaN(Number(str))) {
              formatIssues[column] = (formatIssues[column] || 0) + 1;
            }
          });
        }
      });

      const duplicates = totalRows - new Set(data.map(row => JSON.stringify(row))).size;
      const totalCells = totalRows * columns.length;
      const totalMissingCells = Object.values(missingValues).reduce((sum, count) => sum + count, 0);
      const totalErrorCells = Object.values(errorValues).reduce((sum, count) => sum + count, 0);
      const completeness = ((totalCells - totalMissingCells - totalErrorCells) / totalCells) * 100;
      
      // Calculate data uniformity
      const avgUniqueness = Object.values(uniqueValues).reduce((sum, count) => sum + count, 0) / columns.length / totalRows * 100;
      const duplicatePercentage = (duplicates / totalRows) * 100;
      const missingPercentage = (totalMissingCells / totalCells) * 100;
      const errorPercentage = (totalErrorCells / totalCells) * 100;
      
      // Calculate baseline score from metrics
      let baselineScore = 100;
      baselineScore -= Math.min(missingPercentage * 0.8, 40); // Missing values impact
      baselineScore -= Math.min(duplicatePercentage * 2, 20); // Duplicates impact
      baselineScore -= Math.min(errorPercentage * 5, 15); // Errors impact
      baselineScore = Math.max(0, Math.min(100, baselineScore));

      const prompt = `You are a data quality expert. Analyze this dataset and provide PRECISE quality assessment.

DATASET METRICS (CALCULATED):
- Total Rows: ${totalRows}
- Total Columns: ${columns.length}
- Data Completeness: ${completeness.toFixed(2)}%
- Missing Values: ${totalMissingCells} (${missingPercentage.toFixed(2)}%)
- Error Values: ${totalErrorCells} (${errorPercentage.toFixed(2)}%)
- Duplicate Rows: ${duplicates} (${duplicatePercentage.toFixed(2)}%)
- Average Uniqueness: ${avgUniqueness.toFixed(2)}%
- Column Types: ${JSON.stringify(dataTypes)}
- Missing by Column: ${JSON.stringify(missingValues)}
- Errors by Column: ${JSON.stringify(errorValues)}
- Unique Values by Column: ${JSON.stringify(uniqueValues)}

BASELINE CALCULATED SCORE: ${baselineScore.toFixed(0)}/100

Sample Data (first 3 rows):
${JSON.stringify(data.slice(0, Math.min(3, data.length)), null, 2)}

INSTRUCTIONS:
1. Score should be between ${Math.max(0, baselineScore - 15)}-${Math.min(100, baselineScore + 10)}
2. Be SPECIFIC to these actual metrics, not generic
3. If missing % > 20%, flag this as critical
4. If duplicates % > 5%, flag this as critical  
5. If data type inconsistencies exist, mention specific columns

RESPOND IN THIS EXACT FORMAT:
SCORE: [integer 0-100]
INSIGHTS:

📊 DATA QUALITY ANALYSIS:
• [Specific analysis of completeness: ${completeness.toFixed(1)}%]
• [Specific analysis of duplicates: ${duplicatePercentage.toFixed(1)}%]
• [Specific analysis of errors: ${errorPercentage.toFixed(1)}%]

⚠️ ISSUES IDENTIFIED:
• [Specific issue with column or metric]
• [Specific issue with column or metric]
• [Specific issue with column or metric]

💡 RECOMMENDATIONS:
• [Specific actionable recommendation based on metrics]
• [Specific actionable recommendation based on metrics]
• [Specific actionable recommendation based on metrics]

🔧 IMMEDIATE ACTIONS:
• [Priority action 1]
• [Priority action 2]
• [Priority action 3]

Requirements: Use actual numbers from metrics. No generic responses.`;

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timeout')), 15000);
      });

      const apiPromise = model.generateContent(prompt);
      const result = await Promise.race([apiPromise, timeoutPromise]) as any;
      const response = await result.response;
      const text = response.text();
      
      const scoreMatch = text.match(/SCORE:\s*(\d+)/);
      const insightsMatch = text.match(/INSIGHTS:\s*([\s\S]*)/);
      
      let score = scoreMatch ? parseInt(scoreMatch[1]) : Math.round(baselineScore);
      
      // Validate score against baseline
      const minScore = Math.max(0, baselineScore - 15);
      const maxScore = Math.min(100, baselineScore + 10);
      score = Math.max(minScore, Math.min(maxScore, score));
      
      const insights = insightsMatch ? insightsMatch[1].trim() : 'No insights available';
      
      console.log('Quality Assessment:', { 
        baselineScore: baselineScore.toFixed(0), 
        aiScore: score,
        validRange: `${minScore.toFixed(0)}-${maxScore.toFixed(0)}`,
        metrics: { completeness: completeness.toFixed(2), missingPercentage: missingPercentage.toFixed(2), duplicatePercentage: duplicatePercentage.toFixed(2) }
      });
      
      return { score, insights };

    } catch (error) {
      console.warn('Gemini AI unavailable, using fallback analysis:', error);
      return generateFallbackAssessment(data);
    }
  };

  // File upload handler
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    setQualityScore(null);
    setInsights('');
    setCurrentPage(0);
    
    try {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
        setData(dataArray);
      } else {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data as DatasetRow[]);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.type === 'text/csv' || file.type === 'application/json' || file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
      handleFileUpload(file);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // AI Analysis
  const analyzeWithGemini = async () => {
    if (!data.length) return;
    
    setIsAnalyzing(true);
    
    try {
      const assessment = await generateQualityAssessment(data);
      setQualityScore(assessment.score);
      setInsights(assessment.insights);
    } catch (error) {
      console.error('Error analyzing data:', error);
      setQualityScore(0);
      setInsights('Analysis failed. Please try again or check your internet connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-analyze when data is loaded
  useEffect(() => {
    if (data.length > 0) {
      analyzeWithGemini();
    }
  }, [data]);

  // Helper functions for quality metrics
  const calculateDetailedMetrics = () => {
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
        
        if (isMissingValue(value)) {
          missing++;
        } else {
          if (isErrorValue(value)) {
            errors++;
          }
          
          const format = getValueFormat(value);
          formats.add(format);
        }
      });

      missingValues[column] = missing;
      errorValues[column] = errors;
      inconsistentFormats[column] = Math.max(0, formats.size - 1);
    });

    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    const duplicateRows = totalRows - uniqueRows.size;

    const emptyRows = data.filter(row => 
      Object.values(row).every(value => isMissingValue(value))
    ).length;

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
      return !isFinite(value) && !isNaN(value);
    }
    
    return false;
  };

  const getValueFormat = (value: any): string => {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return 'date-iso';
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return 'date-us';
      if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return 'date-dash';
      if (/^\d+$/.test(trimmed)) return 'integer';
      if (/^\d+\.\d+$/.test(trimmed)) return 'decimal';
      if (/^\$\d+(\.\d{2})?$/.test(trimmed)) return 'currency';
      if (/^\d+%$/.test(trimmed)) return 'percentage';
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'email';
      if (/^\+?\d{10,15}$/.test(trimmed.replace(/[\s\-\(\)]/g, ''))) return 'phone';
      
      return 'text';
    }
    
    return 'unknown';
  };

  const getMetricColor = (value: number, threshold: number = 0) => {
    if (value === 0) return 'text-green-600 bg-green-100';
    if (value <= threshold) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Export report function
  const exportReport = () => {
    const report = {
      fileName,
      datasetSize: data.length,
      analysisDate: new Date().toISOString(),
      qualityScore: qualityScore,
      qualityLabel: qualityScore ? getScoreLabel(qualityScore) : 'Unknown',
      insights: insights,
      analyzedBy: 'AI Quality Assessment System',
      analysisMethod: insights.includes('📊') ? 'Gemini AI' : 'Built-in Analysis'
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
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

  // Score helper functions
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

  // Format insights for display
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

  // Marketplace functions
  const isEligibleForSale = qualityScore !== null && qualityScore >= 75;

  const getSuggestedPrice = () => {
    // Base price scales with dataset size (per 1k rows)
    const basePrice = Math.max(10, Math.ceil(data.length / 1000) * 5);
    // Add a small bonus based on quality score so higher-quality datasets get higher suggested price
    const qualityBonus = qualityScore ? Math.round((qualityScore / 100) * 20) : 0; // up to +20
    return basePrice + qualityBonus;
  };

  const handleRedirectToUpload = () => {
    const datasetInfo = {
      fileName,
      qualityScore,
      datasetSize: data.length,
      suggestedPrice: getSuggestedPrice(),
      qualityLabel: qualityScore !== null ? getScoreLabel(qualityScore) : 'Unknown',
      priceLocked: true, // indicate upload page should honour this suggested price
      timestamp: new Date().toISOString()
    };
    
    if (onMarketplaceRedirect) {
      onMarketplaceRedirect(datasetInfo);
    } else {
      localStorage.setItem('datasetInfo', JSON.stringify(datasetInfo));
      // Open upload in the same tab so user stays in flow
      window.location.href = '/upload';
    }
  };

  // Reset function for external use
  const resetAnalyzer = () => {
    setData([]);
    setQualityScore(null);
    setInsights('');
    setFileName('');
    setCurrentPage(0);
  };

  // Data preview calculations
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const totalPages = Math.ceil(data.length / maxRows);
  const startIndex = currentPage * maxRows;
  const visibleData = data.slice(startIndex, startIndex + maxRows);
  const metrics = calculateDetailedMetrics();
  const isAIPowered = insights.includes('📊');

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Database className="w-10 h-10 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Dataset Quality Checker</h1>
            <Sparkles className="w-8 h-8 text-purple-600 ml-3" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get instant AI-powered quality assessment for your datasets. Upload your data and receive 
            a comprehensive quality score with actionable insights from advanced AI analysis.
          </p>
        </header>

        <div className="max-w-6xl mx-auto space-y-8">
          {!data.length ? (
            /* File Upload Section */
            <div className="w-full max-w-2xl mx-auto">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative border-2 border-dashed border-blue-300 rounded-xl p-12 text-center bg-white/80 backdrop-blur-sm hover:border-blue-400 transition-all duration-300 hover:bg-white/90"
              >
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isLoading}
                />
                
                <div className="flex flex-col items-center space-y-4">
                  {isLoading ? (
                    <div className="animate-spin">
                      <Database className="w-12 h-12 text-blue-500" />
                    </div>
                  ) : (
                    <Upload className="w-12 h-12 text-blue-500" />
                  )}
                  
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {isLoading ? 'Processing Dataset...' : 'Upload Your Dataset'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your CSV or JSON file here, or click to browse
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        CSV
                      </span>
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        JSON
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Reset Button */}
              <div className="text-center">
                <button
                  onClick={resetAnalyzer}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Upload New Dataset
                </button>
              </div>

              {/* Data Preview */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Table className="w-5 h-5 mr-2" />
                    Data Preview
                  </h3>
                  <span className="text-sm text-gray-600">
                    {data.length} rows × {columns.length} columns
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        {columns.map((column, index) => (
                          <th
                            key={index}
                            className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                          {columns.map((column, colIndex) => (
                            <td
                              key={colIndex}
                              className="px-4 py-3 text-sm text-gray-800 border-b border-gray-100 max-w-xs truncate"
                              title={String(row[column] || '')}
                            >
                              {row[column] === null || row[column] === undefined || row[column] === '' ? (
                                <span className="text-gray-400 italic">null</span>
                              ) : (
                                String(row[column])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Quality Metrics */}
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

              {/* AI Quality Assessment */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Brain className="w-6 h-6 mr-3 text-purple-600" />
                    AI Quality Assessment
                    {isAIPowered ? (
                      <Wifi className="w-5 h-5 ml-2 text-green-500" title="Powered by AI" />
                    ) : (
                      <WifiOff className="w-5 h-5 ml-2 text-orange-500" title="Using built-in analysis" />
                    )}
                  </h3>
                  {qualityScore !== null && (
                    <button
                      onClick={exportReport}
                      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </button>
                  )}
                </div>

                {/* Analysis Method Indicator */}
                <div className="mb-6">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    isAIPowered 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-orange-100 text-orange-800 border border-orange-200'
                  }`}>
                    {isAIPowered ? (
                      <>
                        <Wifi className="w-4 h-4 mr-2" />
                        Powered by  AI
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 mr-2" />
                        Built-in Analysis (AI temporarily unavailable)
                      </>
                    )}
                  </div>
                </div>

                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-6"></div>
                    <h4 className="text-xl font-semibold text-gray-700 mb-2">Analyzing Dataset Quality</h4>
                    <p className="text-gray-600 text-center max-w-md">
                      AI is examining your dataset structure, completeness, consistency, and overall quality...
                    </p>
                  </div>
                ) : qualityScore === null ? (
                  <div className="text-center py-16 text-gray-500">
                    <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No quality assessment available</p>
                    <p className="text-sm mt-2">Upload a dataset to get started</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Quality Score Display */}
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreColor(qualityScore)} mb-4`}>
                        <div className="text-center">
                          <div className="text-3xl font-bold">{qualityScore}</div>
                          <div className="text-sm font-medium">/ 100</div>
                        </div>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-800 mb-2">{getScoreLabel(qualityScore)}</h4>
                      <div className="flex items-center justify-center space-x-2 text-gray-600">
                        {getScoreIcon(qualityScore)}
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
                        <div className="text-2xl font-bold text-purple-600">{data.length.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Records</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {isAIPowered ? 'Gemini AI' : 'Built-in AI'}
                        </div>
                        <div className="text-sm text-gray-600">Analyzed </div>
                      </div>
                    </div>

                    {/* AI Insights */}
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

              {/* Marketplace Section */}
              {showMarketplace && qualityScore !== null && (
                <div className={`rounded-xl p-6 border ${
                  isEligibleForSale 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className="text-center">
                    {isEligibleForSale ? (
                      <>
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
                            <div className="text-2xl font-bold text-blue-600">{data.length.toLocaleString()}</div>
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
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QualityAnalyzer;
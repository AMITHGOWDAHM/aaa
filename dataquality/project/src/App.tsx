import React, { useState } from 'react';
import Papa from 'papaparse';
import { Database, Sparkles } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { DataPreview } from './components/DataPreview';
import { GeminiQualityScore } from './components/GeminiQualityScore';
import { DataQualityMetrics } from './components/DataQualityMetrics';
import { DatasetMarketplace } from './components/DatasetMarketplace';
import { DatasetRow } from './types/dataset';
import { generateQualityAssessment } from './utils/geminiAI';

function App() {
  const [data, setData] = useState<DatasetRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [insights, setInsights] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);
    setQualityScore(null);
    setInsights('');
    
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

  const analyzeWithGemini = async () => {
    if (!data.length) return;
    
    setIsAnalyzing(true);
    
    try {
      const assessment = await generateQualityAssessment(data);
      setQualityScore(assessment.score);
      setInsights(assessment.insights);
    } catch (error) {
      console.error('Error analyzing data with Gemini:', error);
      setQualityScore(null);
      setInsights('Failed to analyze dataset. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMarketplaceUpload = (listingData: any) => {
    // This function is now handled by the redirect to upload page
    console.log('Redirecting to marketplace upload page...');
  };

  // Auto-analyze when data is loaded
  React.useEffect(() => {
    if (data.length > 0) {
      analyzeWithGemini();
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Database className="w-10 h-10 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Dataset Quality Checker</h1>
            <Sparkles className="w-8 h-8 text-purple-600 ml-3" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get instant AI-powered quality assessment for your datasets. Upload your data and receive 
            a comprehensive quality score with actionable insights from Google Gemini AI.
          </p>
        </header>

        <div className="max-w-6xl mx-auto space-y-8">
          {!data.length ? (
            <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
          ) : (
            <>
              <div className="text-center">
                <button
                  onClick={() => {
                    setData([]);
                    setQualityScore(null);
                    setInsights('');
                    setFileName('');
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Upload New Dataset
                </button>
              </div>

              <DataPreview data={data} />
              
              <DataQualityMetrics data={data} fileName={fileName} />
              
              <GeminiQualityScore 
                score={qualityScore}
                insights={insights}
                isLoading={isAnalyzing}
                fileName={fileName}
                datasetSize={data.length}
              />

              {qualityScore !== null && (
                <DatasetMarketplace
                  qualityScore={qualityScore}
                  fileName={fileName}
                  datasetSize={data.length}
                  onUploadToMarketplace={handleMarketplaceUpload}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
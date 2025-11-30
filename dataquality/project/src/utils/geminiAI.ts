import { GoogleGenerativeAI } from '@google/generative-ai';
import { DatasetRow } from '../types/dataset';

const API_KEY = 'AIzaSyCvMQpDafHAHIkfU2SrMug2LMqwLNYZKPY'; // Replace with your actual API key

let genAI: GoogleGenerativeAI | null = null;

export const initializeGemini = () => {
  genAI = new GoogleGenerativeAI(API_KEY);
};

export const generateQualityAssessment = async (data: DatasetRow[]): Promise<{score: number, insights: string}> => {
  if (!genAI) {
    initializeGemini();
  }

  if (!genAI) {
    throw new Error('Failed to initialize Gemini AI');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Prepare dataset summary for analysis
  const columns = Object.keys(data[0] || {});
  const totalRows = data.length;
  
  // Calculate basic metrics
  const missingValues: { [key: string]: number } = {};
  const dataTypes: { [key: string]: string } = {};
  
  columns.forEach(column => {
    const values = data.map(row => row[column]);
    const nonNullValues = values.filter(val => val !== null && val !== undefined && val !== '');
    missingValues[column] = totalRows - nonNullValues.length;
    
    if (nonNullValues.length > 0) {
      const sampleValue = nonNullValues[0];
      if (typeof sampleValue === 'number' || !isNaN(Number(sampleValue))) {
        dataTypes[column] = 'numeric';
      } else if (typeof sampleValue === 'boolean') {
        dataTypes[column] = 'boolean';
      } else {
        dataTypes[column] = 'text';
      }
    }
  });

  const duplicates = totalRows - new Set(data.map(row => JSON.stringify(row))).size;
  const totalCells = totalRows * columns.length;
  const totalMissingCells = Object.values(missingValues).reduce((sum, count) => sum + count, 0);
  const completeness = ((totalCells - totalMissingCells) / totalCells) * 100;

  const prompt = `
    You are a data quality expert. Analyze this dataset and provide:
    1. A quality score from 0-100
    2. Point-wise analysis and recommendations

    Dataset Summary:
    - Total Rows: ${totalRows}
    - Total Columns: ${columns.length}
    - Data Completeness: ${completeness.toFixed(2)}%
    - Duplicate Records: ${duplicates}
    - Column Types: ${JSON.stringify(dataTypes)}
    - Missing Values per Column: ${JSON.stringify(missingValues)}

    Sample Data (first 3 rows):
    ${JSON.stringify(data.slice(0, 3), null, 2)}

    Please respond in this exact format:
    SCORE: [number from 0-100]
    INSIGHTS:
    
    📊 DATA QUALITY ANALYSIS:
    • [Point about overall data quality]
    • [Point about data completeness]
    • [Point about data consistency]
    
    ⚠️ ISSUES IDENTIFIED:
    • [Specific issue 1]
    • [Specific issue 2]
    • [Specific issue 3]
    
    💡 RECOMMENDATIONS:
    • [Actionable recommendation 1]
    • [Actionable recommendation 2]
    • [Actionable recommendation 3]
    
    🔧 IMMEDIATE ACTIONS:
    • [Priority action 1]
    • [Priority action 2]
    • [Priority action 3]

    Make each point concise, specific, and actionable. Focus on the most critical quality issues and practical solutions.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response
    const scoreMatch = text.match(/SCORE:\s*(\d+)/);
    const insightsMatch = text.match(/INSIGHTS:\s*([\s\S]*)/);
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const insights = insightsMatch ? insightsMatch[1].trim() : 'No insights available';
    
    return { score, insights };
  } catch (error) {
    console.error('Error generating quality assessment:', error);
    throw error;
  }
};
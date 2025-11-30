// routes/qualityCheck.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  const { preview, metrics } = req.body;

  if (!preview) return res.status(400).json({ error: 'Preview data is required.' });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Calculate baseline score from metrics if provided
    let baselineScore = 75;
    if (metrics) {
      const { completeness, duplicatePercentage, errorPercentage } = metrics;
      baselineScore = 100;
      if (completeness !== undefined) baselineScore -= Math.min((100 - completeness) * 0.8, 40);
      if (duplicatePercentage !== undefined) baselineScore -= Math.min(duplicatePercentage * 2, 20);
      if (errorPercentage !== undefined) baselineScore -= Math.min(errorPercentage * 5, 15);
      baselineScore = Math.max(0, Math.min(100, baselineScore));
    }

    const metricsContext = metrics ? `
Dataset Metrics:
- Completeness: ${metrics.completeness?.toFixed(2)}%
- Duplicate Records: ${metrics.duplicatePercentage?.toFixed(2)}%
- Error Values: ${metrics.errorPercentage?.toFixed(2)}%
- Missing Values: ${metrics.missingPercentage?.toFixed(2)}%
- Data Types: ${JSON.stringify(metrics.dataTypes || {})}
Baseline Calculated Score: ${baselineScore}/100
` : '';

    const prompt = `
You are a dataset quality expert. Analyze the following dataset preview and provide a quality score from 0 to 100.

${metricsContext}

Dataset Preview:
${preview}

${metrics ? `Your score should be between ${Math.max(0, baselineScore - 15)}-${Math.min(100, baselineScore + 10)} based on calculated metrics.` : ''}

Respond in JSON format ONLY:
{
  "score": <integer 0-100>,
  "reason": "<specific reason based on the data - be concise>",
  "issues": ["<issue 1>", "<issue 2>", "<issue 3>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

Be specific and reference actual data patterns you observe. Do not be generic.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON safely
    const match = response.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid Gemini response");

    const quality = JSON.parse(match[0]);
    
    // Validate score if metrics were provided
    if (metrics) {
      const minScore = Math.max(0, baselineScore - 15);
      const maxScore = Math.min(100, baselineScore + 10);
      quality.score = Math.max(minScore, Math.min(maxScore, quality.score));
    }
    
    return res.json(quality);
  } catch (error) {
    console.error('Gemini Error:', error.message);
    return res.status(500).json({ error: 'Gemini evaluation failed.' });
  }
});

module.exports = router;

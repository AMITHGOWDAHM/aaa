const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  const { previewData } = req.body;
  if (!previewData) return res.status(400).json({ error: 'No preview data provided' });

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;
    const prompt = `You are a data quality expert. Analyze the following dataset preview and provide a quality score (0-100) and a short explanation. Dataset preview:\n${previewData}`;

    const geminiRes = await axios.post(geminiEndpoint, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    const geminiText = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ result: geminiText });
  } catch (err) {
    console.error('Gemini API error:', err?.response?.data || err.message || err);
    res.status(500).json({ 
      error: 'Failed to check dataset quality',
      details: err?.response?.data || err.message || err
    });
  }
});

module.exports = router;
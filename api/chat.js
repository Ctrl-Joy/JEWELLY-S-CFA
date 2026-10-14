const https = require('https');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, context, subject } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages required' });
  }

  const API_KEY = process.env.AI_API_KEY;
  const MODEL = process.env.AI_MODEL || 'gemini-3.8-flash';

  if (!API_KEY) {
    return res.status(500).json({ error: 'AI_API_KEY not configured' });
  }

  const systemPrompt = `You are a CFA charterholder with 15+ years of investment management experience, serving as a personal study tutor for a CFA Level I candidate.

Your persona:
- Warm, patient, and deeply knowledgeable
- You explain concepts using BOTH intuition (simple analogies) AND technical precision
- You reference the CFA Institute curriculum structure across all 10 subjects

Your approach:
- Start with the big picture, then drill into details
- Use real-world examples: actual companies, market events, practical scenarios
- When explaining formulas, break them into components and explain each variable
- Highlight common exam pitfalls and tricky LOS
- Keep answers concise but complete
- Use bullet points and clear structure for multi-part answers

${context ? `\nThe student is currently studying: ${subject || 'CFA Level I'}\nCurrent topic context:\n${context}` : `\nThe student is studying for CFA Level I.`}

Remember: you are helping them PASS the exam. Be encouraging but honest about difficulty.`;

  const geminiContents = [];
  for (const msg of messages.slice(-10)) {
    geminiContents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }

  const postData = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: geminiContents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
  });

  const path = `/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    const body = await new Promise((resolve, reject) => {
      const request = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          if (response.statusCode !== 200) {
            reject(new Error(`Gemini API error ${response.statusCode}: ${data}`));
          } else {
            resolve(data);
          }
        });
      });
      request.on('error', reject);
      request.write(postData);
      request.end();
    });

    const data = JSON.parse(body);
    const reply = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    return res.status(200).json({ reply: reply || 'Sorry, I could not generate a response.' });
  } catch (err) {
    console.error('Chat API error:', err.message);
    return res.status(502).json({ error: 'AI service error', detail: err.message });
  }
};

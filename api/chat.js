const https = require('https');

const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'];

function callGemini(model, postData, apiKey) {
  return new Promise((resolve, reject) => {
    const path = `/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const request = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 8000
    }, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve(data);
        } else {
          reject({ status: response.statusCode, body: data, model: model });
        }
      });
    });
    request.on('timeout', () => {
      request.destroy();
      reject({ status: 0, body: 'Request timed out after 8s', model: model });
    });
    request.on('error', (err) => reject({ status: 0, body: err.message, model: model }));
    request.write(postData);
    request.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, context, subject } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages required' });
  }

  const API_KEY = process.env.AI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'AI_API_KEY not configured' });
  }

  const systemPrompt = `You are a CFA Level I tutor. Be concise, accurate, and encouraging. Use real-world examples. Highlight exam pitfalls.

CRITICAL formatting rules:
- For equations, wrap them in \\[...\\] on their own line. Example: \\[FV = PV \\times (1 + r)^N\\]
- For inline math variables like r or N, wrap in \\(...\\). Example: where \\(r\\) is the rate.
- NEVER use dollar sign $ as a math delimiter. Write currency as USD 1,000 or 1,000 dollars.
- Use **bold** for emphasis, ### for headings.
- Keep answers short and clear.

${context ? `Topic: ${subject || 'CFA Level I'}\nContext: ${context.substring(0, 500)}` : 'Subject: CFA Level I.'}`;

  const geminiContents = [];
  for (const msg of messages.slice(-6)) {
    geminiContents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }

  const postData = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: geminiContents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
  });

  // Try each model in order — fallback if one is overloaded or unavailable
  let lastErr = null;
  for (const model of MODELS) {
    try {
      const body = await callGemini(model, postData, API_KEY);
      const data = JSON.parse(body);
      const reply = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: reply || 'Sorry, I could not generate a response.' });
    } catch (err) {
      lastErr = err;
      console.error(`Model ${err.model || model} failed (${err.status}): ${(err.body || '').substring(0, 200)}`);
      continue;
    }
  }

  return res.status(502).json({ error: 'All AI models are currently busy. Please try again in a moment.' });
};

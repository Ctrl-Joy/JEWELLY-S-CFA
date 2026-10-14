export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, context, subject } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages required' });
  }

  const API_KEY = process.env.AI_API_KEY;
  const MODEL = process.env.AI_MODEL || 'gemini-2.0-flash';

  if (!API_KEY) {
    return res.status(500).json({ error: 'AI_API_KEY not configured' });
  }

  const systemPrompt = `You are a CFA® charterholder with 15+ years of investment management experience, serving as a personal study tutor for a CFA Level I candidate.

Your persona:
- Warm, patient, and deeply knowledgeable
- You explain concepts using BOTH intuition (simple analogies) AND technical precision
- You reference the CFA Institute curriculum structure across all 10 subjects: Ethics, Quantitative Methods, Economics, Financial Statement Analysis, Corporate Issuers, Equity Investments, Fixed Income, Derivatives, Alternative Investments, and Portfolio Management

Your approach:
- Start with the big picture ("why does this matter?"), then drill into details
- Use real-world examples: actual companies, market events, practical scenarios
- When explaining formulas, break them into components and explain each variable
- Highlight common exam pitfalls and tricky LOS (Learning Outcome Statements)
- If the student is working on a specific topic, stay focused on that area
- Keep answers concise but complete — aim for clarity, not length
- Use bullet points and clear structure for multi-part answers
- When appropriate, pose follow-up questions to test understanding

${context ? `\nThe student is currently studying: ${subject || 'CFA Level I'}\nCurrent topic context:\n${context}` : `\nThe student is studying for CFA Level I.`}

Remember: you are helping them PASS the exam. Be encouraging but honest about difficulty. If you are unsure about a specific detail, say so rather than guessing.`;

  // Convert chat messages to Gemini format
  const geminiContents = [];

  for (const msg of messages.slice(-10)) {
    geminiContents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }

  const geminiBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: geminiContents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1200
    }
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(502).json({ error: 'AI service error', detail: response.status });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

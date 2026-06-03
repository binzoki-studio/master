export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { provider, model, prompt } = req.body;
  if (!provider || !model || !prompt) {
    return res.status(400).json({ error: 'Missing required fields: provider, model, prompt' });
  }

  const t0 = Date.now();

  try {
    let content, tokens_in, tokens_out;

    // ── Mistral & OpenAI (same OpenAI-compatible format) ──────────────────────
    if (provider === 'mistral' || provider === 'openai') {
      const baseURL =
        provider === 'mistral'
          ? 'https://api.mistral.ai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';

      const apiKey =
        provider === 'mistral'
          ? process.env.MISTRAL_API_KEY
          : process.env.OPENAI_API_KEY;

      if (!apiKey) return res.status(500).json({ error: `${provider.toUpperCase()}_API_KEY not set` });

      const upstream = await fetch(baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data.error?.message || data.message || upstream.statusText);

      content    = data.choices?.[0]?.message?.content ?? '';
      tokens_in  = data.usage?.prompt_tokens     ?? 0;
      tokens_out = data.usage?.completion_tokens ?? 0;
    }

    // ── Anthropic ─────────────────────────────────────────────────────────────
    else if (provider === 'anthropic') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data.error?.message || upstream.statusText);

      content    = data.content?.[0]?.text ?? '';
      tokens_in  = data.usage?.input_tokens  ?? 0;
      tokens_out = data.usage?.output_tokens ?? 0;
    }

    // ── Google Gemini ─────────────────────────────────────────────────────────
    else if (provider === 'google') {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY not set' });

      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data.error?.message || upstream.statusText);

      content    = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      tokens_in  = data.usageMetadata?.promptTokenCount     ?? 0;
      tokens_out = data.usageMetadata?.candidatesTokenCount ?? 0;
    }

    else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    return res.status(200).json({
      content,
      response_time_ms: Date.now() - t0,
      tokens_in,
      tokens_out,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

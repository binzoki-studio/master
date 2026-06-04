export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { provider, model, prompt, apiKeys = {} } = req.body;
  if (!provider || !model || !prompt) {
    return res.status(400).json({ error: 'Missing required fields: provider, model, prompt' });
  }

  // Keys come from the client — never stored server-side
  const key = {
    mistral:   apiKeys.mistral   || '',
    openai:    apiKeys.openai    || '',
    anthropic: apiKeys.anthropic || '',
    google:    apiKeys.google    || '',
  };

  const t0 = Date.now();

  try {
    let content, tokens_in, tokens_out;

    // ── Mistral & OpenAI (OpenAI-compatible) ─────────────────────────────────
    if (provider === 'mistral' || provider === 'openai') {
      const baseURL =
        provider === 'mistral'
          ? 'https://api.mistral.ai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
      const apiKey = key[provider];
      if (!apiKey) return res.status(401).json({ error: `No ${provider} API key provided` });

      const upstream = await fetch(baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data.error?.message || data.message || upstream.statusText);

      content    = data.choices?.[0]?.message?.content ?? '';
      tokens_in  = data.usage?.prompt_tokens     ?? 0;
      tokens_out = data.usage?.completion_tokens ?? 0;
    }

    // ── Anthropic ─────────────────────────────────────────────────────────────
    else if (provider === 'anthropic') {
      const apiKey = key.anthropic;
      if (!apiKey) return res.status(401).json({ error: 'No Anthropic API key provided' });

      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await upstream.json();
      if (!upstream.ok) throw new Error(data.error?.message || upstream.statusText);

      content    = data.content?.[0]?.text ?? '';
      tokens_in  = data.usage?.input_tokens  ?? 0;
      tokens_out = data.usage?.output_tokens ?? 0;
    }

    // ── Google Gemini ─────────────────────────────────────────────────────────
    else if (provider === 'google') {
      const apiKey = key.google;
      if (!apiKey) return res.status(401).json({ error: 'No Google API key provided' });

      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
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

    return res.status(200).json({ content, response_time_ms: Date.now() - t0, tokens_in, tokens_out });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

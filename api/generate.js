export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { theme } = req.body;
  if (!theme) return res.status(400).json({ error: 'Missing theme' });

  const prompt = `請生成10個日文單字，主題是「${theme}」。每個單字請包含：日文（jp）、假名讀音（reading，羅馬拼音格式）、繁體中文意思（zh）、詞性或分類標籤（tag，2-4字）、以及一個日文例句含繁體中文翻譯（ex，格式：日文句子。（中文翻譯。））。請只回傳 JSON 陣列，不要有任何其他文字或 markdown，格式如下：[{"jp":"...","reading":"...","zh":"...","tag":"...","ex":"..."}]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: 'Anthropic error: ' + errText });
    }

    const data = await response.json();
    const text = data.content.map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const vocab = JSON.parse(clean);
    return res.status(200).json({ vocab });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}

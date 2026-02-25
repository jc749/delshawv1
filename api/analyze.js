// api/analyze.js - Vercel Serverless Function
// Uses Claude grounded in Sloan's real agent profile + 24h Notion content
// Titles + summaries only sent to AI — never full article text

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SLOAN_PAGE_ID = '311eef71-c277-81c5-b06d-e6e9da12a29e';

// Fetch Sloan's agent profile from Notion — the AI's north star for every output
async function fetchSloanProfile() {
  try {
    const response = await fetch(`https://api.notion.com/v1/blocks/${SLOAN_PAGE_ID}/children`, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
      },
    });
    const data = await response.json();
    return (data.results || [])
      .map(block => (block[block.type]?.rich_text || []).map(rt => rt.plain_text).join(''))
      .filter(Boolean)
      .join('\n');
  } catch (err) {
    // Inline fallback so nothing breaks if Notion is down
    return `
Sloan Whiteside-Munteanu — Associate, Del Shaw Mackintosh & Kaiserman.
Black, queer, woman. Operates as agent + strategist + lawyer combined. Cultural competence is her edge.

ICP: Multi-hyphenates (actor/writer, actor/producer, actor/director) above all. Digital creators who OWN their content. Musicians transitioning to TV/Film. Black, brown, queer, women talent. Earlier-stage talent she can grow with.

NOT looking for: pure influencers with no creative ownership.

Deal philosophy: 360 thinker. Every deal is a stepping stone to a 5-year goal. Always stacks supplemental deals — brand, equity, IP. Asks: how does this work LONG AFTER the deal is done? Comes out of every negotiation with more.

LinkedIn voice: Sharp, culturally fluent, strategic, confident without being loud. Real inside-the-industry POV — not generic agent takes.
    `.trim();
  }
}

// Compact context: titles + summaries only, never full text
function buildNewsContext(articles = [], episodes = []) {
  const lines = [
    ...articles.map(a => `[ARTICLE] "${a.title}" (${a.source})${a.summary ? ` — ${a.summary}` : ''}`),
    ...episodes.map(e => `[PODCAST] ${e.podcast}: "${e.episode}"${e.summary ? ` — ${e.summary}` : ''}`),
  ];
  return lines.join('\n');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const { type, client: clientData = {}, articles = [], episodes = [], userMessage } = req.body;

  const sloanProfile = await fetchSloanProfile();
  const newsContext = buildNewsContext(articles, episodes);
  const clientContext = clientData.name ? `CLIENT: ${clientData.name} (${clientData.handle || ''}) | Followers: ${clientData.followers || ''} | Engagement: ${clientData.engagementRate || ''} | Brands: ${clientData.brandAffinity || ''} | Audience: ${clientData.audienceGender || ''} | Markets: ${clientData.topLocations || ''}` : '';

  const prompts = {
    negotiation: `You are Sloan Whiteside-Munteanu's AI strategy partner at Del Shaw Mackintosh & Kaiserman.

SLOAN'S PROFILE & ICP:
${sloanProfile}

${clientContext ? `CLIENT:\n${clientContext}\n` : ''}
TODAY'S CONTENT (past 24h, titles + summaries from Notion):
${newsContext}

Generate 4 sharp negotiation leverage points for ${clientData.name || 'this client'}.
- Connect SPECIFIC stories from today's content to concrete deal advantages
- Frame through Sloan's 360 lens: supplemental deal stacking, digital ownership, long-term career architecture
- Think like someone who has seen deals from both the agent AND lawyer side
- Format as markdown with bold headers`,

    news: `You are Sloan Whiteside-Munteanu's AI strategy partner.

SLOAN'S PROFILE & ICP:
${sloanProfile}

${clientContext ? `CLIENT:\n${clientContext}\n` : ''}
TODAY'S CONTENT (past 24h from Notion):
${newsContext}

Select the 3 stories most relevant to ${clientData.name || "Sloan's book"}.
Prioritize: multi-hyphenate deals, digital creators crossing to film/TV, musicians transitioning to screen, ownership/equity deals, Black/brown/queer talent wins, platform deals affecting creator leverage.
For each, explain why it matters specifically to this client AND to Sloan's deal philosophy.
Return JSON array: [{"title": "REAL title from content", "source": "...", "why": "...", "url": "..."}]
Use ONLY real titles. Never fabricate.`,

    strategy: `You are Sloan Whiteside-Munteanu's AI strategy partner.

SLOAN'S PROFILE & ICP:
${sloanProfile}

${clientContext ? `CLIENT:\n${clientContext}\n` : ''}
TODAY'S CONTENT (past 24h):
${newsContext}

Generate 3 monetization strategy ideas for ${clientData.name || 'this client'} grounded in what's happening right now.
Every idea must address: what happens LONG AFTER the primary deal?
Think: supplemental stacking, brand equity, IP ownership, digital leverage, 5-year architecture.
Format as bold cards with header + 2-3 actionable steps.`,

    'sloan-desk': `You are Sloan Whiteside-Munteanu's AI intelligence partner at Del Shaw Mackintosh & Kaiserman.

SLOAN'S PROFILE & ICP:
${sloanProfile}

TODAY'S CONTENT (all past 24h articles + podcasts, titles + summaries only):
${newsContext}

Generate entirely from the real content above — zero fabrication:

1. "headlines": 5 objects. Pick stories that matter to Sloan's specific book. Each:
   - "title": REAL title from above (never invent)
   - "source": publication
   - "why": why this matters to Sloan — connect to her ICP (multi-hyphenates, digital creators, musicians, Black/brown/queer talent, ownership deals)
   - "url": real URL or null

2. "linkedin": 3 posts in Sloan's voice:
   - Sharp, culturally fluent, strategic, confident without being loud
   - What a Black queer woman who grew up in entertainment law actually thinks about this news
   - Based on specific real stories from above. No generic agent takes.

3. "pitches": 3 objects — "hook" and "target" based on real trends above.

Return ONLY valid JSON.`,

    chat: `You are Sloan Whiteside-Munteanu's AI strategy partner at Del Shaw Mackintosh & Kaiserman.

SLOAN'S PROFILE & DEAL PHILOSOPHY:
${sloanProfile}

${clientContext ? `CLIENT:\n${clientContext}\n` : ''}
TODAY'S CONTENT (past 24h from Notion):
${newsContext}

USER QUESTION: ${userMessage}

Answer with the depth of someone who has seen deals from both the agent and lawyer side.
Reference specific real stories from today's content where relevant.
Think in terms of 360 deals, supplemental stacking, long-term career architecture — not single transactions.`,
  };

  const prompt = prompts[type];
  if (!prompt) return res.status(400).json({ error: `Unknown analysis type: ${type}` });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    if (type === 'news' || type === 'sloan-desk') {
      const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
      if (jsonMatch) {
        try { return res.status(200).json({ result: JSON.parse(jsonMatch[0]) }); } catch {}
      }
    }

    return res.status(200).json({ result: text });
  } catch (err) {
    console.error('Analyze error:', err);
    return res.status(500).json({ error: 'Analysis failed', details: err.message });
  }
}

// api/talent-radar.js - Vercel Serverless Function
// AI extracts prospects from 24h Notion content, scored against Sloan's real ICP
// Saves back to Del Shaw Talent Radar Notion DB

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const TALENT_RADAR_DB_ID = process.env.NOTION_TALENT_RADAR_DB_ID || 'c84b0577-e4f8-44fc-bf33-d309276ed279';
const SLOAN_PAGE_ID = '311eef71-c277-81c5-b06d-e6e9da12a29e';

async function fetchSloanProfile() {
  try {
    const response = await fetch(`https://api.notion.com/v1/blocks/${SLOAN_PAGE_ID}/children`, {
      headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28' },
    });
    const data = await response.json();
    return (data.results || [])
      .map(block => (block[block.type]?.rich_text || []).map(rt => rt.plain_text).join(''))
      .filter(Boolean)
      .join('\n');
  } catch {
    return `Sloan's ICP: Multi-hyphenates above all. Digital creators who own their content. Musicians transitioning to TV/Film. Black, brown, queer, women talent. NOT pure influencers.`;
  }
}

async function fetchExistingProspects() {
  const response = await fetch(`https://api.notion.com/v1/databases/${TALENT_RADAR_DB_ID}/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    body: JSON.stringify({ page_size: 100 }),
  });
  const data = await response.json();
  return (data.results || []).map(p => ({
    id: p.id,
    name: p.properties?.Name?.title?.[0]?.plain_text || '',
    matchScore: p.properties?.['Match Score']?.number || 0,
    whyFit: p.properties?.["Why They're a Fit"]?.rich_text?.[0]?.plain_text || '',
    source: p.properties?.Source?.select?.name || '',
    link: p.properties?.Link?.url || '',
    platform: p.properties?.Platform?.multi_select?.map(p => p.name) || [],
    followersReach: p.properties?.['Followers/Reach']?.rich_text?.[0]?.plain_text || '',
    upsideNotes: p.properties?.['Upside Notes']?.rich_text?.[0]?.plain_text || '',
    status: p.properties?.Status?.select?.name || 'New',
    addedBy: p.properties?.['Added By']?.select?.name || 'AI',
    sourceArticle: p.properties?.['Source Article/Episode']?.rich_text?.[0]?.plain_text || '',
  }));
}

async function saveProspect(prospect) {
  const today = new Date().toISOString().split('T')[0];
  return fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parent: { database_id: TALENT_RADAR_DB_ID },
      properties: {
        Name: { title: [{ text: { content: prospect.name } }] },
        'Match Score': { number: prospect.matchScore },
        "Why They're a Fit": { rich_text: [{ text: { content: prospect.whyFit || '' } }] },
        Source: { select: { name: prospect.source || 'Article' } },
        'Source Article/Episode': { rich_text: [{ text: { content: prospect.sourceArticle || '' } }] },
        Link: prospect.link ? { url: prospect.link } : { url: null },
        Platform: { multi_select: (prospect.platform || []).map(p => ({ name: p })) },
        'Followers/Reach': { rich_text: [{ text: { content: prospect.followersReach || '' } }] },
        'Upside Notes': { rich_text: [{ text: { content: prospect.upsideNotes || '' } }] },
        Status: { select: { name: 'New' } },
        'Added By': { select: { name: 'AI' } },
        'Date Added': { date: { start: today } },
      },
    }),
  }).then(r => r.json());
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const prospects = await fetchExistingProspects();
      return res.status(200).json({ prospects });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch prospects', details: err.message });
    }
  }

  if (req.method === 'POST') {
    const { articles = [], episodes = [], clients = [] } = req.body;
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

    try {
      const [sloanProfile, existing] = await Promise.all([fetchSloanProfile(), fetchExistingProspects()]);
      const existingNames = existing.map(p => p.name.toLowerCase());

      // Titles + summaries only
      const newsContext = [
        ...articles.map(a => `[ARTICLE] "${a.title}" (${a.source})${a.summary ? ` — ${a.summary}` : ''}`),
        ...episodes.map(e => `[PODCAST] ${e.podcast}: "${e.episode}"${e.summary ? ` — ${e.summary}` : ''}`),
      ].join('\n');

      const clientContext = clients.map(c =>
        `CLIENT: ${c.name} | Brands: ${c.brandAffinity} | Similar audiences: ${c.similarAudiences}`
      ).join('\n');

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `You are a talent intelligence analyst for Sloan Whiteside-Munteanu at Del Shaw Mackintosh & Kaiserman.

SLOAN'S FULL PROFILE & ICP — use this to score every prospect:
${sloanProfile}

CURRENT CLIENTS (for lookalike context):
${clientContext}

TODAY'S CONTENT (past 24h, titles + summaries):
${newsContext}

Extract 8-12 emerging talent prospects from this content.

SCORING RULES (be strict — Sloan only wants people she'd actually pursue):
- 9-10: Multi-hyphenate + Black/brown/queer/woman + digital ownership + upward trajectory
- 7-8: Strong ICP match on 2-3 dimensions, clear upside
- 6: Borderline — flag but note the gap
- Below 6: Don't include

For each prospect return:
name, whyFit (specific to Sloan's ICP and deal philosophy), source ("Article"/"Podcast"/"Client Lookalike"), sourceArticle (which piece they came from), platform (array), followersReach, upsideNotes (what makes them interesting RIGHT NOW), matchScore, link (Instagram/TikTok/YouTube URL if known, else null)

Focus on emerging talent — not established names already widely represented.
Respond ONLY with a JSON array.`,
        }],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return res.status(500).json({ error: 'AI response did not contain valid JSON' });

      const prospects = JSON.parse(jsonMatch[0]);
      const newProspects = prospects.filter(p => !existingNames.includes(p.name.toLowerCase()));

      await Promise.allSettled(newProspects.map(p => saveProspect(p)));

      const allProspects = await fetchExistingProspects();
      return res.status(200).json({ prospects: allProspects, newCount: newProspects.length });

    } catch (err) {
      console.error('Talent radar error:', err);
      return res.status(500).json({ error: 'Talent radar failed', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

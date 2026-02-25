// api/talent-radar.js - Vercel Serverless Function
// Fetches full article + podcast body text from Notion pages, extracts emerging talent

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const TALENT_RADAR_DB_ID = process.env.NOTION_TALENT_RADAR_DB_ID || 'c84b0577-e4f8-44fc-bf33-d309276ed279';
const ARTICLES_DB_ID = process.env.NOTION_ARTICLES_DB_ID || '301eef71c27780148ba5f048398047ec';
const PODCASTS_DB_ID = process.env.NOTION_PODCASTS_DB_ID || '300eef71c27780adb33ce0af8fd04623';
const SLOAN_PAGE_ID = '311eef71-c277-81c5-b06d-e6e9da12a29e';

const notionHeaders = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function fetchPageBody(pageId) {
  try {
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
      headers: notionHeaders,
    });
    const data = await res.json();
    return (data.results || [])
      .map(block => (block[block.type]?.rich_text || []).map(rt => rt.plain_text).join(''))
      .filter(Boolean)
      .join(' ')
      .slice(0, 1500);
  } catch {
    return '';
  }
}

async function fetchSloanProfile() {
  try {
    const res = await fetch(`https://api.notion.com/v1/blocks/${SLOAN_PAGE_ID}/children`, {
      headers: notionHeaders,
    });
    const data = await res.json();
    return (data.results || [])
      .map(block => (block[block.type]?.rich_text || []).map(rt => rt.plain_text).join(''))
      .filter(Boolean)
      .join('\n')
      .slice(0, 2000);
  } catch {
    return `Sloan's ICP: Multi-hyphenates above all. Digital creators who own their content. Musicians transitioning to TV/Film. Black, brown, queer, women talent. NOT pure influencers.`;
  }
}

async function fetchArticlesWithBody() {
  try {
    // Try sorted first, fall back to unsorted if sort fails
    let res = await fetch(`https://api.notion.com/v1/databases/${ARTICLES_DB_ID}/query`, {
      method: 'POST',
      headers: notionHeaders,
      body: JSON.stringify({ page_size: 20, sorts: [{ property: 'Date', direction: 'descending' }] }),
    });
    let data = await res.json();

    // If sort failed, retry without sort
    if (data.object === 'error' || !data.results) {
      console.log('Articles sort failed, retrying without sort:', data.message);
      res = await fetch(`https://api.notion.com/v1/databases/${ARTICLES_DB_ID}/query`, {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify({ page_size: 20 }),
      });
      data = await res.json();
    }

    const pages = data.results || [];
    console.log(`Fetched ${pages.length} article pages`);

    const articles = await Promise.all(pages.map(async (page) => {
      const title = page.properties?.Title?.rich_text?.[0]?.plain_text || '';
      const source = page.properties?.Source?.title?.[0]?.plain_text || '';
      const summary = page.properties?.Summary?.rich_text?.[0]?.plain_text || '';
      const url = page.properties?.URL?.url || page.properties?.['userDefined:URL']?.url || null;
      const body = await fetchPageBody(page.id);
      console.log(`Article: "${title}" — body length: ${body.length}`);
      return { title, source, summary, url, body };
    }));

    return articles.filter(a => a.title || a.body);
  } catch (err) {
    console.error('fetchArticlesWithBody error:', err.message);
    return [];
  }
}

async function fetchEpisodesWithBody() {
  try {
    let res = await fetch(`https://api.notion.com/v1/databases/${PODCASTS_DB_ID}/query`, {
      method: 'POST',
      headers: notionHeaders,
      body: JSON.stringify({ page_size: 10, sorts: [{ property: 'Date', direction: 'descending' }] }),
    });
    let data = await res.json();

    if (data.object === 'error' || !data.results) {
      console.log('Episodes sort failed, retrying without sort:', data.message);
      res = await fetch(`https://api.notion.com/v1/databases/${PODCASTS_DB_ID}/query`, {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify({ page_size: 10 }),
      });
      data = await res.json();
    }

    const pages = data.results || [];
    console.log(`Fetched ${pages.length} episode pages`);

    const episodes = await Promise.all(pages.map(async (page) => {
      const podcast = page.properties?.Podcast?.title?.[0]?.plain_text || '';
      const episode = page.properties?.Episode?.rich_text?.[0]?.plain_text || '';
      const summary = page.properties?.Summary?.rich_text?.[0]?.plain_text || '';
      const body = await fetchPageBody(page.id);
      console.log(`Episode: "${podcast}" — body length: ${body.length}`);
      return { podcast, episode, summary, body };
    }));

    return episodes.filter(e => e.podcast || e.body);
  } catch (err) {
    console.error('fetchEpisodesWithBody error:', err.message);
    return [];
  }
}

async function fetchExistingProspects() {
  const res = await fetch(`https://api.notion.com/v1/databases/${TALENT_RADAR_DB_ID}/query`, {
    method: 'POST',
    headers: notionHeaders,
    body: JSON.stringify({ page_size: 100 }),
  });
  const data = await res.json();
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
    headers: notionHeaders,
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
    const { clients = [] } = req.body;
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

    try {
      const [sloanProfile, existing, articles, episodes] = await Promise.all([
        fetchSloanProfile(),
        fetchExistingProspects(),
        fetchArticlesWithBody(),
        fetchEpisodesWithBody(),
      ]);

      const existingNames = existing.map(p => p.name.toLowerCase());

      const articleContext = articles.map(a =>
        `[ARTICLE] "${a.title}" (${a.source})\n${a.body || a.summary}`
      ).join('\n\n---\n\n');

      const episodeContext = episodes.map(e =>
        `[PODCAST] ${e.podcast}: "${e.episode}"\n${e.body || e.summary}`
      ).join('\n\n---\n\n');

      const clientContext = clients.length > 0
        ? clients.map(c => `CLIENT LOOKALIKE: ${c.name} | Brands: ${c.brandAffinity} | Similar audiences: ${c.similarAudiences}`).join('\n')
        : '';

      console.log(`Sending to Claude: ${articles.length} articles, ${episodes.length} episodes, ${clients.length} clients`);
      console.log(`Article context length: ${articleContext.length} chars`);
      console.log(`Existing prospects to dedupe: ${existingNames.length}`);
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `You are a talent intelligence analyst for Sloan Whiteside-Munteanu at Del Shaw Mackintosh & Kaiserman.

SLOAN'S ICP (use to score and filter — never reference explicitly in output):
${sloanProfile}

${clientContext ? `CURRENT CLIENTS — use for lookalike identification:\n${clientContext}\n\n` : ''}
FULL ARTICLE CONTENT:
${articleContext}

FULL PODCAST CONTENT:
${episodeContext}

---

Your job: Read the full content above deeply. Find people who are mentioned but NOT the main subject — supporting cast, collaborators, featured guests, co-writers, directors on smaller projects, musicians with side ventures, creators building in adjacent spaces.

RULES:
- Skip household names and A-list stars already widely represented
- Focus on emerging, overlooked, or underrepresented talent with clear upside
- Must show signals of being a multi-hyphenate or transitioning between lanes (music→film, creator→IP, athlete→media, etc.)
- Strong preference for Black, brown, queer, and women talent
- Each "whyFit" must be ONE sharp sentence grounded in what the content actually says about them — why Sloan specifically would want them, referencing their actual trajectory or work

SCORING:
- 9-10: Multi-hyphenate + underrepresented + digital ownership signals + clear upward move
- 7-8: Strong match on 2-3 ICP dimensions with real upside
- 6: Borderline — include only if something is genuinely interesting
- Below 6: Skip

Return 8-12 prospects as a JSON array. Each object:
{
  "name": "Full Name",
  "whyFit": "One sentence — specific, grounded in the content, written for Sloan",
  "source": "Article" or "Podcast" or "Client Lookalike",
  "sourceArticle": "title of the article or episode they appeared in",
  "platform": ["Instagram", "YouTube", etc],
  "followersReach": "estimate or blank",
  "upsideNotes": "what makes them interesting RIGHT NOW",
  "matchScore": 6-10,
  "link": "profile URL if mentioned in content, else null"
}

ONLY return the JSON array. No explanation, no markdown.`,
        }],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      console.log('Claude raw response (first 500):', text.slice(0, 500));
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return res.status(500).json({ error: 'AI response did not contain valid JSON', raw: text.slice(0, 500) });

      const prospects = JSON.parse(jsonMatch[0]);
      const newProspects = prospects.filter(p => p.name && !existingNames.includes(p.name.toLowerCase()));

      await Promise.allSettled(newProspects.map(p => saveProspect(p)));

      const allProspects = await fetchExistingProspects();
      return res.status(200).json({ prospects: allProspects, newCount: newProspects.length });

    } catch (err) {
      console.error('Talent radar error:', err);
      return res.status(500).json({ error: 'Talent radar error: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

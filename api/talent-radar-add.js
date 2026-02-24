// api/talent-radar-add.js - Vercel Serverless Function
// Manually add a prospect to the Talent Radar Notion database

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const TALENT_RADAR_DB_ID = process.env.NOTION_TALENT_RADAR_DB_ID || 'c84b0577-e4f8-44fc-bf33-d309276ed279';

  const { name, whyFit, platform, link, followersReach, upsideNotes, matchScore } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: TALENT_RADAR_DB_ID },
        properties: {
          Name: { title: [{ text: { content: name } }] },
          'Match Score': { number: matchScore || null },
          "Why They're a Fit": { rich_text: [{ text: { content: whyFit || '' } }] },
          Source: { select: { name: 'Manual' } },
          Link: link ? { url: link } : { url: null },
          Platform: { multi_select: (platform || []).map(p => ({ name: p })) },
          'Followers/Reach': { rich_text: [{ text: { content: followersReach || '' } }] },
          'Upside Notes': { rich_text: [{ text: { content: upsideNotes || '' } }] },
          Status: { select: { name: 'New' } },
          'Added By': { select: { name: 'Manual' } },
          'Date Added': { date: { start: today } },
        },
      }),
    });

    const data = await response.json();
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add prospect', details: err.message });
  }
}

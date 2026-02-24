// api/podcasts.js - Vercel Serverless Function
// Fetches ALL podcast episodes from the past 24 hours from Hollywood Podcast Transcripts
// Returns titles + summaries only

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = process.env.NOTION_PODCASTS_DB_ID || '300eef71c27780adb33ce0af8fd04623';

  if (!NOTION_TOKEN) {
    return res.status(500).json({ error: 'NOTION_TOKEN not configured' });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    let allEpisodes = [];
    let cursor = undefined;

    do {
      const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: 'Date',
            date: { on_or_after: since },
          },
          sorts: [{ property: 'Date', direction: 'descending' }],
          page_size: 100,
          ...(cursor ? { start_cursor: cursor } : {}),
        }),
      });

      const data = await response.json();

      const batch = (data.results || []).map(page => ({
        id: page.id,
        podcast: page.properties?.Podcast?.title?.[0]?.plain_text || 'Unknown Podcast',
        episode: page.properties?.Episode?.rich_text?.[0]?.plain_text || 'Unknown Episode',
        summary: page.properties?.Summary?.rich_text?.[0]?.plain_text || '',
        date: page.properties?.Date?.date?.start || page.created_time,
      }));

      allEpisodes = allEpisodes.concat(batch);
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    return res.status(200).json({
      episodes: allEpisodes,
      count: allEpisodes.length,
      window: '24h',
    });
  } catch (err) {
    console.error('Notion podcasts error:', err);
    return res.status(500).json({ error: 'Failed to fetch podcasts', details: err.message });
  }
}

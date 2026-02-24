// api/articles.js - Vercel Serverless Function
// Fetches ALL articles from the past 24 hours from Hollywood News Hub
// Returns titles + summaries only (keeps AI context lean for maximum breadth)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = process.env.NOTION_ARTICLES_DB_ID || '301eef71c27780148ba5f048398047ec';

  if (!NOTION_TOKEN) {
    return res.status(500).json({ error: 'NOTION_TOKEN not configured' });
  }

  // 24-hour window
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    let allArticles = [];
    let cursor = undefined;

    // Paginate through ALL results from the past 24 hours — no cap
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
        // Display fields
        title: page.properties?.Title?.rich_text?.[0]?.plain_text || 'Untitled',
        source: page.properties?.Source?.title?.[0]?.plain_text || 'Unknown',
        url: page.properties?.URL?.url || null,
        date: page.properties?.Date?.date?.start || page.created_time,
        // Summary only — full text never sent to AI, keeps context window lean
        summary: page.properties?.Summary?.rich_text?.[0]?.plain_text || '',
      }));

      allArticles = allArticles.concat(batch);
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    return res.status(200).json({
      articles: allArticles,
      count: allArticles.length,
      window: '24h',
    });
  } catch (err) {
    console.error('Notion articles error:', err);
    return res.status(500).json({ error: 'Failed to fetch articles', details: err.message });
  }
}

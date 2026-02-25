// api/articles.js
// Schema: Source=title, Title=rich_text, Summary=rich_text, Date=date, URL=url

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = process.env.NOTION_ARTICLES_DB_ID || '301eef71c27780148ba5f048398047ec';

  if (!NOTION_TOKEN) return res.status(500).json({ error: 'NOTION_TOKEN not configured' });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    let allArticles = [];
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
      if (data.object === 'error') {
        console.error('Notion error:', data);
        break;
      }

      const batch = (data.results || []).map(page => ({
        id: page.id,
        // Source is the title field in this DB
        source: page.properties?.Source?.title?.[0]?.plain_text || 'Unknown',
        // Title is rich_text
        title: page.properties?.Title?.rich_text?.[0]?.plain_text || 'Untitled',
        // Summary is rich_text
        summary: page.properties?.Summary?.rich_text?.[0]?.plain_text || '',
        // URL is a url field
        url: page.properties?.URL?.url || null,
        date: page.properties?.Date?.date?.start || page.created_time,
      }));

      allArticles = allArticles.concat(batch);
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    return res.status(200).json({ articles: allArticles, count: allArticles.length });
  } catch (err) {
    console.error('Articles error:', err);
    return res.status(500).json({ error: 'Failed to fetch articles', details: err.message });
  }
}

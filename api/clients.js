// api/clients.js - Vercel Serverless Function
// Fetches client profiles from Del Shaw Client Profiles Notion database

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = process.env.NOTION_CLIENTS_DB_ID || '396ab9c920fa4aa889d633a97e24e6bb';

  if (!NOTION_TOKEN) {
    return res.status(500).json({ error: 'NOTION_TOKEN not configured' });
  }

  try {
    // First, query the database for all active clients
    const dbResponse = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { property: 'Status', select: { equals: 'Active' } },
        sorts: [{ property: 'Name', direction: 'ascending' }],
      }),
    });

    const dbData = await dbResponse.json();

    // For each client, also fetch their page content (contains the similar audiences section)
    const clients = await Promise.all(
      (dbData.results || []).map(async (page) => {
        // Fetch the full page blocks to get the Similar Audiences content
        const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${page.id}/children`, {
          headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
          },
        });
        const blocksData = await blocksResponse.json();
        
        // Extract all text content from page blocks
        const pageContent = (blocksData.results || [])
          .map(block => {
            const richText = block[block.type]?.rich_text || [];
            return richText.map(rt => rt.plain_text).join('');
          })
          .filter(Boolean)
          .join('\n');

        return {
          id: page.id,
          name: page.properties?.Name?.title?.[0]?.plain_text || 'Unknown',
          handle: page.properties?.Handle?.rich_text?.[0]?.plain_text || '',
          platform: page.properties?.Platform?.multi_select?.map(p => p.name) || [],
          followers: page.properties?.Followers?.rich_text?.[0]?.plain_text || '',
          engagementRate: page.properties?.['Engagement Rate']?.rich_text?.[0]?.plain_text || '',
          location: page.properties?.Location?.rich_text?.[0]?.plain_text || '',
          interests: page.properties?.Interests?.rich_text?.[0]?.plain_text || '',
          brandAffinity: page.properties?.['Brand Affinity']?.rich_text?.[0]?.plain_text || '',
          audienceGender: page.properties?.['Audience Gender Split']?.rich_text?.[0]?.plain_text || '',
          topLocations: page.properties?.['Top Audience Locations']?.rich_text?.[0]?.plain_text || '',
          similarAudiences: page.properties?.['Similar Audiences']?.rich_text?.[0]?.plain_text || '',
          pageContent, // full page text for AI analysis
          reportUpdated: page.properties?.['Report Last Updated']?.date?.start || null,
        };
      })
    );

    return res.status(200).json({ clients });
  } catch (err) {
    console.error('Notion clients error:', err);
    return res.status(500).json({ error: 'Failed to fetch clients', details: err.message });
  }
}

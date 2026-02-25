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
      .join('\n')
      .slice(0, 2000);
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
    ...articles.slice(0, 30).map(a => `[ARTICLE] "${a.title}" (${a.source})${a.summary ? ` — ${a.summary.slice(0, 100)}` : ''}`),
    ...episodes.slice(0, 10).map(e => `[PODCAST] ${e.podcast}: "${e.episode}"${e.summary ? ` — ${e.summary.slice(0, 100)}` : ''}`),
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
    negotiation: `You are a senior entertainment deal attorney and agent strategist. Return EXACTLY 3 negotiation leverage points as a JSON array.

CLIENT DATA:
${clientContext}

TODAY'S MARKET CONTEXT:
${newsContext}

Instructions:
- Mine the client's actual metrics: follower count, engagement rate, audience demographics, brand affinities, top locations
- Each point must be grounded in a specific, quantifiable data advantage — not a vibe
- Write for an entertainment lawyer preparing for a negotiation table: rate comps, exclusivity carve-outs, backend participation, IP ownership clauses, approval rights, performance bonuses, audience guarantees
- Use market events from today's content as external comp points where relevant
- Every "insight" should be 2-3 sentences max — sharp and specific enough to quote in a meeting

Return ONLY: [{"title": "short lever name", "insight": "the tactical argument"}]
Exactly 3 objects. No markdown, no extra text.`,

    news: `You are a senior entertainment industry analyst. Select the 3 most strategically relevant stories for ${clientData.name || 'this client'} from today's content.

${clientContext ? `CLIENT: ${clientContext}\n` : ''}
TODAY'S CONTENT:
${newsContext}

For each story, write a "why" that:
- States the actual implication in 1-2 sentences — a deal mechanic, a market shift, a window opening or closing
- Assumes the reader knows the industry — no explaining what an agent does
- Never references the analyst or any specific person's preferences
- Sounds like an insider observation, not a summary

Return JSON array: [{"title": "exact title from content", "source": "...", "why": "...", "url": "..."}]
Use ONLY real titles from the content. Never fabricate.`,

    strategy: `You are a senior digital media monetization strategist. Return EXACTLY 3 monetization ideas as a JSON array.

CLIENT DATA:
${clientContext}

TODAY'S MARKET CONTEXT:
${newsContext}

Instructions:
- Each idea must be directly tied to the client's actual audience data: size, demographics, engagement rate, brand affinities, locations
- Think digital-first: newsletters, paid communities, licensing, creator funds, brand equity plays, IP development, platform deals
- Each idea should be specific enough to actually execute — name the platform, the model, the revenue mechanic
- Consider what comparable talent has done in today's market context
- "insight" field: 2-3 sentences explaining the exact opportunity, why this client's data supports it, and what the revenue model looks like

Return ONLY: [{"title": "short opportunity name", "insight": "the specific play and why their data supports it"}]
Exactly 3 objects. No markdown, no extra text.`,

    'sloan-desk': `You are a sharp entertainment industry intelligence analyst. Your job is to surface what matters and say why — concisely, like a trusted insider, not an explainer.

CONTEXT (use to filter relevance, never reference explicitly):
${sloanProfile}

TODAY'S CONTENT (past 24h):
${newsContext}

Generate entirely from the real content above — zero fabrication:

1. "headlines": 5 objects. Surface stories with real strategic weight. Each:
   - "title": exact title from above
   - "source": publication
   - "why": 1-2 sharp sentences on the actual implication — market shift, deal precedent, window opening, risk emerging. Never describe the story. Never mention Sloan by name. Write like a strategist talking to a peer who already knows the landscape.
   - "url": real URL or null

2. "linkedin": 3 posts in Sloan's voice:
   - Sharp, specific, inside-the-industry. A take, not a summary.
   - Sounds like someone who has closed real deals and sees around corners. Not a cheerleader, not a pundit.
   - Grounded in specific real stories from above.

3. "pitches": 3 objects — "hook" (sharp angle for a trade story) and "target" (specific publication/section) based on real trends above.

Return ONLY valid JSON.`,


    'social-linkedin': `You are drafting a LinkedIn post for Sloan Whiteside-Munteanu, a talent agent at Del Shaw Mackintosh & Kaiserman.

ARTICLE: "${req.body.article?.title}" (${req.body.article?.source})
CONTEXT: ${req.body.article?.why}

Write a single LinkedIn post (200-280 words) in Sloan's voice:
- Opens with a sharp, specific observation — not a question, not a generic hook
- Takes a real position on what this means for the industry
- Sounds like someone inside the deal-making world, not a commentator on it
- Specific about mechanics: deals, structures, windows, leverage — not vibes
- Ends with a single sentence that lands, not a call to action
- No hashtags. No emoji. No "I'm excited to share."
- Write it as plain text, ready to paste.`,

    'social-thread': `You are drafting a Twitter/X thread for Sloan Whiteside-Munteanu, a talent agent at Del Shaw Mackintosh & Kaiserman.

ARTICLE: "${req.body.article?.title}" (${req.body.article?.source})
CONTEXT: ${req.body.article?.why}

Write a 4-6 part thread in Sloan's voice:
- Tweet 1: The hook — a sharp, specific take that makes people stop scrolling. State the real implication, not the headline.
- Tweets 2-4: Unpack the deal mechanics, market shift, or structural reality. Each tweet is one tight idea.
- Tweet 5-6 (optional): The "so what" — what this means for talent, agents, or the next 12 months.
- Voice: insider, direct, culturally sharp. Confident without being loud.
- No hashtags. No filler. No "thread 🧵".
- Format each tweet on its own line starting with its number: "1/", "2/", etc.
- Each tweet max 280 chars.`,
    'talent-outreach': `You are writing a short outreach email for Sloan Whiteside-Munteanu, a talent attorney and agent at Del Shaw Mackintosh & Kaiserman — one of Hollywood's top entertainment law firms.

PROSPECT:
Name: ${req.body.prospect?.name}
Why they fit Sloan's roster: ${req.body.prospect?.whyFit}
What makes them interesting right now: ${req.body.prospect?.upsideNotes}
Platform/lane: ${(req.body.prospect?.platform || []).join(', ')}
Source: ${req.body.prospect?.sourceArticle}

Write a short, natural outreach email from Sloan to this person.

RULES:
- 4-6 sentences max. No fluff, no corporate speak.
- Sloan should come across as someone who genuinely noticed this person's work — not a cold sales pitch.
- Mention something specific about their trajectory or recent work (from the context above) to show this isn't a mass email.
- Briefly establish who Sloan is and what Del Shaw does — but keep it light, one sentence.
- Find the natural overlap: where can Sloan actually add value for this person right now?
- End with a low-pressure ask — a quick call, a coffee, "would love to connect."
- Tone: warm, sharp, peer-to-peer. Like a message from someone in the industry who genuinely gets their work.
- Do NOT use: "I came across your work", "I'd love to pick your brain", "Hope this finds you well", "I'm a big fan."
- Format: Subject line first, then the email body. No extra labels or headers.`,

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

    if (type === 'news' || type === 'sloan-desk' || type === 'negotiation' || type === 'strategy') {
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

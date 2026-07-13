export interface WebsiteEnrichment {
  title: string | null;
  description: string | null;
  excerpt: string | null;
}

function extractTag(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  if (!match?.[1]) return null;
  return decodeHtmlEntities(match[1].trim()).slice(0, 400);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Real, working enrichment: fetches the applicant's own website and extracts its title, meta
 * description, and a short text excerpt — no API key required. This is genuine public-data
 * enrichment, not a stub; it's just a narrower slice (their own site) than a full search-based
 * scrape. See enrichFromSearch() below for the documented swap point to real search grounding.
 */
export async function enrichFromWebsite(rawUrl: string): Promise<WebsiteEnrichment | null> {
  let url: string;
  try {
    url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    new URL(url); // throws if genuinely malformed
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'thedeltaprize-enrichment-bot/1.0 (+internal prototype)' },
      redirect: 'follow',
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) return null;

    const html = await res.text();
    const title = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = extractTag(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    ) ?? extractTag(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);

    const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
    const excerptSource = bodyMatch ? stripTags(bodyMatch[0]) : stripTags(html);
    const excerpt = excerptSource ? excerptSource.slice(0, 500) : null;

    if (!title && !description && !excerpt) return null;
    return { title, description, excerpt };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export interface SearchEnrichment {
  summary: string;
  sources: string[];
}

/**
 * SWAP POINT — search-based enrichment (news mentions, funding rounds, public reputation
 * signals) needs a grounded search provider: Google Search API, Gemini's built-in search
 * grounding, or SerpAPI. None are configured in this prototype (no key = no cost, no surprise
 * external calls). Wire one in here; the return shape is already what the scoring prompt expects.
 */
export async function enrichFromSearch(orgName: string): Promise<SearchEnrichment | null> {
  const apiKey = process.env.SEARCH_API_KEY;
  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.warn(`[enrichment] SEARCH_API_KEY not set — skipping search-based enrichment for "${orgName}".`);
    return null;
  }
  // Real integration sketch:
  //   const res = await fetch(`https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(orgName)}&key=${apiKey}&cx=${process.env.SEARCH_ENGINE_ID}`);
  //   ...summarise res.items into { summary, sources }
  return null;
}

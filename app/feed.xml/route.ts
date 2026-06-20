import { models } from "@/lib/data/models";

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case "\"":
        return "&quot;";
      default:
        return c;
    }
  });
}

function toRfc822Date(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return new Date().toUTCString();
  }
  return date.toUTCString();
}

export async function GET() {
  const baseUrl = "https://evolution.kevinbytes.com";

  // Sort models by releaseDate descending, get top 20
  const recentModels = [...models]
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
    .slice(0, 20);

  const pubDate =
    recentModels.length > 0
      ? toRfc822Date(recentModels[0].releaseDate)
      : new Date().toUTCString();

  const xmlItems = recentModels
    .map((model) => {
      const modelUrl = `${baseUrl}/models/${model.id}`;
      const description = model.description
        ? `${model.significance ? `${model.significance} ` : ""}${model.description}`
        : "No description available.";

      return `    <item>
      <title>${escapeXml(model.name)}</title>
      <link>${escapeXml(modelUrl)}</link>
      <description>${escapeXml(description)}</description>
      <pubDate>${toRfc822Date(model.releaseDate)}</pubDate>
      <guid>${escapeXml(modelUrl)}</guid>
      <category>${escapeXml(model.family)}</category>
    </item>`;
    })
    .join("\n");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LLM Tree of Life - Newly Released AI Models</title>
    <link>${baseUrl}</link>
    <description>The latest additions to the LLM Tree of Life database, mapping the evolutionary tree of large language models.</description>
    <language>en-us</language>
    <pubDate>${pubDate}</pubDate>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${xmlItems}
  </channel>
</rss>`;

  return new Response(rssFeed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

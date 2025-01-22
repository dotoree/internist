import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

// Simulated database
const database: { [domain: string]: string[] } = {
  "example.com": ["https://example.com/page1", "https://example.com/page2"],
  "nextjs.org": ["https://nextjs.org/docs", "https://nextjs.org/blog"],
  "simplewebsolutions.gr": [
    "https://www.simplewebsolutions.gr/dhmiourgia-istoselidwn",
    "https://www.simplewebsolutions.gr/kataskevi-eshop",
    "https://www.simplewebsolutions.gr/anaptyksi-web-efarmogon",
  ],
};

export async function GET(
  _: Request,
  context: { params: Promise<{ domain: string }> }
) {
  const { domain } = await context.params; // Await the params object

  if (!domain) {
    return NextResponse.json(
      { error: "Missing domain parameter" },
      { status: 400 }
    );
  }

  // Fetch URLs associated with the domain from the database
  const urls = database[domain];
  if (!urls || urls.length === 0) {
    return NextResponse.json(
      { error: `No URLs found for domain: ${domain}` },
      { status: 404 }
    );
  }

  try {
    // Fetch metadata for each URL
    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await axios.get(url);
          const html = response.data;

          // Load HTML into Cheerio to extract metadata
          const $ = cheerio.load(html);
          const title =
            $("head > title").text() || $('meta[name="title"]').attr("content");
          const description = $('meta[name="description"]').attr("content");

          return { url, title, description };
        } catch (error) {
          console.error(`Error fetching URL ${url}:`, error);
          return { url, error: "Failed to fetch metadata" };
        }
      })
    );

    // Return metadata for all URLs
    return NextResponse.json({ domain, results });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}

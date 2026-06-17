#!/usr/bin/env node

/**
 * Puppeteer-based Web Fetcher for JavaScript-rendered Content
 * Fetches fully rendered page content including images and links
 *
 * Usage: node fetch-rendered.js <url> [output-dir]
 * Output: Creates <output-dir>/fetched.md with markdown content
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { URL: URLParser } = require('url');

const TARGET_URL = process.argv[2];
const OUTPUT_DIR = process.argv[3] || process.cwd();

if (!TARGET_URL) {
  console.error('Usage: node fetch-rendered.js <url> [output-dir]');
  process.exit(1);
}

async function fetchRenderedContent(url) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract content
    const content = await page.evaluate(() => {
      const selectors = ['main', '[role="main"]', '.content', 'article', 'body'];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          return {
            title: document.title,
            meta: {
              description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
              ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
              ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
            },
            textContent: el.innerText,
            links: Array.from(document.querySelectorAll('a[href]'))
              .map(a => ({
                text: a.textContent.trim(),
                href: a.getAttribute('href'),
                isExternal: a.hostname !== window.location.hostname
              }))
              .filter(link => link.text && link.text.length > 0)
              .slice(0, 100),
            images: Array.from(document.querySelectorAll('img[src]'))
              .map(img => ({
                src: img.getAttribute('src'),
                alt: img.getAttribute('alt') || ''
              }))
              .filter(img => img.src && !img.src.includes('data:'))
              .slice(0, 50)
          };
        }
      }

      return { error: 'No content found' };
    });

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const outputPath = path.join(OUTPUT_DIR, 'fetched.md');

    // Build markdown with extracted links and images
    const linksSection = content.links?.length > 0
      ? `\n## Links\n\n${content.links.map(l => `- [${l.text}](${l.href})${l.isExternal ? ' [external]' : ''}`).join('\n')}\n`
      : '';

    const imagesSection = content.images?.length > 0
      ? `\n## Images\n\n${content.images.map(i => i.alt ? `- ![${i.alt}](${i.src})` : `- ![](${i.src})`).join('\n')}\n`
      : '';

    const markdown = `# ${content.title}

**Source**: ${url}
**Fetched**: ${new Date().toISOString()}

${content.meta?.description ? `> ${content.meta.description}\n` : ''}

---

${content.textContent || 'No text content found'}

---

${linksSection}
${imagesSection}
`;

    fs.writeFileSync(outputPath, markdown);

    // Output to stdout for programmatic use
    console.log(JSON.stringify({
      success: true,
      textLength: content.textContent?.length || 0,
      linksCount: content.links?.length || 0,
      imagesCount: content.images?.length || 0,
      outputFile: outputPath
    }));

    return content;

  } finally {
    await browser.close();
  }
}

fetchRenderedContent(TARGET_URL).catch(err => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});

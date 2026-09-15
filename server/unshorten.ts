import type { HopInfo, PageMeta, QueryParam, SecurityAssessment, UnshortenResult } from '../src/types';
import { lookup } from 'dns/promises';
import { isIP } from 'net';

const KNOWN_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'adf.ly',
  'bit.do',
  'mcaf.ee',
  'rebrand.ly',
  'shorturl.at',
  'cutt.ly',
  'v.gd',
  'bl.ink',
  'shorte.st',
  'rb.gy',
  's.id',
  't.ly',
  'lnkd.in',
  'youtu.be',
  'fb.me',
  'wp.me',
  'qr.net',
  'linktr.ee',
  'snip.ly',
]);

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'fbclid',
  'msclkid',
  'twclid',
  'igshid',
  'mc_eid',
  'mc_cid',
  'yclid',
  '_hsenc',
  '_hsmi',
  'mkt_tok',
  'ref',
  'aff',
  'affiliate_id',
  'subid',
  'src',
  'campaign',
  'source',
]);

const SUSPICIOUS_TLDS = new Set([
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'top',
  'buzz',
  'work',
  'click',
  'country',
  'stream',
  'download',
  'racing',
  'win',
]);

function isPrivateIp(hostname: string): boolean {
  const normalizedHostname = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (normalizedHostname === 'localhost' || normalizedHostname === '127.0.0.1' || normalizedHostname === '::1') {
    return true;
  }
  if (normalizedHostname.startsWith('::ffff:')) {
    return isPrivateIp(normalizedHostname.slice('::ffff:'.length));
  }
  if (normalizedHostname === '::' || normalizedHostname.startsWith('fc') || normalizedHostname.startsWith('fd') || normalizedHostname.startsWith('fe8') || normalizedHostname.startsWith('fe9') || normalizedHostname.startsWith('fea') || normalizedHostname.startsWith('feb')) {
    return true;
  }
  const ipParts = normalizedHostname.split('.').map(Number);
  if (ipParts.length === 4 && ipParts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    // Private, loopback, link-local, carrier-grade NAT, and documentation ranges.
    if (ipParts[0] === 0 || ipParts[0] === 10 || ipParts[0] === 127) return true;
    // 172.16.0.0 - 172.31.255.255
    if (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) return true;
    // 192.168.0.0 - 192.168.255.255
    if (ipParts[0] === 192 && ipParts[1] === 168) return true;
    // 169.254.0.0 - 169.254.255.255 (link-local)
    if (ipParts[0] === 169 && ipParts[1] === 254) return true;
    if (ipParts[0] === 100 && ipParts[1] >= 64 && ipParts[1] <= 127) return true;
    if (ipParts[0] === 192 && ipParts[1] === 0) return true;
    if (ipParts[0] === 198 && ipParts[1] >= 18 && ipParts[1] <= 19) return true;
    if (ipParts[0] >= 224) return true;
  }
  return false;
}

async function assertPublicDestination(hostname: string): Promise<void> {
  if (isPrivateIp(hostname)) {
    throw new Error('Private or internal network destinations are not permitted');
  }

  if (isIP(hostname.replace(/^\[|\]$/g, ''))) {
    return;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error('Private or internal network destinations are not permitted');
  }
}

export function normalizeInputUrl(input: string): string {
  let cleaned = input.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned;
}

function parseMetaRefresh(html: string): string | null {
  const match = html.match(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*content=["']?[0-9]*;\s*url=([^"'>\s]+)["']?/i);
  return match && match[1] ? match[1] : null;
}

function extractHtmlMeta(html: string, baseUrl: string): PageMeta {
  const meta: PageMeta = {};

  // Title: check og:title first, then <title>
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  meta.title = (ogTitleMatch?.[1] || titleMatch?.[1] || '').trim();

  // Description: og:description or meta description
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  meta.description = (ogDescMatch?.[1] || descMatch?.[1] || '').trim();

  // og:image
  const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);
  if (ogImgMatch?.[1]) {
    try {
      meta.ogImage = new URL(ogImgMatch[1], baseUrl).href;
    } catch {
      meta.ogImage = ogImgMatch[1];
    }
  }

  // Canonical URL
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  if (canonicalMatch?.[1]) {
    try {
      meta.canonicalUrl = new URL(canonicalMatch[1], baseUrl).href;
    } catch {
      meta.canonicalUrl = canonicalMatch[1];
    }
  }

  // Favicon
  const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i);
  if (iconMatch?.[1]) {
    try {
      meta.favicon = new URL(iconMatch[1], baseUrl).href;
    } catch {
      meta.favicon = iconMatch[1];
    }
  } else {
    try {
      const u = new URL(baseUrl);
      meta.favicon = `${u.protocol}//${u.host}/favicon.ico`;
    } catch {
      // ignore
    }
  }

  return meta;
}

export async function traceRedirects(rawUrl: string): Promise<UnshortenResult> {
  const normalizedUrl = normalizeInputUrl(rawUrl);
  const startTime = Date.now();

  let currentUrlObj: URL;
  try {
    currentUrlObj = new URL(normalizedUrl);
  } catch {
    throw new Error('Invalid URL format provided');
  }
  if (!['http:', 'https:'].includes(currentUrlObj.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported');
  }

  await assertPublicDestination(currentUrlObj.hostname);

  const hops: HopInfo[] = [];
  const visited = new Set<string>();
  let currentUrl = normalizedUrl;
  const maxHops = 15;
  let finalHtml = '';
  let finalContentType = '';
  let finalStatusCode = 200;

  for (let step = 1; step <= maxHops; step++) {
    if (visited.has(currentUrl)) {
      hops.push({
        step,
        url: currentUrl,
        domain: new URL(currentUrl).hostname,
        statusCode: 310,
        statusText: 'Redirect Loop Detected',
        redirectType: 'Loop Error',
        responseTimeMs: 0,
      });
      break;
    }
    visited.add(currentUrl);

    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
    } catch {
      break;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Redirect chain contains an unsupported URL protocol');
    }

    await assertPublicDestination(parsed.hostname);

    const hopStart = Date.now();
    let response: Response;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
        },
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      hops.push({
        step,
        url: currentUrl,
        domain: parsed.hostname,
        statusCode: 0,
        statusText: err.name === 'AbortError' ? 'Timeout (9s exceeded)' : (err.message || 'Connection Failed'),
        redirectType: 'Failed Request',
        responseTimeMs: Date.now() - hopStart,
      });
      finalStatusCode = 0;
      break;
    } finally {
      clearTimeout(timeoutId);
    }

    const hopDuration = Date.now() - hopStart;
    const status = response.status;
    finalStatusCode = status;
    const serverHeader = response.headers.get('server') || undefined;
    const contentType = response.headers.get('content-type') || undefined;
    if (contentType) finalContentType = contentType;

    const locationHeader = response.headers.get('location');

    // Check for HTTP redirect status codes
    const isHttpRedirect = [301, 302, 303, 307, 308].includes(status) && Boolean(locationHeader);

    let redirectType = 'Direct Destination';
    if (status === 301) redirectType = 'HTTP 301 Permanent Redirect';
    else if (status === 302) redirectType = 'HTTP 302 Temporary Redirect';
    else if (status === 303) redirectType = 'HTTP 303 See Other';
    else if (status === 307) redirectType = 'HTTP 307 Temporary Redirect';
    else if (status === 308) redirectType = 'HTTP 308 Permanent Redirect';

    if (isHttpRedirect && locationHeader) {
      let resolvedNextUrl = locationHeader;
      try {
        resolvedNextUrl = new URL(locationHeader, currentUrl).href;
      } catch {
        // use raw if fails to resolve
      }

      hops.push({
        step,
        url: currentUrl,
        domain: parsed.hostname,
        statusCode: status,
        statusText: response.statusText || 'Redirect',
        redirectType,
        targetUrl: resolvedNextUrl,
        responseTimeMs: hopDuration,
        server: serverHeader,
        contentType,
      });

      currentUrl = resolvedNextUrl;
      continue;
    }

    // If status 200 and it's HTML, read a chunk to check for <meta refresh>
    if (status >= 200 && status < 300 && (!contentType || contentType.includes('text/html') || contentType.includes('application/xhtml'))) {
      try {
        // Read text safely (limit size to first 80KB)
        const rawText = await response.text();
        finalHtml = rawText.slice(0, 100000);

        const metaRefreshUrl = parseMetaRefresh(finalHtml);
        if (metaRefreshUrl) {
          let resolvedMetaUrl = metaRefreshUrl;
          try {
            resolvedMetaUrl = new URL(metaRefreshUrl, currentUrl).href;
          } catch {
            // ignore
          }

          if (resolvedMetaUrl !== currentUrl) {
            hops.push({
              step,
              url: currentUrl,
              domain: parsed.hostname,
              statusCode: status,
              statusText: 'Meta Refresh Redirect',
              redirectType: 'HTML Meta Refresh',
              targetUrl: resolvedMetaUrl,
              responseTimeMs: hopDuration,
              server: serverHeader,
              contentType,
            });

            currentUrl = resolvedMetaUrl;
            continue;
          }
        }
      } catch {
        // Ignore read error
      }
    }

    // Final reached
    hops.push({
      step,
      url: currentUrl,
      domain: parsed.hostname,
      statusCode: status,
      statusText: response.statusText || 'OK',
      redirectType: 'Final Destination',
      responseTimeMs: hopDuration,
      server: serverHeader,
      contentType,
    });
    break;
  }

  const finalUrl = currentUrl;
  const totalTimeMs = Date.now() - startTime;
  const totalRedirects = Math.max(0, hops.length - 1);

  // Extract Page Meta
  const pageMeta = finalHtml ? extractHtmlMeta(finalHtml, finalUrl) : {};
  if (finalContentType) {
    pageMeta.contentType = finalContentType;
  }

  // Parse Query Parameters & Build Clean URL
  let parsedFinal: URL;
  try {
    parsedFinal = new URL(finalUrl);
  } catch {
    throw new Error('Redirect chain ended with an invalid destination URL');
  }

  const queryParams: QueryParam[] = [];
  const cleanUrlObj = new URL(finalUrl);
  let hasTrackingParams = false;

  for (const [key, value] of parsedFinal.searchParams.entries()) {
    const isTracking = TRACKING_PARAMS.has(key.toLowerCase());
    if (isTracking) {
      hasTrackingParams = true;
      cleanUrlObj.searchParams.delete(key);
    }
    queryParams.push({
      key,
      value,
      isTracking,
      category: isTracking
        ? key.toLowerCase().includes('aff') || key.toLowerCase() === 'ref'
          ? 'affiliate'
          : 'analytics'
        : 'general',
    });
  }

  const cleanUrl = cleanUrlObj.href;

  // Security Assessment
  const flags: string[] = [];
  const isHttps = parsedFinal.protocol === 'https:';
  if (!isHttps) {
    flags.push('Insecure Protocol: Destination uses unencrypted HTTP instead of HTTPS.');
  }

  const hostLower = parsedFinal.hostname.toLowerCase();
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostLower);
  if (isIp) {
    flags.push('Suspicious Host: Destination URL uses a direct IP address rather than a domain name.');
  }

  const tld = hostLower.split('.').pop() || '';
  const suspiciousTld = SUSPICIOUS_TLDS.has(tld);
  if (suspiciousTld) {
    flags.push(`Uncommon or high-risk top-level domain (.${tld}) detected.`);
  }

  const excessiveHops = totalRedirects >= 5;
  if (excessiveHops) {
    flags.push(`Excessive redirect chain: ${totalRedirects} hops followed.`);
  }

  // Check if original was a recognized shortener
  let originalHost = '';
  try {
    originalHost = new URL(normalizedUrl).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    // ignore
  }

  const shortenerDetected = KNOWN_SHORTENERS.has(originalHost);
  const shortenerName = shortenerDetected ? originalHost : undefined;

  let riskLevel: 'safe' | 'caution' | 'warning' = 'safe';
  if (isIp || suspiciousTld || (!isHttps && excessiveHops)) {
    riskLevel = 'warning';
  } else if (!isHttps || excessiveHops || flags.length > 0) {
    riskLevel = 'caution';
  }

  const originalLength = normalizedUrl.length;
  const expandedLength = finalUrl.length;
  const lengthDelta = expandedLength - originalLength;

  return {
    id: `unshorten_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    originalUrl: normalizedUrl,
    expandedUrl: finalUrl,
    cleanUrl,
    hops,
    totalRedirects,
    totalTimeMs,
    finalStatusCode,
    originalLength,
    expandedLength,
    lengthDelta,
    queryParams,
    hasTrackingParams,
    meta: pageMeta,
    security: {
      isHttps,
      shortenerDetected,
      shortenerName,
      isIpAddress: isIp,
      suspiciousTld,
      excessiveHops,
      riskLevel,
      flags,
    },
    timestamp: Date.now(),
  };
}

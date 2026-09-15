import { GoogleGenAI } from '@google/genai';
import type { AiAnalysisResult, UnshortenResult } from '../src/types';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function analyzeLinkSafety(data: UnshortenResult): Promise<AiAnalysisResult> {
  const ai = getAiClient();

  if (!ai) {
    // Graceful fallback when no key is set
    return {
      summary: `Destination domain is ${new URL(data.expandedUrl).hostname}. The shortened link expanded through ${data.totalRedirects} hop(s) with an HTTP ${data.finalStatusCode} response status.`,
      safetyRating: data.security.riskLevel,
      category: data.hasTrackingParams ? 'Marketing / Campaign Link' : 'Direct Web Resource',
      findings: [
        data.security.isHttps ? 'HTTPS protocol encryption is active.' : 'Insecure HTTP protocol in use.',
        data.hasTrackingParams ? `Detected ${data.queryParams.filter(q => q.isTracking).length} tracking/analytics parameters.` : 'No aggressive tracking tokens identified.',
        `Chain completed across ${data.hops.length} hop(s) in ${data.totalTimeMs}ms.`,
      ],
      recommendation: data.security.riskLevel === 'warning'
        ? 'Exercise caution: do not enter credentials or personal data without verifying ownership.'
        : 'Link resolved normally. Verify the preview domain before entering sensitive details.',
    };
  }

  const prompt = `Analyze this expanded shortened link for safety, category, and potential phishing or misleading behavior:
Original Short URL: ${data.originalUrl}
Final Expanded URL: ${data.expandedUrl}
Total Redirect Hops: ${data.totalRedirects}
Redirect Chain:
${data.hops.map((h, i) => `Hop ${i + 1}: ${h.url} -> Status ${h.statusCode} (${h.redirectType})`).join('\n')}
Page Title: ${data.meta.title || 'N/A'}
Page Description: ${data.meta.description || 'N/A'}
Is HTTPS: ${data.security.isHttps}
Query Parameters: ${JSON.stringify(data.queryParams.map(q => q.key))}

Return a valid JSON object matching this schema strictly without markdown fencing:
{
  "summary": "Brief 1-2 sentence overview of what this destination is and whether the short link was used legitimately or suspiciously",
  "safetyRating": "safe" | "caution" | "warning",
  "category": "E-Commerce" | "Social Media" | "News & Media" | "Marketing/Tracking" | "Corporate/SaaS" | "Phishing/Suspicious" | "Content/Media" | "Other",
  "findings": ["Point 1", "Point 2", "Point 3"],
  "recommendation": "One clear instruction for the user before visiting"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    return {
      summary: parsed.summary || 'Destination evaluated.',
      safetyRating: parsed.safetyRating || data.security.riskLevel,
      category: parsed.category || 'Web Destination',
      findings: Array.isArray(parsed.findings) ? parsed.findings : ['Evaluated redirect chain and destination headers.'],
      recommendation: parsed.recommendation || 'Verify destination before interacting.',
    };
  } catch (err: any) {
    console.error('Gemini link analysis failed:', err);
    return {
      summary: `Destination host is ${new URL(data.expandedUrl).hostname} resolving with status ${data.finalStatusCode}.`,
      safetyRating: data.security.riskLevel,
      category: 'Web Resource',
      findings: [
        `Resolved through ${data.totalRedirects} redirect hop(s).`,
        data.security.isHttps ? 'Valid HTTPS protocol.' : 'Insecure HTTP protocol.',
      ],
      recommendation: 'Verify the preview details before opening in your browser.',
    };
  }
}

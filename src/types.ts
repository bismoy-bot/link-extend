export interface HopInfo {
  step: number;
  url: string;
  domain: string;
  statusCode: number;
  statusText: string;
  redirectType: string;
  targetUrl?: string;
  responseTimeMs: number;
  server?: string;
  contentType?: string;
}

export interface QueryParam {
  key: string;
  value: string;
  isTracking: boolean;
  category?: 'analytics' | 'affiliate' | 'campaign' | 'general';
}

export interface SecurityAssessment {
  isHttps: boolean;
  shortenerDetected: boolean;
  shortenerName?: string;
  isIpAddress: boolean;
  suspiciousTld: boolean;
  excessiveHops: boolean;
  riskLevel: 'safe' | 'caution' | 'warning';
  flags: string[];
}

export interface PageMeta {
  title?: string;
  description?: string;
  ogImage?: string;
  canonicalUrl?: string;
  favicon?: string;
  contentType?: string;
}

export interface UnshortenResult {
  id: string;
  originalUrl: string;
  expandedUrl: string;
  cleanUrl: string;
  hops: HopInfo[];
  totalRedirects: number;
  totalTimeMs: number;
  finalStatusCode: number;
  originalLength: number;
  expandedLength: number;
  lengthDelta: number;
  queryParams: QueryParam[];
  hasTrackingParams: boolean;
  meta: PageMeta;
  security: SecurityAssessment;
  timestamp: number;
  error?: string;
}

export interface AiAnalysisResult {
  summary: string;
  safetyRating: 'safe' | 'caution' | 'warning';
  category: string;
  findings: string[];
  recommendation: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ShortLink {
  id: string;
  userId: string;
  originalUrl: string;
  alias: string;
  shortUrl: string;
  title: string;
  createdAt: number;
  totalClicks: number;
  lastClickedAt?: number;
}

export interface ClickEvent {
  id: string;
  linkId: string;
  alias: string;
  timestamp: number;
  country: string;
  countryCode: string;
  city: string;
  device: 'mobile' | 'desktop' | 'tablet' | 'other';
  browser: string;
  referrer: string;
}

export interface LinkAnalytics {
  link: ShortLink;
  totalClicks: number;
  clicksByDate: { date: string; count: number }[];
  geo: { country: string; countryCode: string; city: string; count: number }[];
  devices: { [device: string]: number };
  browsers: { [browser: string]: number };
  referrers: { [referrer: string]: number };
  recentClicks: ClickEvent[];
}


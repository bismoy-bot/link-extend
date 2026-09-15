import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { User, ShortLink, ClickEvent, LinkAnalytics } from '../src/types';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  createdAt: number;
}

interface StoredSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

interface DatabaseSchema {
  users: StoredUser[];
  sessions: StoredSession[];
  links: ShortLink[];
  clicks: ClickEvent[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const RESERVED_ALIASES = new Set([
  'api',
  's',
  'r',
  'auth',
  'login',
  'signup',
  'register',
  'dashboard',
  'admin',
  'health',
  'static',
  'assets',
  'favicon',
  'index',
  'help',
  'about',
  'terms',
  'privacy',
  'unshorten',
  'enlarge',
  'batch',
  'null',
  'undefined',
]);

const PROFANITY_FILTER = new Set([
  'spam',
  'scam',
  'phish',
  'malware',
  'virus',
  'hack',
  'exploit',
]);

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

class Store {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: [],
      sessions: [],
      links: [],
      clicks: [],
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialData();
        this.persist();
      }
    } catch (err) {
      console.error('Error initializing db file:', err);
      this.seedInitialData();
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  private seedInitialData() {
    const demoSalt = crypto.randomBytes(16).toString('hex');
    const demoUser: StoredUser = {
      id: 'usr_demo_8942',
      email: 'demo@example.com',
      passwordHash: hashPassword('password123', demoSalt),
      salt: demoSalt,
      name: 'Alex Demo',
      createdAt: Date.now() - 7 * 86400000,
    };

    const link1: ShortLink = {
      id: 'lnk_summer_deals',
      userId: demoUser.id,
      originalUrl: 'https://example.com/promotions/summer-sale-2026?utm_source=promo&discount=50',
      alias: 'summer-deals',
      shortUrl: '/s/summer-deals',
      title: 'Summer 50% Off Flash Sale',
      createdAt: Date.now() - 5 * 86400000,
      totalClicks: 34,
      lastClickedAt: Date.now() - 1200000,
    };

    const link2: ShortLink = {
      id: 'lnk_product_v2',
      userId: demoUser.id,
      originalUrl: 'https://example.com/announcements/product-v2-launch-notes',
      alias: 'product-v2',
      shortUrl: '/s/product-v2',
      title: 'Product Launch v2 Announcement',
      createdAt: Date.now() - 3 * 86400000,
      totalClicks: 19,
      lastClickedAt: Date.now() - 3600000,
    };

    const link3: ShortLink = {
      id: 'lnk_tech_roadmap',
      userId: demoUser.id,
      originalUrl: 'https://example.com/docs/engineering/2026-q3-roadmap',
      alias: 'roadmap-q3',
      shortUrl: '/s/roadmap-q3',
      title: 'Engineering Q3 Tech Roadmap',
      createdAt: Date.now() - 1 * 86400000,
      totalClicks: 8,
      lastClickedAt: Date.now() - 7200000,
    };

    const cities = [
      { country: 'United States', countryCode: 'US', city: 'San Francisco' },
      { country: 'United States', countryCode: 'US', city: 'New York' },
      { country: 'United Kingdom', countryCode: 'GB', city: 'London' },
      { country: 'Germany', countryCode: 'DE', city: 'Berlin' },
      { country: 'Japan', countryCode: 'JP', city: 'Tokyo' },
      { country: 'Canada', countryCode: 'CA', city: 'Toronto' },
      { country: 'Australia', countryCode: 'AU', city: 'Sydney' },
      { country: 'Singapore', countryCode: 'SG', city: 'Singapore' },
    ];

    const referrers = [
      'https://twitter.com/',
      'https://linkedin.com/',
      'https://google.com/',
      'https://github.com/',
      'Direct / Email',
    ];

    const devices: ('mobile' | 'desktop' | 'tablet')[] = [
      'desktop',
      'desktop',
      'mobile',
      'mobile',
      'desktop',
      'tablet',
    ];

    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];

    const clicks: ClickEvent[] = [];

    // Generate seeded clicks for link1
    for (let i = 0; i < 34; i++) {
      const geo = cities[i % cities.length];
      const timeOffset = Math.floor(Math.random() * (5 * 86400000));
      clicks.push({
        id: `clk_s1_${i}`,
        linkId: link1.id,
        alias: link1.alias,
        timestamp: Date.now() - timeOffset,
        country: geo.country,
        countryCode: geo.countryCode,
        city: geo.city,
        device: devices[i % devices.length],
        browser: browsers[i % browsers.length],
        referrer: referrers[i % referrers.length],
      });
    }

    // Generate seeded clicks for link2
    for (let i = 0; i < 19; i++) {
      const geo = cities[(i + 2) % cities.length];
      const timeOffset = Math.floor(Math.random() * (3 * 86400000));
      clicks.push({
        id: `clk_s2_${i}`,
        linkId: link2.id,
        alias: link2.alias,
        timestamp: Date.now() - timeOffset,
        country: geo.country,
        countryCode: geo.countryCode,
        city: geo.city,
        device: devices[i % devices.length],
        browser: browsers[i % browsers.length],
        referrer: referrers[i % referrers.length],
      });
    }

    this.data.users = [demoUser];
    this.data.links = [link1, link2, link3];
    this.data.clicks = clicks;
  }

  // --- Auth Methods ---
  findUserByEmail(email: string): StoredUser | undefined {
    return this.data.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
  }

  findUserById(id: string): StoredUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(email: string, password: string, name: string): User {
    const existing = this.findUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password, salt),
      salt,
      name: name.trim() || 'User',
      createdAt: Date.now(),
    };

    this.data.users.push(newUser);
    this.persist();

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.createdAt,
    };
  }

  verifyPassword(user: StoredUser, password: string): boolean {
    const computed = hashPassword(password, user.salt);
    return computed === user.passwordHash;
  }

  createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const session: StoredSession = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 86400000, // 30 days
    };
    this.data.sessions.push(session);
    this.persist();
    return token;
  }

  getUserFromSession(token: string): User | null {
    if (!token) return null;
    const session = this.data.sessions.find(
      (s) => s.token === token && s.expiresAt > Date.now()
    );
    if (!session) return null;
    const user = this.findUserById(session.userId);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }

  deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.persist();
  }

  // --- Custom Alias Validation ---
  validateAlias(rawAlias: string): { valid: boolean; error?: string; normalized: string } {
    const alias = rawAlias.trim().toLowerCase();

    if (!alias) {
      return { valid: false, error: 'Custom alias cannot be empty.', normalized: '' };
    }

    if (alias.length < 3) {
      return { valid: false, error: 'Custom alias must be at least 3 characters long.', normalized: alias };
    }

    if (alias.length > 30) {
      return { valid: false, error: 'Custom alias cannot exceed 30 characters.', normalized: alias };
    }

    const validChars = /^[a-zA-Z0-9_-]+$/;
    if (!validChars.test(alias)) {
      return {
        valid: false,
        error: 'Custom alias can only contain letters, numbers, hyphens (-), and underscores (_).',
        normalized: alias,
      };
    }

    if (RESERVED_ALIASES.has(alias)) {
      return {
        valid: false,
        error: `"${alias}" is a reserved system keyword and cannot be used.`,
        normalized: alias,
      };
    }

    for (const banned of PROFANITY_FILTER) {
      if (alias.includes(banned)) {
        return {
          valid: false,
          error: 'This alias contains prohibited or inappropriate terminology.',
          normalized: alias,
        };
      }
    }

    const exists = this.data.links.some(
      (l) => l.alias.toLowerCase() === alias
    );
    if (exists) {
      return {
        valid: false,
        error: `The alias "${alias}" is already taken. Please choose another.`,
        normalized: alias,
      };
    }

    return { valid: true, normalized: alias };
  }

  isAliasAvailable(alias: string): boolean {
    const check = this.validateAlias(alias);
    return check.valid;
  }

  generateRandomAlias(): string {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let attempts = 0; attempts < 50; attempts++) {
      result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (this.isAliasAvailable(result)) {
        return result;
      }
    }
    return `link_${Date.now().toString(36)}`;
  }

  // --- Links Management ---
  createShortLink(
    userId: string,
    originalUrl: string,
    customAlias?: string,
    title?: string
  ): ShortLink {
    let finalAlias = '';
    if (customAlias && customAlias.trim()) {
      const validation = this.validateAlias(customAlias);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      finalAlias = validation.normalized;
    } else {
      finalAlias = this.generateRandomAlias();
    }

    // Clean destination URL
    let cleanedUrl = originalUrl.trim();
    if (!cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://')) {
      cleanedUrl = 'https://' + cleanedUrl;
    }

    try {
      new URL(cleanedUrl);
    } catch {
      throw new Error('Invalid destination URL format.');
    }

    const newLink: ShortLink = {
      id: `lnk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      originalUrl: cleanedUrl,
      alias: finalAlias,
      shortUrl: `/s/${finalAlias}`,
      title: (title || '').trim() || finalAlias,
      createdAt: Date.now(),
      totalClicks: 0,
    };

    this.data.links.unshift(newLink);
    this.persist();

    return newLink;
  }

  getUserLinks(userId: string): ShortLink[] {
    return this.data.links.filter((l) => l.userId === userId);
  }

  getLinkByAlias(alias: string): ShortLink | undefined {
    return this.data.links.find(
      (l) => l.alias.toLowerCase() === alias.trim().toLowerCase()
    );
  }

  getLinkById(id: string): ShortLink | undefined {
    return this.data.links.find((l) => l.id === id);
  }

  deleteLink(id: string, userId: string): boolean {
    const index = this.data.links.findIndex(
      (l) => l.id === id && l.userId === userId
    );
    if (index === -1) return false;

    const link = this.data.links[index];
    this.data.links.splice(index, 1);
    // Also remove clicks for this link
    this.data.clicks = this.data.clicks.filter((c) => c.linkId !== link.id);
    this.persist();
    return true;
  }

  // --- Click Analytics Tracking ---
  recordClick(
    linkId: string,
    alias: string,
    ip: string,
    userAgent: string,
    referrer: string,
    geoHeader?: { country?: string; countryCode?: string; city?: string }
  ): ClickEvent {
    const link = this.getLinkById(linkId);
    if (link) {
      link.totalClicks = (link.totalClicks || 0) + 1;
      link.lastClickedAt = Date.now();
    }

    // Determine device & browser from User-Agent
    const uaLower = (userAgent || '').toLowerCase();
    let device: 'mobile' | 'desktop' | 'tablet' | 'other' = 'desktop';
    if (/tablet|ipad/i.test(uaLower)) {
      device = 'tablet';
    } else if (/mobile|iphone|android|ipod|blackberry|opera mini/i.test(uaLower)) {
      device = 'mobile';
    }

    let browser = 'Other';
    if (uaLower.includes('edg/')) browser = 'Edge';
    else if (uaLower.includes('chrome/')) browser = 'Chrome';
    else if (uaLower.includes('safari/') && !uaLower.includes('chrome')) browser = 'Safari';
    else if (uaLower.includes('firefox/')) browser = 'Firefox';
    else if (uaLower.includes('curl') || uaLower.includes('bot')) browser = 'Bot/CLI';

    // Geographic determination
    let country = geoHeader?.country || 'United States';
    let countryCode = geoHeader?.countryCode || 'US';
    let city = geoHeader?.city || 'Local / Network';

    // If from localhost or no geo, assign clean reasonable location
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.')) {
      city = 'Local Client';
      country = 'Local Network';
      countryCode = 'LOC';
    }

    const clickEvent: ClickEvent = {
      id: `clk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      linkId,
      alias,
      timestamp: Date.now(),
      country,
      countryCode,
      city,
      device,
      browser,
      referrer: referrer ? referrer : 'Direct / Bookmark',
    };

    this.data.clicks.push(clickEvent);
    this.persist();

    return clickEvent;
  }

  getLinkAnalytics(linkId: string): LinkAnalytics {
    const link = this.getLinkById(linkId);
    if (!link) {
      throw new Error('Link not found');
    }

    const linkClicks = this.data.clicks.filter((c) => c.linkId === linkId);

    // Clicks by Date (last 7 days bucketed)
    const dateMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap.set(key, 0);
    }

    linkClicks.forEach((c) => {
      const d = new Date(c.timestamp);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dateMap.has(key)) {
        dateMap.set(key, (dateMap.get(key) || 0) + 1);
      }
    });

    const clicksByDate = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // Geo Breakdown
    const geoMap = new Map<string, { country: string; countryCode: string; city: string; count: number }>();
    linkClicks.forEach((c) => {
      const key = `${c.country}_${c.city}`;
      if (!geoMap.has(key)) {
        geoMap.set(key, {
          country: c.country,
          countryCode: c.countryCode,
          city: c.city,
          count: 0,
        });
      }
      geoMap.get(key)!.count++;
    });

    const geo = Array.from(geoMap.values()).sort((a, b) => b.count - a.count);

    // Device Breakdown
    const devices: { [device: string]: number } = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      other: 0,
    };
    linkClicks.forEach((c) => {
      devices[c.device] = (devices[c.device] || 0) + 1;
    });

    // Browser Breakdown
    const browsers: { [browser: string]: number } = {};
    linkClicks.forEach((c) => {
      browsers[c.browser] = (browsers[c.browser] || 0) + 1;
    });

    // Referrers Breakdown
    const referrers: { [referrer: string]: number } = {};
    linkClicks.forEach((c) => {
      let refKey = c.referrer;
      try {
        if (refKey.startsWith('http')) {
          refKey = new URL(refKey).hostname;
        }
      } catch {
        // ignore
      }
      referrers[refKey] = (referrers[refKey] || 0) + 1;
    });

    // Recent Clicks (most recent 20)
    const recentClicks = [...linkClicks]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    return {
      link,
      totalClicks: linkClicks.length,
      clicksByDate,
      geo,
      devices,
      browsers,
      referrers,
      recentClicks,
    };
  }
}

export const dbStore = new Store();

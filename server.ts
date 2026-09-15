import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { traceRedirects } from './server/unshorten';
import { analyzeLinkSafety } from './server/geminiAnalysis';
import { dbStore } from './server/db';
import type { User } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Extend express Request to include user
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Authentication Middleware
function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = dbStore.getUserFromSession(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required to access this resource.' });
    return;
  }
  next();
}

app.use(authenticateUser);

// ----------------------------------------------------
// Public Redirection Route (with click & geo analytics)
// ----------------------------------------------------
app.get('/s/:alias', (req, res) => {
  const { alias } = req.params;
  const link = dbStore.getLinkByAlias(alias);

  if (!link) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Shortened Link Not Found</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fafaf9; color: #1c1917; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: white; border: 1px solid #e7e5e4; border-radius: 16px; padding: 32px; max-width: 440px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          h2 { margin-top: 0; font-size: 20px; color: #1c1917; }
          p { color: #78716c; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
          a { display: inline-block; background: #1c1917; color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Link Not Found</h2>
          <p>The short link <strong>/s/${alias}</strong> does not exist or may have been deleted by its creator.</p>
          <a href="/">Go to Link Expander</a>
        </div>
      </body>
      </html>
    `);
    return;
  }

  // Extract IP & Geo data
  const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';
  const referrer = (req.headers['referer'] as string) || '';

  const countryCode = (req.headers['cf-ipcountry'] as string) || undefined;
  const city = (req.headers['x-client-city'] as string) || undefined;

  // Track click event asynchronously
  try {
    dbStore.recordClick(link.id, link.alias, rawIp, userAgent, referrer, {
      countryCode,
      city,
    });
  } catch (err) {
    console.error('Failed to log click event:', err);
  }

  // Redirect to destination
  res.redirect(302, link.originalUrl);
});

// ----------------------------------------------------
// Authentication API Routes
// ----------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const user = dbStore.createUser(email, password, name || 'User');
    const token = dbStore.createSession(user.id);
    res.json({ user, token });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Registration failed.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const storedUser = dbStore.findUserByEmail(email);
    if (!storedUser || !dbStore.verifyPassword(storedUser, password)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = dbStore.createSession(storedUser.id);
    const user: User = {
      id: storedUser.id,
      email: storedUser.email,
      name: storedUser.name,
      createdAt: storedUser.createdAt,
    };
    res.json({ user, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed.' });
  }
});

app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ user: null });
    return;
  }
  res.json({ user: req.user });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    dbStore.deleteSession(token);
  }
  res.json({ success: true });
});

// ----------------------------------------------------
// Custom URL Shortener & Link Management Routes
// ----------------------------------------------------
app.get('/api/links/check-alias', (req, res) => {
  const alias = req.query.alias as string;
  if (!alias) {
    res.status(400).json({ available: false, error: 'Alias parameter is required.' });
    return;
  }

  const validation = dbStore.validateAlias(alias);
  if (!validation.valid) {
    res.json({ available: false, error: validation.error });
    return;
  }

  res.json({ available: true, alias: validation.normalized });
});

app.get('/api/links', requireAuth, (req: AuthenticatedRequest, res) => {
  const links = dbStore.getUserLinks(req.user!.id);
  res.json({ links });
});

app.post('/api/links', (req: AuthenticatedRequest, res) => {
  try {
    const { originalUrl, customAlias, title } = req.body;
    if (!originalUrl) {
      res.status(400).json({ error: 'Destination URL is required.' });
      return;
    }

    // Associate with authenticated user, or fallback to demo user if not logged in
    const userId = req.user ? req.user.id : 'usr_demo_8942';

    const link = dbStore.createShortLink(userId, originalUrl, customAlias, title);
    res.json({ link });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create short link.' });
  }
});

app.delete('/api/links/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const deleted = dbStore.deleteLink(id, req.user!.id);
  if (!deleted) {
    res.status(404).json({ error: 'Link not found or unauthorized.' });
    return;
  }
  res.json({ success: true });
});

app.get('/api/links/:id/analytics', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const link = dbStore.getLinkById(id);
    if (!link || link.userId !== req.user!.id) {
      res.status(404).json({ error: 'Link not found or unauthorized.' });
      return;
    }
    const analytics = dbStore.getLinkAnalytics(id);
    res.json(analytics);
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'Analytics unavailable.' });
  }
});

// ----------------------------------------------------
// URL Unshortener / Enlarging API Routes
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.post('/api/unshorten', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Please provide a valid URL string to enlarge.' });
      return;
    }

    const result = await traceRedirects(url);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Failed to enlarge the shortened link.',
    });
  }
});

app.post('/api/unshorten-batch', async (req, res) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      res.status(400).json({ error: 'Please provide an array of URLs to unshorten.' });
      return;
    }

    const limitedUrls = urls.slice(0, 10);
    const results = await Promise.allSettled(
      limitedUrls.map((u) => (typeof u === 'string' && u.trim() ? traceRedirects(u) : Promise.reject(new Error('Empty URL'))))
    );

    const formatted = results.map((r, index) => {
      if (r.status === 'fulfilled') {
        return r.value;
      }
      return {
        id: `err_${index}`,
        originalUrl: limitedUrls[index] || '',
        expandedUrl: '',
        cleanUrl: '',
        hops: [],
        totalRedirects: 0,
        totalTimeMs: 0,
        finalStatusCode: 0,
        originalLength: (limitedUrls[index] || '').length,
        expandedLength: 0,
        lengthDelta: 0,
        queryParams: [],
        hasTrackingParams: false,
        meta: {},
        security: {
          isHttps: false,
          shortenerDetected: false,
          isIpAddress: false,
          suspiciousTld: false,
          excessiveHops: false,
          riskLevel: 'warning' as const,
          flags: [(r.reason as Error)?.message || 'Failed to resolve link'],
        },
        timestamp: Date.now(),
        error: (r.reason as Error)?.message || 'Failed to resolve link',
      };
    });

    res.json({ results: formatted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Batch unshorten failed.' });
  }
});

app.post('/api/analyze-link', async (req, res) => {
  try {
    const resultData = req.body;
    if (!resultData || !resultData.expandedUrl) {
      res.status(400).json({ error: 'Missing expanded link payload.' });
      return;
    }

    const aiAnalysis = await analyzeLinkSafety(resultData);
    res.json(aiAnalysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI link analysis failed.' });
  }
});

// Vite Middleware & SPA serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

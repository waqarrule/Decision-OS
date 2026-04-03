#!/usr/bin/env node
/* ═══════════════════════════════════════════
   ArcusSoft Decision OS | Express Server
   Serves static files + API + WebSocket push
   ═══════════════════════════════════════════ */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const NodeCache = require('node-cache');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;

// ── Cache (5-min TTL default) ──
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// ── Parse JSON body ──
app.use(express.json());

// ── API Routes (must be before static middleware) ──

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Manual git pull (also works as a webhook target)
app.get('/api/pull', (req, res) => {
  try {
    const result = execSync('git pull --ff-only', { cwd: __dirname, encoding: 'utf8', timeout: 15000 });
    const changed = !result.includes('Already up to date');
    if (changed) {
      cache.flushAll();
      io.emit('git-update', { message: 'Changes pulled', timestamp: new Date().toISOString() });
    }
    res.json({ changed, message: changed ? 'Changes pulled, refreshing...' : 'Already up to date' });
  } catch (e) {
    res.status(500).json({ changed: false, message: e.message });
  }
});

// Generic JSON data endpoint
app.get('/api/data/:file', (req, res) => {
  const file = req.params.file.replace(/[^a-zA-Z0-9_-]/g, '');
  const dataPath = path.join(__dirname, 'data', `${file}.json`);
  if (!fs.existsSync(dataPath)) return res.status(404).json({ error: 'Not found' });
  const cached = cache.get(file);
  if (cached) return res.json(cached);
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    cache.set(file, data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Parse error' });
  }
});

// Company overview
app.get('/api/company', (req, res) => {
  const data = loadDataFile('company');
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// Financials
app.get('/api/financials', (req, res) => {
  const data = loadDataFile('financials');
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// Accounts
app.get('/api/accounts', (req, res) => {
  const data = loadDataFile('accounts');
  if (!data) return res.status(404).json({ error: 'Not found' });
  const { tier, segment, atRisk } = req.query;
  if (data.accounts) {
    let filtered = data.accounts;
    if (tier) filtered = filtered.filter(a => a.tier === tier);
    if (segment) filtered = filtered.filter(a => a.segment === segment);
    if (atRisk === 'true') filtered = filtered.filter(a => a.health < 60);
    return res.json({ ...data, accounts: filtered });
  }
  res.json(data);
});

// Alerts
app.get('/api/alerts', (req, res) => {
  const data = loadDataFile('alerts');
  if (!data) return res.status(404).json({ error: 'Not found' });
  const { severity, portal } = req.query;
  if (data.alerts) {
    let filtered = data.alerts;
    if (severity) filtered = filtered.filter(a => a.severity === severity);
    if (portal) filtered = filtered.filter(a => a.portal === portal);
    return res.json({ ...data, alerts: filtered });
  }
  res.json(data);
});

// Pipeline
app.get('/api/pipeline', (req, res) => {
  const data = loadDataFile('pipeline');
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// Revenue Trend
app.get('/api/revenue-trend', (req, res) => {
  const data = loadDataFile('revenue-trend');
  if (!data) return res.status(404).json({ error: 'Not found' });
  const { range, segments } = req.query;
  let result = { ...data };
  // Filter by time range (last N months)
  if (range) {
    const n = parseInt(range);
    if (n > 0 && n < data.months.length) {
      const start = data.months.length - n;
      result.months = data.months.slice(start);
      result.total = data.total.slice(start);
      result.target = data.target.slice(start);
      const filtered = {};
      for (const [k, v] of Object.entries(data.segments)) {
        filtered[k] = { ...v, data: v.data.slice(start) };
      }
      result.segments = filtered;
    }
  }
  // Filter by segment names (comma-separated)
  if (segments) {
    const segList = segments.split(',').map(s => s.trim().toLowerCase());
    const filtered = {};
    for (const k of segList) {
      if (data.segments[k]) filtered[k] = data.segments[k];
    }
    result.segments = filtered;
  }
  res.json(result);
});

// Revenue Mix
app.get('/api/revenue-mix', (req, res) => {
  const data = loadDataFile('revenue-mix');
  if (!data) return res.status(404).json({ error: 'Not found' });
  const { segment } = req.query;
  if (segment) {
    const segList = segment.split(',').map(s => s.trim().toLowerCase());
    const filtered = data.segments.filter(s => segList.includes(s.id));
    return res.json({ ...data, segments: filtered });
  }
  res.json(data);
});

// Computed metrics per portal
app.get('/api/portals/:id/metrics', (req, res) => {
  const portal = req.params.id;
  const company = loadDataFile('company');
  const financials = loadDataFile('financials');
  const accounts = loadDataFile('accounts');
  const alerts = loadDataFile('alerts');
  const pipeline = loadDataFile('pipeline');
  if (!company) return res.status(500).json({ error: 'Missing data' });

  const metrics = computePortalMetrics(portal, { company, financials, accounts, alerts, pipeline });
  res.json(metrics);
});

// Scenario calculations
app.get('/api/scenarios/:type', (req, res) => {
  const type = req.params.type;
  const company = loadDataFile('company');
  if (!company || !company.scenarios) return res.status(404).json({ error: 'Not found' });
  const scenario = company.scenarios[type];
  if (!scenario) return res.status(404).json({ error: 'Invalid scenario. Use bear/base/bull' });
  res.json(scenario);
});

// ── Playbooks ──

// Get all playbooks (optionally filter by portal) with merged live data + state
app.get('/api/playbooks', (req, res) => {
  const portal = req.query.portal;
  const playbooks = loadDataFile('playbooks');
  const state = loadDataFile('playbook-state');
  const financials = loadDataFile('financials');
  const company = loadDataFile('company');
  const pipeline = loadDataFile('pipeline');
  if (!playbooks) return res.status(404).json({ error: 'playbooks.json not found' });

  let list = playbooks.playbooks || [];
  if (portal) list = list.filter(p => p.portal === portal);

  // Merge live data into each step's liveValue
  const dataMap = { financials, company, pipeline };
  list = list.map(pb => {
    const pbState = state?.playbooks?.[pb.id] || {};
    const steps = pb.steps.map(step => {
      const stepState = pbState.steps?.[step.id] || { status: 'pending' };
      const merged = { ...step, state: stepState };

      // Compute live value if defined
      if (step.liveValue) {
        const src = dataMap[step.liveValue.source];
        if (src) {
          const val = getNestedValue(src, step.liveValue.path);
          if (val !== undefined) {
            merged.liveValueComputed = val;
          }
        }
      }

      // Auto-compute status from data rule
      if (step.statusRule && !step.statusRule.manual) {
        const src = dataMap[step.statusRule.source];
        if (src) {
          const val = getNestedValue(src, step.statusRule.path);
          if (val !== undefined) {
            const autoStatus = evaluateRule(val, step.statusRule);
            merged.autoStatus = autoStatus;
          }
        }
      }

      return merged;
    });
    return { ...pb, steps, state: pbState };
  });

  res.json({ playbooks: list, lastUpdated: new Date().toISOString() });
});

// Update a playbook step
app.patch('/api/playbooks/:playbookId/step/:stepId', (req, res) => {
  const { playbookId, stepId } = req.params;
  const { status, note, chosenOption } = req.body;
  const statePath = path.join(__dirname, 'data', 'playbook-state.json');
  if (!fs.existsSync(statePath)) return res.status(404).json({ error: 'State file not found' });

  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (!state.playbooks[playbookId]) state.playbooks[playbookId] = { steps: {} };
    if (!state.playbooks[playbookId].steps[stepId]) state.playbooks[playbookId].steps[stepId] = {};

    const step = state.playbooks[playbookId].steps[stepId];
    if (status) step.status = status;
    if (note !== undefined) step.note = note;
    if (chosenOption !== undefined) step.chosenOption = chosenOption;
    if (status === 'done') step.completedAt = new Date().toISOString();
    state.playbooks[playbookId].lastUpdated = new Date().toISOString();

    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    cache.del('playbook-state');

    io.emit('playbook-update', { playbookId, stepId, status, timestamp: new Date().toISOString() });

    res.json({ ok: true, step });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update state' });
  }
});

// ── Helpers ──

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
}

function evaluateRule(value, rule) {
  switch (rule.operator) {
    case '>=': return value >= rule.threshold ? 'done' : 'active';
    case '>': return value > rule.threshold ? 'done' : 'active';
    case '<': return value < rule.threshold ? 'done' : 'active';
    case '<=': return value <= rule.threshold ? 'done' : 'active';
    case 'equals': return value === rule.value ? 'done' : 'active';
    default: return 'active';
  }
}

// ── Helper: Load JSON with cache ──
function loadDataFile(name) {
  const cached = cache.get(name);
  if (cached) return cached;
  const dataPath = path.join(__dirname, 'data', `${name}.json`);
  if (!fs.existsSync(dataPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    cache.set(name, data);
    return data;
  } catch { return null; }
}

// ── Helper: Compute portal-specific metrics ──
function computePortalMetrics(portal, data) {
  const { company, financials, accounts, alerts, pipeline } = data;
  const base = {
    portal,
    timestamp: new Date().toISOString(),
    company: company?.company?.name || 'ArcusSoft',
    arr: company?.company?.arr || 0,
  };

  switch (portal) {
    case 'ceo':
      return {
        ...base,
        arr: company?.company?.arr,
        nrr: company?.company?.nrr,
        runway: company?.company?.runwayMonths,
        grossMargin: company?.company?.grossMargin,
        employees: company?.company?.employees,
        customers: company?.company?.customers,
        atRiskARR: accounts?.summary?.atRiskARR,
        expansionARR: accounts?.summary?.expansionARR,
        criticalAlerts: alerts?.summary?.critical || 0,
        boardReadiness: company?.boardMetrics ? Math.round((company.boardMetrics.metricsGreen / company.boardMetrics.metricsTotal) * 100) : 0,
        scenarios: company?.scenarios,
      };
    case 'cfo':
      return {
        ...base,
        mrr: financials?.financials?.mrr,
        burn: financials?.financials?.monthlyBurn,
        runway: financials?.financials?.runwayMonths,
        cashOnHand: financials?.financials?.cashOnHand,
        burnMultiple: financials?.financials?.burnMultiple,
        ltvCac: financials?.financials?.ltvCacRatio,
        revenueBreakdown: financials?.revenueBreakdown,
        expenseBreakdown: financials?.expenseBreakdown,
        cashFlow: financials?.cashFlow,
        hiring: financials?.hiring,
        scenarios: company?.scenarios,
      };
    case 'cro':
      return {
        ...base,
        pipeline: pipeline?.pipeline,
        stages: pipeline?.stages,
        reps: pipeline?.reps,
        winLoss: pipeline?.winLoss,
        deals: pipeline?.deals,
        expansionReady: accounts?.summary?.expansionReady,
        expansionARR: accounts?.summary?.expansionARR,
      };
    case 'cs':
      return {
        ...base,
        accounts: accounts?.summary,
        atRiskAccounts: accounts?.accounts?.filter(a => a.health < 60) || [],
        topAccounts: accounts?.accounts?.filter(a => a.tier === 'Enterprise').slice(0, 5) || [],
        alerts: alerts?.alerts?.filter(a => a.portal === 'cs') || [],
        nrr: company?.company?.nrr,
        ttfd: company?.company?.ttfvDays,
      };
    default:
      return base;
  }
}

// ── WebSocket ──
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Join portal-specific rooms
  socket.on('join-portal', (portal) => {
    socket.join(`portal:${portal}`);
    console.log(`[WS] ${socket.id} joined portal:${portal}`);
  });

  socket.on('leave-portal', (portal) => {
    socket.leave(`portal:${portal}`);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// ── Watch data/ directory for changes ──
const dataDir = path.join(__dirname, 'data');
if (fs.existsSync(dataDir)) {
  const watcher = chokidar.watch(dataDir, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 500 } });
  watcher.on('change', (filePath) => {
    const name = path.basename(filePath, '.json');
    cache.del(name);
    console.log(`[DATA] ${name}.json updated, cache cleared, broadcasting`);
    io.emit('data-update', { source: name, timestamp: new Date().toISOString() });
  });
}

// ── Auto Git Pull ──
const { execSync } = require('child_process');
const GIT_PULL_INTERVAL = 10 * 1000; // 10 seconds

function autoPull() {
  try {
    const result = execSync('git pull --ff-only', { cwd: __dirname, encoding: 'utf8', timeout: 15000 });
    if (!result.includes('Already up to date')) {
      console.log(`[GIT] Pulled changes:\n${result.trim()}`);
      cache.flushAll();
      io.emit('git-update', { message: 'New changes pulled. Refresh to see updates.', timestamp: new Date().toISOString() });
    }
  } catch (e) {
    console.error('[GIT] Auto-pull failed:', e.message);
  }
}

setInterval(autoPull, GIT_PULL_INTERVAL);
autoPull(); // run once on startup

// ── Clean URL support (/ceo → ceo) ──
// Redirect .html URLs to clean URLs
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.endsWith('.html') && !req.path.startsWith('/api/')) {
    return res.redirect(301, req.path.replace(/\.html$/, ''));
  }
  next();
});

// Serve clean URLs
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.includes('.') || req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) return next();
  if (req.path === '/') return next();
  const filePath = path.join(__dirname, req.path.slice(1) + '.html');
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  next();
});

// ── Serve static files (after API routes) ──
app.use(express.static(__dirname));

// ── Start ──
server.listen(PORT, () => {
  console.log(`\n  ArcusSoft Decision OS v5`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  API:  http://localhost:${PORT}/api/health`);
  console.log(`  WS:   ws://localhost:${PORT}\n`);
});

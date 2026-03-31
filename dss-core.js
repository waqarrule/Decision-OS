/* ═══════════════════════════════════════════════════
   DSS Core JS — Decision OS v5
   Shared functions extracted from 19 HTML files
   ═══════════════════════════════════════════════════ */

// ── Data Loader ──
const DSSData = (() => {
  const cache = {};
  async function load(file) {
    if (cache[file]) return cache[file];
    try {
      const res = await fetch(`data/${file}`);
      if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
      const data = await res.json();
      cache[file] = data;
      return data;
    } catch (err) {
      console.warn(`DSSData: Could not load ${file}`, err);
      return null;
    }
  }
  function get(file) { return cache[file] || null; }
  function clear() { Object.keys(cache).forEach(k => delete cache[k]); }
  return { load, get, clear };
})();

// ── Tab Panel Manager ──
function show(id, el) {
  // Hide all screens
  document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
  // Try id directly first, then with 's-' prefix (portal convention)
  let target = document.getElementById(id);
  if (!target) target = document.getElementById('s-' + id);
  if (target) target.classList.add('on');
  // Update tab active state
  if (el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
    el.classList.add('on');
  }
  // Re-render charts if they exist (fix: allow re-render on tab switch)
  if (typeof initCharts === 'function') {
    requestAnimationFrame(() => initCharts());
  }
}

// ── Scenario Toggle ──
let currentScenario = 'base';
function setScenario(type, btn) {
  currentScenario = type;
  // Update button states
  document.querySelectorAll('.scen-btn').forEach(b => {
    b.className = 'scen-btn';
  });
  if (btn) btn.classList.add('s-' + type);
  // Update scenario grid cells (CFO portal pattern)
  document.querySelectorAll('.sg-cell').forEach(c => {
    c.className = 'sg-cell';
  });
  const gridCell = document.getElementById('sg-' + type);
  if (gridCell) gridCell.classList.add('sel', 'sel-' + type);
  // Update DSS data module if loaded
  if (typeof DSS !== 'undefined' && DSS.setScenario) {
    DSS.setScenario(type);
  }
  // Dispatch scenario change event for custom handlers
  document.dispatchEvent(new CustomEvent('scenarioChange', { detail: { scenario: type } }));
  // Update any elements with data-scenario attributes
  document.querySelectorAll(`[data-scenario-${type}]`).forEach(el => {
    el.textContent = el.getAttribute(`data-scenario-${type}`);
  });
}

// ── Chart.js CDN Error Handling ──
function ensureChartJS(callback) {
  if (typeof Chart !== 'undefined') {
    callback();
    return;
  }
  // Show error state on all chart canvases
  document.querySelectorAll('canvas[data-chart]').forEach(canvas => {
    const parent = canvas.parentElement;
    if (parent) {
      const errDiv = document.createElement('div');
      errDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;min-height:180px;color:var(--ink4);font-size:12px;text-align:center;padding:20px';
      errDiv.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Chart unavailable<br><span style="font-size:10px;opacity:.7">Chart.js failed to load. Check your connection.</span>';
      canvas.style.display = 'none';
      parent.appendChild(errDiv);
    }
  });
  // Show global notice
  const notice = document.createElement('div');
  notice.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9999;padding:12px 18px;background:#fef3c7;border:1px solid #d97706;border-radius:8px;font-size:11px;color:#b45309;font-family:Inter,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.1)';
  notice.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Charts unavailable — Chart.js CDN failed to load. <a href="#" onclick="location.reload()" style="color:#92400e;font-weight:600;text-decoration:underline">Retry</a>';
  document.body.appendChild(notice);
  setTimeout(() => notice.remove(), 8000);
}

// ── Chart Initialization (re-entrant, with error handling) ──
function initCharts() {
  if (typeof Chart === 'undefined') return;
  document.querySelectorAll('canvas[data-chart]').forEach(canvas => {
    const ctx = canvas.getContext('2d');
    const type = canvas.getAttribute('data-chart') || 'line';
    const dataStr = canvas.getAttribute('data-chart-data');
    if (!dataStr) return;
    try {
      const chartData = JSON.parse(dataStr);
      if (canvas._chart) canvas._chart.destroy();
      canvas._chart = new Chart(ctx, { type, data: chartData, options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#e4e2dc' } } }
      }});
    } catch (e) { console.warn('Chart init error:', e); }
  });
}

// ── Walkthrough ──
const wtSteps = [
  { title: "Welcome to Decision OS", body: "This is the intelligence layer for ArcusSoft's leadership team. 8 portals, 64 decision systems, one source of truth. Let me show you how it works." },
  { title: "The Hub", body: "From the <b>Hub</b>, you access any executive portal. Each card shows the exec's name, role, decision count, and what's due today. Click any card to enter that portal." },
  { title: "Storytelling Cards", body: "Every screen starts with a <b>storytelling card</b> — a dark panel that tells you what happened, why it matters, and what to do. Not raw data. A narrative." },
  { title: "Scenario Engines", body: "Toggle between <b>Bear / Base / Bull</b> scenarios. Every number on the screen updates. The hiring grid, the forecast chart, the runway — everything shifts." },
  { title: "Cost of Inaction", body: "Every decision screen shows the <b>dollar cost of doing nothing</b>. Not vague opportunity cost — actual money you're losing every month you delay." },
  { title: "Cross-Portal Intelligence", body: "Every portal shows <b>how its data connects to others</b>. The CEO sees CFO's hiring gate. The CRO sees CTO's mobile blocker. One click, full context." },
  { title: "Decision Playbooks", body: "Pre-built <b>decision flows</b> with YES/NO/ESCALATE branches. Step-by-step guidance from trigger to outcome. The system tracks what happened." },
  { title: "You're Ready", body: "Start with the <b>Hub</b> or jump to any portal. The <b>Calculators</b> let you model custom scenarios. <b>Outcomes</b> tracks whether decisions actually worked. Let's go." }
];
let wtIdx = 0;
function wtOpen() { wtIdx = 0; wtRender(); document.getElementById('walkthrough').classList.add('show'); }
function wtClose() { document.getElementById('walkthrough').classList.remove('show'); }
function wtNav(dir) { wtIdx += dir; if (wtIdx < 0) wtIdx = 0; if (wtIdx >= wtSteps.length) { wtClose(); return; } wtRender(); }
function wtRender() {
  const s = wtSteps[wtIdx];
  let dots = '';
  wtSteps.forEach((_, i) => { dots += `<div class="step-dot ${i < wtIdx ? 'done' : i === wtIdx ? 'active' : ''}"></div>`; });
  document.getElementById('wt-dots').innerHTML = dots;
  document.getElementById('wt-body').innerHTML = `<h3>${s.title}</h3><p>${s.body}</p>`;
  document.getElementById('wt-prev').style.visibility = wtIdx === 0 ? 'hidden' : 'visible';
  document.getElementById('wt-next').textContent = wtIdx === wtSteps.length - 1 ? 'Get Started' : 'Next';
}

// ── Data Freshness Indicator ──
function renderFreshness(container, isoDate) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) return;
  const date = new Date(isoDate);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  let text, state;
  if (mins < 1) { text = 'Just now'; state = ''; }
  else if (mins < 60) { text = `${mins}m ago`; state = ''; }
  else if (mins < 1440) { text = `${Math.floor(mins / 60)}h ago`; state = 'stale'; }
  else { text = `${Math.floor(mins / 1440)}d ago`; state = 'offline'; }
  el.innerHTML = `<div class="freshness ${state}"><span class="dot"></span> Updated ${text}</div>`;
}


// ── Number Formatting ──
function fmt$(n) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
  return '$' + n.toLocaleString();
}
function fmtPct(n) { return n.toFixed(1) + '%'; }
function fmtNum(n) { return n.toLocaleString(); }

// ── Relative Time ──
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + ' min ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

// ── Keyboard Shortcuts ──
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  switch (e.key.toLowerCase()) {
    case 'b': setScenario('bear', document.querySelector('.scen-btn[onclick*="bear"]')); break;
    case 'n': setScenario('base', document.querySelector('.scen-btn[onclick*="base"]')); break;
    case 'u': setScenario('bull', document.querySelector('.scen-btn[onclick*="bull"]')); break;
    case 'escape': wtClose(); break;
  }
});

// ── Auth-Aware Nav Helper ──
function renderAuthNav() {
  if (typeof DSLAuth === 'undefined') return;
  const session = DSLAuth.getSession();
  if (!session) return;
  // Inject user badge into any .auth-area container
  const area = document.querySelector('.auth-area');
  if (area) DSLAuth.renderUserBadge(area);
}

// Close auth dropdown on outside click
document.addEventListener('click', (e) => {
  const dd = document.getElementById('auth-dropdown');
  const badge = document.querySelector('.auth-badge');
  if (dd && dd.classList.contains('show') && !badge?.contains(e.target)) {
    dd.classList.remove('show');
  }
});

// ── Auto-init on DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', () => {
  // Render auth nav if available
  renderAuthNav();
  // Init charts
  if (typeof Chart !== 'undefined') {
    initCharts();
  }
});

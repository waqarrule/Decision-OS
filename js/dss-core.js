/* ═══════════════════════════════════════════════════
   DSS Core JS | Decision OS v5
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
  // CEO portal: re-render Revenue Intelligence chart on tab switch
  if (typeof loadRevenueTrend === 'function') {
    loadRevenueTrend();
  }
  if (typeof loadRevenueMix === 'function') {
    loadRevenueMix();
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
  notice.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Charts unavailable, Chart.js CDN failed to load. <a href="#" onclick="location.reload()" style="color:#92400e;font-weight:600;text-decoration:underline">Retry</a>';
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
  { title: "Storytelling Cards", body: "Every screen starts with a <b>storytelling card</b>, a dark panel that tells you what happened, why it matters, and what to do. Not raw data. A narrative." },
  { title: "Scenario Engines", body: "Toggle between <b>Bear / Base / Bull</b> scenarios. Every number on the screen updates. The hiring grid, the forecast chart, the runway, everything shifts." },
  { title: "Cost of Inaction", body: "Every decision screen shows the <b>dollar cost of doing nothing</b>. Not vague opportunity cost, actual money you're losing every month you delay." },
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

// ── Per-portal accent on body ──
document.documentElement.setAttribute('data-portal',
  location.pathname.split('/').pop().replace(/\.html$/, '') || 'home'
);

// ── Auto-reload on git pull ──
(function() {
  let lastHash = null;
  async function checkForUpdates() {
    try {
      const res = await fetch('css/dss-shared.css?t=' + Date.now());
      const text = await res.text();
      // Simple hash: sum of char codes + length
      let h = text.length;
      for (let i = 0; i < text.length; i += 100) h += text.charCodeAt(i);
      const hash = h.toString(36);
      if (lastHash !== null && hash !== lastHash) {
        location.reload();
      }
      lastHash = hash;
    } catch {}
  }
  setInterval(checkForUpdates, 10000);
})();



// ── Playbook Renderer ──
// Renders data-driven playbooks from /api/playbooks into .pb-container elements
// ── Playbook Fallback Data (works without server) ──
var PLAYBOOK_FALLBACK = {
  playbooks: [
    {
      id: "fundraising-trigger", portal: "ceo", title: "Fundraising Trigger", subtitle: "Series C preparation pipeline", category: "capital",
      statusLabel: "Active | Monitor", statusColor: "amber",
      costOfInaction: { monthlyCost: 42000, description: "Delayed Series C = $42K/mo in valuation gap growth" },
      steps: [
        { id:"s1", title:"ARR hits $15M", autoStatus:"done", state:{status:"done"}, completedText:"Triggered 3 months ago" },
        { id:"s2", title:"Board approves Series C prep", autoStatus:"done", state:{status:"done"}, completedText:"Approved Feb 2026" },
        { id:"s3", title:"Fix burn multiple below 2\u00d7", autoStatus:"active", state:{status:"active"}, liveValueComputed:2.1, liveValue:{format:"number",suffix:"\u00d7",threshold:2.0}, targetDisplay:"<1.8\u00d7", owner:"CFO", costOfDelay:42000,
          description:"Reduce SMB acquisition spend. Focus on enterprise where LTV:CAC is 6.2\u00d7 vs SMB\u2019s 2.8\u00d7",
          recommendations:[
            {label:"Cut SMB acquisition budget 30%",impact:"Burn multiple drops to 1.7\u00d7",detail:"SMB CAC payback is 22mo vs Enterprise\u2019s 8mo. Redirect $126K/yr to enterprise channel.",runwayImpact:"+2.1mo runway",arrImpact:"+$126K/yr effective"},
            {label:"Shift 2 SDRs from SMB to Enterprise",impact:"Burn multiple drops to 1.8\u00d7",detail:"Enterprise pipeline coverage improves from 2.8\u00d7 to 3.4\u00d7.",runwayImpact:"+1.4mo runway",arrImpact:"+$180K/yr pipeline capacity"},
            {label:"Raise SMB pricing 20%",impact:"Burn multiple drops to 1.9\u00d7, some churn risk",detail:"SMB NRR is 96%. Price-sensitive segment, expect 8-12% churn spike.",runwayImpact:"+0.9mo runway",arrImpact:"+$68K/yr, minus churn"}
          ]},
        { id:"s4", title:"Build investor deck", state:{status:"pending"}, statusRule:{manual:true}, owner:"CEO", estimatedDays:14 },
        { id:"s5", title:"Begin conversations", state:{status:"pending"}, statusRule:{manual:true}, owner:"CEO", targetDate:"Q3 2026", estimatedDays:60 }
      ]
    },
    {
      id: "hiring-trigger", portal: "ceo", title: "Hiring Trigger", subtitle: "Sales team expansion gate", category: "growth",
      statusLabel: "Blocked", statusColor: "red",
      costOfInaction: { monthlyCost: 144000, description: "3 unfilled reps \u00d7 $48K/mo revenue capacity = $144K/mo lost" },
      steps: [
        { id:"s1", title:"Pipeline coverage > 3\u00d7", autoStatus:"done", state:{status:"done"}, completedText:"Hit 3.2\u00d7 last month", owner:"CRO" },
        { id:"s2", title:"Rep productivity > 85% quota", autoStatus:"done", state:{status:"done"}, completedText:"Current: 91%", owner:"CRO" },
        { id:"s3", title:"CFO scenario check", autoStatus:"active", state:{status:"blocked"}, liveValueComputed:11.8, liveValue:{format:"number",suffix:"mo",threshold:12.0}, targetDisplay:"\u226512mo", owner:"CFO", costOfDelay:144000,
          blockReason:"Bear scenario shows 11.8mo runway with Plan hiring. Below 12mo minimum.",
          resolutionOptions:[
            {id:"opt1",label:"Defer hiring 8 weeks",impact:"Runway becomes 12.4mo \u2713",tradeoff:"Pipeline coverage may drop to 2.6\u00d7 without new reps",arrCost:"-$96K delayed revenue",timeCost:"8 weeks"},
            {id:"opt2",label:"Hire 2 instead of 3",impact:"Runway becomes 12.1mo \u2713",tradeoff:"Slower revenue ramp, ~$180K/yr less new ARR capacity",arrCost:"-$180K/yr capacity",timeCost:"0 weeks"},
            {id:"opt3",label:"Cut marketing spend 15%",impact:"Runway becomes 12.6mo \u2713",tradeoff:"Top-of-funnel lead volume drops ~20% in 2 months",arrCost:"-20% lead flow",timeCost:"0 weeks"}
          ],
          crossPortalLink:{portal:"cfo",section:"scenarios",label:"View CFO scenario calculator"}
        },
        { id:"s4", title:"CEO approval", state:{status:"pending"}, statusRule:{manual:true}, owner:"CEO", dependencies:["s3"] },
        { id:"s5", title:"Post roles + hire", state:{status:"pending"}, statusRule:{manual:true}, owner:"HR", targetDate:"30-day search target" }
      ]
    },
    {
      id: "pivot-strategic", portal: "ceo", title: "Pivot / Strategic Direction", subtitle: "Go/no-go on changing the growth engine", category: "strategy",
      statusLabel: "Monitor", statusColor: "amber",
      costOfInaction: { monthlyCost: 85000, description: "Continuing a stalled strategy burns $85K/mo in misallocated capital" },
      steps: [
        { id:"s1", title:"Growth rate below target for 2+ quarters", autoStatus:"active", state:{status:"active", note:"Net new ARR $1.24M — below $1.5M threshold. One more quarter triggers pivot evaluation."}, liveValueComputed:1240000, liveValue:{format:"currency"}, targetDisplay:">$1.5M/quarter", owner:"CEO",
          description:"Net new ARR $1.24M — below $1.5M threshold. One more quarter triggers pivot evaluation." },
        { id:"s2", title:"Segment health audit", state:{status:"pending"}, statusRule:{manual:true}, owner:"CRO",
          description:"Deep dive each segment: enterprise, mid-market, SMB. Which is growing? Which is dragging? Where\u2019s PMF strongest?",
          recommendations:[
            {label:"Double down on Enterprise",impact:"Focus 80% of resources on $100K+ deals",detail:"Enterprise has 112% NRR, 6.2\u00d7 LTV:CAC, and $7.2M ARR. This is the growth engine.",runwayImpact:"Neutral short-term",arrImpact:"+$2.1M ARR potential at full focus"},
            {label:"Exit SMB entirely",impact:"Shed 207 customers, redeploy 8 headcount",detail:"SMB NRR is 96% (below breakeven), $0.52K ARPU declining 5%/quarter. This segment is destroying value.",runwayImpact:"+3.1mo from cost savings",arrImpact:"-$3.4M ARR, +$680K margin"},
            {label:"Pivot SMB to self-serve PLG",impact:"Automate onboarding, cut CSM cost to zero",detail:"Replace human-touch SMB with product-led growth. ARPU drops to $0.3K but cost-to-serve drops 90%.",runwayImpact:"+1.8mo",arrImpact:"-$1.1M ARR, +$420K margin"}
          ]},
        { id:"s3", title:"Competitive position assessment", state:{status:"pending"}, statusRule:{manual:true}, owner:"CEO", dependencies:["s2"] },
        { id:"s4", title:"Board alignment on direction", state:{status:"pending"}, statusRule:{manual:true}, owner:"CEO", estimatedDays:21, dependencies:["s3"],
          crossPortalLink:{portal:"ceo",section:"board",label:"View board readiness metrics"} },
        { id:"s5", title:"Execute new strategy", state:{status:"pending"}, statusRule:{manual:true}, owner:"CEO", estimatedDays:90, dependencies:["s4"] }
      ]
    },
    {
      id: "pricing-change", portal: "ceo", title: "Pricing Model Change", subtitle: "Restructure how you capture value", category: "growth",
      statusLabel: "Evaluate", statusColor: "amber",
      costOfInaction: { monthlyCost: 62000, description: "Underpriced tiers leave $62K/mo on the table while NRR erodes" },
      steps: [
        { id:"s1", title:"Pricing health diagnostic", state:{status:"done", completedAt:"2026-02-15T00:00:00+08:00", note:"Diagnosis complete. SMB NRR at 96% = pricing leak. Enterprise LTV:CAC 6.2\u00d7 = underpriced by 25-40%. Mid-market healthy at 106%."}, statusRule:{manual:true}, owner:"CPO", completedText:"Completed Feb 15, 2026",
          description:"Are customers churning on price or value? Analyze win/loss, NPS verbatims, and segment-level NRR.",
          recommendations:[
            {label:"Raise Enterprise prices 25-40%",impact:"Enterprise ARPU from $35.6K to $44-50K",detail:"Enterprise NRR is 112% and LTV:CAC is 6.2\u00d7. Customers are getting 6\u00d7 the value they pay for. Price to value.",runwayImpact:"+2.4mo from increased ARR",arrImpact:"+$1.5-2.4M ARR from existing base"},
            {label:"Introduce usage-based tier for SMB",impact:"Replace flat $0.52K ARPU with consumption pricing",detail:"SMB NRR at 96% means flat pricing doesn\u2019t capture growth. Usage-based aligns cost with value.",runwayImpact:"+1.2mo",arrImpact:"+$340K from usage expansion"},
            {label:"Kill the free/cheap tier entirely",impact:"Raise SMB floor from $0.52K to $0.8K minimum",detail:"Bottom 40% of SMB accounts use <$200/mo in value. They cost more in support than they pay.",runwayImpact:"+0.8mo from reduced support load",arrImpact:"-15% SMB customers, +$180K net ARR"}
          ]},
        { id:"s2", title:"Competitive pricing benchmark", state:{status:"done", completedAt:"2026-03-10T00:00:00+08:00", note:"We\u2019re 35% below Enterprise market median. SMB is at market but value delivery doesn\u2019t match. Mid-market slightly below."}, statusRule:{manual:true}, owner:"CPO", completedText:"Completed Mar 10, 2026", dependencies:["s1"] },
        { id:"s3", title:"Model new pricing tiers", state:{status:"active", note:"Working on tier design. Usage-based for SMB, seat-based for Enterprise. Targeting May board review."}, statusRule:{manual:true}, owner:"CPO", estimatedDays:21, dependencies:["s2"],
          description:"Design the new pricing structure. Three models under evaluation: hybrid seat + usage, pure usage-based, or value-based tiered.",
          recommendations:[
            {label:"Hybrid: seat-based Enterprise + usage SMB",impact:"Best of both \u2014 predictable base + growth capture",detail:"Enterprise stays per-seat (they want predictability). SMB moves to usage (they grow organically). Mid-market gets hybrid.",runwayImpact:"+1.8mo projected",arrImpact:"+$1.2M ARR from usage capture"},
            {label:"Pure usage-based across all tiers",impact:"Maximum growth alignment, but revenue volatility",detail:"Every customer pays for what they use. Upside: heavy users pay more automatically. Downside: revenue becomes lumpy.",runwayImpact:"+2.1mo best case",arrImpact:"+$1.8M best case"},
            {label:"Value-based tiers (Good / Better / Best)",impact:"Clear upgrade path, proven SaaS model",detail:"3 tiers with feature gating. Simplest to sell and understand. Risk: doesn\u2019t capture usage growth within a tier.",runwayImpact:"+1.2mo",arrImpact:"+$800K from tier upgrades"}
          ] },
        { id:"s4", title:"Grandfather existing customers", state:{status:"pending"}, statusRule:{manual:true}, owner:"CEO", dependencies:["s3"],
          crossPortalLink:{portal:"cs",section:"atrisk",label:"View at-risk accounts for churn modeling"},
          resolutionOptions:[
            {id:"opt1",label:"Grandfather permanently",impact:"Zero churn from pricing change",tradeoff:"$1.8M/yr revenue gap vs new customers on new pricing",arrCost:"-$1.8M/yr gap",timeCost:"Permanent"},
            {id:"opt2",label:"12-month grandfather period",impact:"Expected 3-5% churn at migration",tradeoff:"Balanced \u2014 gives customers time to adapt, closes gap in year 2",arrCost:"-$200K one-time churn",timeCost:"12 months"},
            {id:"opt3",label:"Immediate migration with 20% discount",impact:"Expected 8-12% churn",tradeoff:"Fastest revenue uplift but risky with Enterprise accounts",arrCost:"-$500K-800K churn",timeCost:"0 months"}
          ]},
        { id:"s5", title:"Board approval + launch", state:{status:"pending"}, statusRule:{manual:true}, owner:"CEO", estimatedDays:30, dependencies:["s4"] }
      ]
    },
    {
      id: "market-expansion", portal: "ceo", title: "Market Expansion", subtitle: "Enter new segments or geographies", category: "growth",
      statusLabel: "Evaluate", statusColor: "blue",
      costOfInaction: { monthlyCost: 95000, description: "Every month delayed = $95K in first-mover advantage lost to competitors" },
      steps: [
        { id:"s1", title:"Core market saturation analysis", state:{status:"active", note:"Enterprise penetration at ~28% of TAM. Core segment has headroom but growth decelerating."}, statusRule:{manual:true}, owner:"CRO",
          description:"How much headroom is left? If enterprise penetration is <30% of TAM, expand there first.",
          recommendations:[
            {label:"Expand to mid-market Enterprise (500-2000 emp)",impact:"TAM adds $4.2B addressable",detail:"Our ICP is 2000+ employees. The 500-2000 segment has similar needs but shorter sales cycles.",runwayImpact:"-1.2mo investment, +3.4mo at scale",arrImpact:"+$3.8M ARR within 18 months"},
            {label:"Go international \u2014 UK/EU first",impact:"TAM adds $6.1B addressable",detail:"UK is easiest (English, similar buying patterns). EU requires localization. $480K setup, 6 months to first revenue.",runwayImpact:"-2.4mo setup, +4.1mo at scale",arrImpact:"+$5.2M ARR within 24 months"},
            {label:"Vertical expansion \u2014 add healthcare",impact:"TAM adds $2.8B addressable",detail:"Healthcare has compliance requirements (HIPAA) but pays 2\u00d7 ARPU. Need product work but zero GTM changes.",runwayImpact:"-1.8mo compliance build, +2.6mo at scale",arrImpact:"+$2.4M ARR within 12 months"}
          ]},
        { id:"s2", title:"TAM/SAM/SOM validation", state:{status:"pending"}, statusRule:{manual:true}, owner:"CEO", estimatedDays:30, dependencies:["s1"] },
        { id:"s3", title:"GTM readiness assessment", state:{status:"pending"}, statusRule:{manual:true}, owner:"CRO", dependencies:["s2"],
          resolutionOptions:[
            {id:"opt1",label:"Piggyback on existing GTM",impact:"Fastest path, lowest cost",tradeoff:"Only works for adjacent segments, not new geos or verticals",arrCost:"-$50K incremental",timeCost:"2 months"},
            {id:"opt2",label:"Build dedicated expansion team",impact:"Full focus, higher success rate",tradeoff:"Requires 4-6 new hires, $720K annual cost",arrCost:"-$720K/yr team cost",timeCost:"4 months to hire + ramp"},
            {id:"opt3",label:"Partner/distributor model",impact:"Low cost, fast geo coverage",tradeoff:"Less control, margin sharing (30-40%), brand dilution risk",arrCost:"-30% margin share",timeCost:"3 months to partner setup"}
          ]},
        { id:"s4", title:"Resource commitment + budget", state:{status:"pending"}, statusRule:{manual:true}, owner:"CFO", dependencies:["s3"],
          crossPortalLink:{portal:"cfo",section:"scenarios",label:"Model expansion cost against runway scenarios"} },
        { id:"s5", title:"Board approval + launch plan", state:{status:"pending"}, statusRule:{manual:true}, owner:"CEO", estimatedDays:21, dependencies:["s4"] }
      ]
    },
    {
      id: "ma-evaluation", portal: "ceo", title: "M&A / Acquisition", subtitle: "Buy vs build decision framework", category: "strategy",
      statusLabel: "Opportunistic", statusColor: "blue",
      costOfInaction: { monthlyCost: 120000, description: "Competitor acquires the target first = $120K/mo in lost competitive position" },
      steps: [
        { id:"s1", title:"Strategic rationale: what are we buying?", state:{status:"active", note:"Evaluating 3 types: technology (offline gap loses 23% deals), talent (15 eng = 9mo hiring), customers ($4M ARR competitor)."}, statusRule:{manual:true}, owner:"CEO",
          description:"Not \u2018a company\u2019 \u2014 a capability. What specific gap does this fill?",
          recommendations:[
            {label:"Acquire for technology (feature gap)",impact:"Close 18-month product gap in 3 months",detail:"Losing 23% of Enterprise deals for missing offline/mobile. CTO estimates 14mo to build. Acquisition = 90 days.",runwayImpact:"-3.2mo cost, +4.8mo at retention",arrImpact:"+$1.4M ARR from retained deals"},
            {label:"Acquire for talent (team lift)",impact:"Instant 15-person engineering team",detail:"Hiring 15 senior engineers takes 9+ months. Acqui-hire delivers day-one productivity.",runwayImpact:"-2.1mo premium, +1.8mo velocity",arrImpact:"+$800K ARR from faster delivery"},
            {label:"Acquire for customers (market share)",impact:"Instant 200+ customers + $4M ARR",detail:"Absorb a smaller competitor\u2019s base. Cross-sell our platform. Expect 20% churn during migration.",runwayImpact:"-6.8mo cost, +8.2mo post-integration",arrImpact:"+$3.2M net ARR after churn"}
          ]},
        { id:"s2", title:"Target identification + initial diligence", state:{status:"pending"}, statusRule:{manual:true}, owner:"CEO", estimatedDays:30, dependencies:["s1"] },
        { id:"s3", title:"Financial modeling: buy vs build", state:{status:"pending"}, statusRule:{manual:true}, owner:"CFO", dependencies:["s2"],
          crossPortalLink:{portal:"cfo",section:"scenarios",label:"Model acquisition cost against bear/base/bull"},
          resolutionOptions:[
            {id:"opt1",label:"All-cash deal",impact:"Cleanest execution, highest runway impact",tradeoff:"Burns cash reserves, bear scenario drops to 9.2mo",arrCost:"-$4.2M cash",timeCost:"Immediate"},
            {id:"opt2",label:"Cash + equity (60/40)",impact:"Balanced risk, dilutes 8-12%",tradeoff:"Founders dilute but preserves runway",arrCost:"-$2.5M cash + 10% dilution",timeCost:"Immediate"},
            {id:"opt3",label:"Earnout structure",impact:"Pay for performance, lowest upfront",tradeoff:"Seller misalignment, integration friction, 18mo earnout",arrCost:"-$1.5M upfront + $3M earnout",timeCost:"18 months"}
          ]},
        { id:"s4", title:"Integration plan", state:{status:"pending"}, statusRule:{manual:true}, owner:"COO", estimatedDays:21, dependencies:["s3"] },
        { id:"s5", title:"Board vote + close", state:{status:"pending"}, statusRule:{manual:true}, owner:"CEO", estimatedDays:14, dependencies:["s4"] }
      ]
    }
  ],
  lastUpdated: new Date().toISOString()
};

// ── Playbook Renderer v2 ──
async function renderPlaybooks(portal) {
  const containers = document.querySelectorAll('.pb-container[data-playbook]');
  if (!containers.length) return;

  let playbooksData;
  try {
    const res = await fetch(`/api/playbooks?portal=${portal || 'ceo'}`);
    if (!res.ok) throw new Error('API returned ' + res.status);
    playbooksData = await res.json();
  } catch (e) {
    console.warn('renderPlaybooks: API unavailable, using fallback data', e.message);
    playbooksData = PLAYBOOK_FALLBACK;
  }

  const playbooks = playbooksData.playbooks || [];

  containers.forEach(container => {
    const pbId = container.getAttribute('data-playbook');
    const pb = playbooks.find(p => p.id === pbId);
    if (!pb) return;

    // Compute summary stats
    const totalSteps = pb.steps.length;
    const doneSteps = pb.steps.filter(s => s.autoStatus === 'done' || s.state?.status === 'done').length;
    const blockedSteps = pb.steps.filter(s => s.state?.status === 'blocked').length;
    const progressPct = Math.round((doneSteps / totalSteps) * 100);
    const nextStep = pb.steps.find(s => s.autoStatus !== 'done' && s.state?.status !== 'done');
    const monthlyBurn = pb.costOfInaction?.monthlyCost || 0;

    let html = '';

    // ═══ CARD HEADER ═══
    html += '<div class="pb-card">';
    html += '<div class="pb-card-header">';
    html += '<div class="pb-card-title-row">';
    html += '<span class="pb-card-title">' + escapeHtml(pb.title) + '</span>';
    html += '<span class="bdg bdg-' + pb.statusColor + '">' + escapeHtml(pb.statusLabel) + '</span>';
    html += '</div>';
    if (pb.subtitle) html += '<div class="pb-card-sub">' + escapeHtml(pb.subtitle) + '</div>';
    html += '<div class="pb-card-meta">';
    html += '<span class="pb-card-portal">CEO \u00b7 ' + escapeHtml(pb.category === 'capital' ? 'Capital' : 'Growth') + ' Layer</span>';
    html += '</div>';
    html += '</div>';

    // ═══ SUMMARY BAR ═══
    html += '<div class="pb-summary">';
    html += `<div class="pb-sum-progress"><div class="pb-sum-bar"><div class="pb-sum-bar-fill" style="width:${progressPct}%"></div></div><span class="pb-sum-pct">${progressPct}%</span></div>`;
    html += `<div class="pb-sum-stats">`;
    html += `<div class="pb-sum-stat"><span class="pb-sum-label">Steps</span><span class="pb-sum-val">${doneSteps}/${totalSteps}</span></div>`;
    if (blockedSteps > 0) {
      html += `<div class="pb-sum-stat pb-sum-stat-warn"><span class="pb-sum-label">Blocked</span><span class="pb-sum-val">${blockedSteps}</span></div>`;
    }
    if (monthlyBurn > 0) {
      html += `<div class="pb-sum-stat pb-sum-stat-cost"><span class="pb-sum-label">Delay cost</span><span class="pb-sum-val">${fmt$(monthlyBurn)}/mo</span></div>`;
    }
    if (nextStep) {
      html += `<div class="pb-sum-stat"><span class="pb-sum-label">Next action</span><span class="pb-sum-val pb-sum-action">${escapeHtml(nextStep.title)}</span></div>`;
    }
    html += '</div></div>';

    // ═══ STEPS ═══
    html += '<div class="pb-steps-v2">';

    pb.steps.forEach((step, i) => {
      const stepState = step.state?.status || 'pending';
      const autoStatus = step.autoStatus || null;

      let visualStatus = 'pending';
      if (stepState === 'done' || autoStatus === 'done') visualStatus = 'done';
      else if (stepState === 'blocked') visualStatus = 'blocked';
      else if (autoStatus === 'active' || stepState === 'active') visualStatus = 'active';

      const isExpandable = visualStatus === 'active' || visualStatus === 'blocked' || visualStatus === 'done';
      const stepId = `pb-${pb.id}-${step.id}`;

      // Compute progress toward threshold for active steps
      let progressInfo = '';
      if (step.liveValueComputed !== undefined && step.liveValue?.threshold !== undefined && visualStatus !== 'done') {
        const current = step.liveValueComputed;
        const target = step.liveValue.threshold;
        const operator = step.liveValue.operator || (current < target ? '<' : '>');
        let pct;
        if (operator === '<' || current < target) {
          // Lower is better (e.g., burn multiple)
          pct = Math.min(100, Math.max(0, ((target / current) * 100)));
        } else {
          // Higher is better
          pct = Math.min(100, Math.max(0, ((current / target) * 100)));
        }
        progressInfo = `<div class="pb-threshold-bar"><div class="pb-threshold-fill${pct >= 100 ? ' pb-threshold-good' : ''}" style="width:${Math.round(pct)}%"></div></div>`;
      }

      html += `<div class="pb-step-v2 pb-step-${visualStatus}" ${isExpandable ? `onclick="togglePlaybookStep('${stepId}')"` : ''}>`;

      // Step connector line
      html += `<div class="pb-step-connector${i > 0 ? ' pb-conn-has-line' : ''}">`;
      if (visualStatus === 'done') {
        html += '<div class="pb-step-dot pb-dot-done"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>';
      } else if (visualStatus === 'blocked') {
        html += '<div class="pb-step-dot pb-dot-blocked">!</div>';
      } else if (visualStatus === 'active') {
        html += `<div class="pb-step-dot pb-dot-active">${i + 1}</div>`;
      } else {
        html += `<div class="pb-step-dot pb-dot-pending">${i + 1}</div>`;
      }
      html += '</div>';

      // Step content
      html += '<div class="pb-step-body">';
      html += '<div class="pb-step-header">';

      // Title + status
      html += `<span class="pb-step-title">${escapeHtml(step.title)}</span>`;
      if (visualStatus === 'done') {
        html += '<span class="pb-step-badge pb-badge-done">Done</span>';
      } else if (visualStatus === 'blocked') {
        html += '<span class="pb-step-badge pb-badge-blocked">Blocked</span>';
      } else if (visualStatus === 'active') {
        html += '<span class="pb-step-badge pb-badge-active">Active</span>';
      }

      // Owner + cost inline
      if (step.owner && visualStatus !== 'done') {
        html += `<span class="pb-step-owner">${escapeHtml(step.owner)}</span>`;
      }
      if (step.costOfDelay && visualStatus !== 'done') {
        html += `<span class="pb-step-cost">${fmt$(step.costOfDelay)}/mo at risk</span>`;
      }

      html += '</div>'; // .pb-step-header

      // Completed text or live value summary
      if (visualStatus === 'done' && step.completedText) {
        html += `<div class="pb-step-summary-done">${escapeHtml(step.completedText)}</div>`;
      } else if (step.liveValueComputed !== undefined && visualStatus !== 'done') {
        const formatted = formatLiveValue(step.liveValueComputed, step.liveValue);
        html += `<div class="pb-step-live">`;
        html += `<span class="pb-live-current">${formatted}</span>`;
        if (step.targetDisplay) html += `<span class="pb-live-target"> / ${escapeHtml(step.targetDisplay)}</span>`;
        html += '</div>';
        if (progressInfo) html += progressInfo;
      } else if (visualStatus === 'pending') {
        html += `<div class="pb-step-pending-text">${step.owner ? 'Waiting on ' + escapeHtml(step.owner) : 'Not started'}</div>`;
      }

      // Expand indicator for expandable steps
      if (isExpandable) {
        html += `<div class="pb-expand-hint">Click to ${visualStatus === 'blocked' ? 'resolve' : visualStatus === 'done' ? 'see what happened' : 'see options'}</div>`;
      }

      html += '</div>'; // .pb-step-body
      html += '</div>'; // .pb-step-v2

      // ═══ EXPANDED DETAIL PANEL ═══
      if (isExpandable) {
        html += `<div class="pb-detail" id="${stepId}-detail" style="display:none">`;

        // Completion detail (for done steps)
        if (visualStatus === 'done') {
          const completedAt = step.state?.completedAt || step.completedAt;
          const completedText = step.completedText || 'Completed';
          html += '<div class="pb-completion-block">';
          html += '<div class="pb-completion-header"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
          html += '<span class="pb-completion-label">' + escapeHtml(completedText) + '</span></div>';
          if (completedAt) html += '<div class="pb-completion-date">Completed ' + new Date(completedAt).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}) + '</div>';
          if (step.owner) html += '<div class="pb-completion-owner">Owned by <strong>' + escapeHtml(step.owner) + '</strong></div>';
          html += '</div>';
        }

        // Block reason
        if (step.blockReason) {
          html += `<div class="pb-block-reason"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg> ${escapeHtml(step.blockReason)}</div>`;
        }

        // Description
        if (step.description) {
          html += `<div class="pb-detail-desc">${escapeHtml(step.description)}</div>`;
        }

        // Resolution options (for blocked)
        if (step.resolutionOptions && step.resolutionOptions.length) {
          html += '<div class="pb-options-v2">';
          html += '<div class="pb-options-title">Choose a path forward:</div>';
          step.resolutionOptions.forEach((opt, oi) => {
            const chosen = step.state?.chosenOption === opt.id;
            html += `<div class="pb-opt-card${chosen ? ' pb-opt-chosen' : ''}" onclick="event.stopPropagation();choosePlaybookOption('${pb.id}','${step.id}','${opt.id}')">`;
            html += `<div class="pb-opt-num">${oi + 1}</div>`;
            html += '<div class="pb-opt-body">';
            html += `<div class="pb-opt-head"><span class="pb-opt-name">${escapeHtml(opt.label)}</span><span class="pb-opt-result">${escapeHtml(opt.impact)}</span></div>`;
            html += `<div class="pb-opt-meta">`;
            if (opt.arrCost) html += `<span class="pb-opt-tag pb-opt-cost">${escapeHtml(opt.arrCost)}</span>`;
            if (opt.timeCost) html += `<span class="pb-opt-tag pb-opt-time">${escapeHtml(opt.timeCost)}</span>`;
            html += '</div>';
            if (opt.tradeoff) html += `<div class="pb-opt-trade">\u26a0 ${escapeHtml(opt.tradeoff)}</div>`;
            html += '</div>';
            if (chosen) html += '<div class="pb-opt-check">\u2713</div>';
            html += '</div>';
          });
          html += '</div>';
        }

        // Recommendations (for active)
        if (step.recommendations && step.recommendations.length) {
          html += '<div class="pb-recs-v2">';
          html += '<div class="pb-options-title">Recommended actions:</div>';
          step.recommendations.forEach(rec => {
            html += '<div class="pb-rec-card">';
            html += '<div class="pb-rec-head"><span class="pb-rec-name">' + escapeHtml(rec.label) + '</span><span class="pb-rec-impact">' + escapeHtml(rec.impact) + '</span></div>';
            html += `<div class="pb-rec-meta">`;
            if (rec.runwayImpact) html += `<span class="pb-opt-tag pb-opt-good">${escapeHtml(rec.runwayImpact)}</span>`;
            if (rec.arrImpact) html += `<span class="pb-opt-tag pb-opt-arr">${escapeHtml(rec.arrImpact)}</span>`;
            html += '</div>';
            html += `<div class="pb-rec-detail">${escapeHtml(rec.detail)}</div>`;
            html += '</div>';
          });
          html += '</div>';
        }

        // Cross-portal link
        if (step.crossPortalLink) {
          const link = step.crossPortalLink;
          html += `<a href="${escapeHtml(link.portal)}" class="pb-cross-link-v2" onclick="event.stopPropagation()">`;
          html += `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
          html += escapeHtml(link.label);
          html += '</a>';
        }

        // Action row
        html += '<div class="pb-actions">';
        if (step.statusRule?.manual && visualStatus !== 'done') {
          html += `<button class="pb-act-btn pb-act-done" onclick="event.stopPropagation();markPlaybookStepDone('${pb.id}','${step.id}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Mark complete</button>`;
        }
        html += `<button class="pb-act-btn pb-act-note" onclick="event.stopPropagation();togglePlaybookNote('${stepId}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Add note</button>`;
        html += '</div>';

        // Note input area (hidden by default)
        html += `<div class="pb-note-area" id="${stepId}-note" style="display:none">`;
        html += `<textarea placeholder="Add a note about this step..." onevent="event.stopPropagation()"></textarea>`;
        html += `<button onclick="event.stopPropagation();savePlaybookNote('${pb.id}','${step.id}','${stepId}')">Save</button>`;
        html += '</div>';

        // Existing note
        const existingNote = step.state?.note || step.note;
        if (existingNote) {
          html += `<div class="pb-note-existing"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> ${escapeHtml(existingNote)}</div>`;
        }

        html += '</div>'; // .pb-detail
      }
    });

    html += '</div>'; // .pb-steps-v2

    // Footer
    if (pb.state?.lastUpdated) {
      html += `<div class="pb-footer">Updated ${timeAgo(pb.state.lastUpdated)} \u00b7 ${pb.steps.length} steps \u00b7 ${pb.costOfInaction ? fmt$(pb.costOfInaction.monthlyCost) + '/mo at risk' : ''}</div>`;
    }

    html += '</div>'; // .pb-card
    container.innerHTML = html;
  });
}

function togglePlaybookStep(stepId) {
  const detail = document.getElementById(stepId + '-detail');
  if (!detail) return;
  const isHidden = detail.style.display === 'none';
  // Close all other open details in the same playbook
  const parent = detail.closest('.pb-steps-v2');
  if (parent) {
    parent.querySelectorAll('.pb-detail').forEach(d => { d.style.display = 'none'; });
    parent.querySelectorAll('.pb-step-v2').forEach(s => s.classList.remove('pb-step-expanded'));
  }
  if (isHidden) {
    detail.style.display = 'block';
    const step = detail.previousElementSibling;
    if (step) step.classList.add('pb-step-expanded');
  }
}

function togglePlaybookNote(stepId) {
  const note = document.getElementById(stepId + '-note');
  if (note) note.style.display = note.style.display === 'none' ? 'flex' : 'none';
}

async function savePlaybookNote(playbookId, stepId, containerStepId) {
  const noteArea = document.getElementById(containerStepId + '-note');
  if (!noteArea) return;
  const textarea = noteArea.querySelector('textarea');
  if (!textarea || !textarea.value.trim()) return;
  try {
    await fetch(`/api/playbooks/${playbookId}/step/${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: textarea.value.trim() })
    });
  } catch(e) {}
  renderPlaybooks(document.documentElement.getAttribute('data-portal'));
}

function formatLiveValue(val, config) {
  if (!config) return String(val);
  if (config.format === 'number') return Number(val).toFixed(1) + (config.suffix || '');
  if (config.format === 'currency') return fmt$(val);
  if (config.format === 'percent') return val + '%';
  return String(val) + (config.suffix || '');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function choosePlaybookOption(playbookId, stepId, optionId) {
  try {
    await fetch(`/api/playbooks/${playbookId}/step/${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chosenOption: optionId, status: 'active', note: 'Option selected: ' + optionId })
    });
  } catch(e) {}
  renderPlaybooks(document.documentElement.getAttribute('data-portal'));
}

async function markPlaybookStepDone(playbookId, stepId) {
  try {
    await fetch(`/api/playbooks/${playbookId}/step/${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' })
    });
  } catch(e) {}
  renderPlaybooks(document.documentElement.getAttribute('data-portal'));
}

// ── Auto-init on DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', () => {
  // Render auth nav if available
  renderAuthNav();
  // Init charts
  if (typeof Chart !== 'undefined') {
    initCharts();
  }
});

/* ═══════════════════════════════════════
   ArcusSoft Decision OS | Dark Mode
   Self-contained: styles + toggle + persistence
   ═══════════════════════════════════════ */
(function(){
  'use strict';

  // ── Inject styles ──
  var css = [
    'html.dark{',
    '  --bg:#111113;--bg2:#1a1a1e;--bg3:#222226;--bg4:#2c2c31;',
    '  --surface:#1c1c20;--surface2:#202024;--surface3:#252529;',
    '  --glass:rgba(20,20,24,.88);--glass2:rgba(20,20,24,.95);',
    '  --border:#2a2a2f;--border2:#35353b;--border3:#44444a;',
    '  --ink:#eae9e5;--ink2:#c5c3bd;--ink3:#8a8880;--ink4:#5e5c56;--ink5:#3a3834;',
    '  --blue:#60a5fa;--blue-soft:rgba(59,130,246,.12);--blue-glow:rgba(96,165,250,.1);--blue-text:#93bbfd;',
    '  --green:#4ade80;--green-soft:rgba(34,197,94,.12);--green-glow:rgba(74,222,128,.1);--green-text:#6ee7a0;',
    '  --red:#f87171;--red-soft:rgba(239,68,68,.12);--red-glow:rgba(248,113,113,.08);--red-text:#fca5a5;',
    '  --amber:#fbbf24;--amber-soft:rgba(245,158,11,.12);--amber-glow:rgba(251,191,36,.1);--amber-text:#fcd34d;',
    '  --purple:#a78bfa;--purple-soft:rgba(124,58,237,.12);--purple-glow:rgba(167,139,250,.1);--purple-text:#c4b5fd;',
    '  --orange:#fb923c;--orange-soft:rgba(234,88,12,.12);--orange-text:#fdba74;',
    '  --teal:#2dd4bf;--teal-soft:rgba(13,148,136,.12);--teal-text:#5eead4;',
    '  --rose:#fb7185;--rose-soft:rgba(225,29,72,.12);--rose-text:#fda4af;',
    '  --shadow:0 1px 3px rgba(0,0,0,.2),0 4px 12px rgba(0,0,0,.15);',
    '  --shadow-hover:0 2px 8px rgba(0,0,0,.25),0 8px 24px rgba(0,0,0,.2);',
    '  --shadow-lg:0 8px 32px rgba(0,0,0,.3),0 2px 8px rgba(0,0,0,.2);',
    '}',
    'html.dark body{background:var(--bg);color:var(--ink)}',
    'html.dark .hdr{background:rgba(17,17,19,.96)!important;box-shadow:0 1px 0 var(--accent)}',
    'html.dark .tabs{background:rgba(17,17,19,.96)!important}',
    'html.dark .topnav{background:var(--glass2)!important}',
    'html.dark .kc{background:var(--surface);border-color:var(--border)}',
    'html.dark .kc:hover{border-color:var(--border2)}',
    'html.dark .pcard{background:var(--surface);border-color:var(--border)}',
    'html.dark .pcard:hover{border-color:var(--border2)}',
    'html.dark .tcard{background:var(--surface);border-color:var(--border)}',
    'html.dark .rs-section,html.dark .rs-section2{background:var(--surface);border-color:var(--border)}',
    'html.dark .rs-alert{background:var(--bg2);border-color:var(--border)}',
    'html.dark .rs-alert:hover{background:var(--surface)}',
    'html.dark .rp-section{background:var(--surface);border-color:var(--border)}',
    'html.dark .alert-strip{background:var(--surface);border-color:var(--border)}',
    'html.dark .stat{background:var(--surface);border-color:var(--border)}',
    'html.dark .wp-card,html.dark .ws-card{background:var(--surface);border-color:var(--border)}',
    'html.dark .wt-card{background:var(--surface);border-color:var(--border)}',
    'html.dark .sc-card{background:var(--surface);border-color:var(--border)}',
    'html.dark input,html.dark select,html.dark textarea{background:var(--bg2);border-color:var(--border);color:var(--ink)}',
    'html.dark .auth-dd{background:var(--surface);border-color:var(--border)}',
    'html.dark .auth-dd-header{border-color:var(--border)}',
    'html.dark .auth-dd-item:hover{background:var(--bg2)}',
    'html.dark .auth-badge{border-color:var(--border)}',
    'html.dark .tab:hover{background:var(--bg2)}',
    'html.dark .tab.on{background:var(--blue-soft)}',
    'html.dark .hdr-r a:hover{background:var(--bg2)}',
    'html.dark .topnav .links a:hover{background:var(--bg2)}',
    'html.dark .login-left{background:linear-gradient(135deg,#111827 0%,#1e1b2e 50%,#111a15 100%)!important}',
    'html.dark .login-feature{background:rgba(30,30,34,.7);border-color:var(--border)}',
    'html.dark .login-feature:hover{background:var(--surface)}',
    'html.dark .session-banner{background:var(--amber-soft);border-color:var(--border)}',
    '',
    '/* ── Toggle Button ── */',
    '.dss-theme-toggle{',
    '  display:inline-flex;align-items:center;justify-content:center;',
    '  width:34px;height:34px;border-radius:9px;cursor:pointer;',
    '  background:transparent;border:1.5px solid var(--border);',
    '  color:var(--ink3);position:relative;overflow:hidden;',
    '  transition:background .2s,border-color .2s,color .2s,transform .15s;',
    '  flex-shrink:0;outline:none;box-shadow:none;',
    '  -webkit-appearance:none;appearance:none;',
    '  padding:0;margin:0;margin-left:10px;',
    '  font-size:0;line-height:0;',
    '}',
    '.dss-theme-toggle:hover{background:var(--bg2);color:var(--ink);border-color:var(--border2);transform:scale(1.05)}',
    '.dss-theme-toggle:active{transform:scale(.95)}',
    '.dss-theme-toggle:focus{outline:none;box-shadow:0 0 0 2px var(--blue-glow)}',
    '.dss-theme-toggle svg{',
    '  position:absolute;transition:opacity .35s ease,transform .35s ease;',
    '  width:17px;height:17px;stroke:currentColor;fill:none;',
    '  stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;',
    '}',
    '.dss-theme-toggle .dss-icon-sun{opacity:0;transform:rotate(180deg) scale(.3)}',
    '.dss-theme-toggle .dss-icon-moon{opacity:1;transform:rotate(0) scale(1)}',
    'html.dark .dss-theme-toggle .dss-icon-sun{opacity:1;transform:rotate(0) scale(1)}',
    'html.dark .dss-theme-toggle .dss-icon-moon{opacity:0;transform:rotate(-180deg) scale(.3)}',
    'html.dark .dss-theme-toggle{border-color:var(--border2)}',
    '',
    '/* ── Login page fixed toggle ── */',
    '.dss-theme-toggle.dss-toggle-fixed{position:fixed;top:18px;right:18px;z-index:9999}'
  ].join('\n');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── SVG icons ──
  var moonSVG = '<svg class="dss-icon-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var sunSVG = '<svg class="dss-icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

  // ── Apply theme ──
  var KEY = 'arcussoft-theme';
  function applyTheme(t) {
    document.documentElement.classList.toggle('dark', t === 'dark');
  }

  // Apply immediately (before paint if possible)
  var saved = localStorage.getItem(KEY);
  if (saved) {
    applyTheme(saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches) {
    applyTheme('dark');
  }

  // ── Create toggle button ──
  function createToggle() {
    var btn = document.createElement('button');
    btn.className = 'dss-theme-toggle';
    btn.title = 'Toggle dark mode';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.innerHTML = moonSVG + sunSVG;
    btn.addEventListener('click', function() {
      var isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem(KEY, isDark ? 'dark' : 'light');
    });
    return btn;
  }

  // ── Insert toggle into nav ──
  function insertToggle() {
    // Skip if already inserted
    if (document.querySelector('.dss-theme-toggle')) return;

    var toggle = createToggle();

    // Portal pages: .hdr-r
    var hdrR = document.querySelector('.hdr-r');
    if (hdrR) {
      hdrR.appendChild(toggle);
      return;
    }

    // Admin page: .hdr-nav
    var hdrNav = document.querySelector('.hdr-nav');
    if (hdrNav) {
      hdrNav.appendChild(toggle);
      return;
    }

    // Landing pages: .topnav .links
    var topnavLinks = document.querySelector('.topnav .links');
    if (topnavLinks) {
      topnavLinks.appendChild(toggle);
      return;
    }

    // Login page: fixed position
    toggle.classList.add('dss-toggle-fixed');
    document.body.appendChild(toggle);
  }

  // Insert when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertToggle);
  } else {
    insertToggle();
  }

  // Expose for manual calls
  window.toggleTheme = function() {
    var isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(KEY, isDark ? 'dark' : 'light');
  };

})();

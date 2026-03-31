/* ═══════════════════════════════════════════
   Decision OS — Authentication System
   Client-side auth for prototype/demo
   ═══════════════════════════════════════════ */

const DSLAuth = (() => {
  const SESSION_KEY = 'dsl_session';
  const USERS_KEY = 'dsl_users';
  const ACTIVITY_KEY = 'dsl_activity';

  // ── Default Users ──
  const DEFAULT_USERS = [
    { id: 'u001', email: 'sarah@arcussoft.com',    password: 'demo123', name: 'Sarah Chen',     role: 'CEO',  title: 'Chief Executive Officer',    avatar: 'SC', color: '#3b82f6', portals: ['ceo','cro','cfo','coo','cs','cto','cmo','cpo'], lastLogin: null, mfa: false },
    { id: 'u002', email: 'alex@arcussoft.com',     password: 'demo123', name: 'Alex Rivera',    role: 'CRO',  title: 'Chief Revenue Officer',      avatar: 'AR', color: '#16a34a', portals: ['ceo','cro','cfo','cs','cmo'],                lastLogin: null, mfa: false },
    { id: 'u003', email: 'david@arcussoft.com',    password: 'demo123', name: 'David Park',     role: 'CFO',  title: 'Chief Financial Officer',    avatar: 'DP', color: '#d97706', portals: ['ceo','cfo','coo','cro'],                      lastLogin: null, mfa: false },
    { id: 'u004', email: 'maria@arcussoft.com',    password: 'demo123', name: 'Maria Santos',   role: 'COO',  title: 'Chief Operating Officer',    avatar: 'MS', color: '#ea580c', portals: ['ceo','coo','cs','cto','cro'],                 lastLogin: null, mfa: false },
    { id: 'u005', email: 'priya@arcussoft.com',    password: 'demo123', name: 'Priya Sharma',   role: 'CS',   title: 'Head of Customer Success',   avatar: 'PS', color: '#dc2626', portals: ['ceo','cs','cro','cto'],                       lastLogin: null, mfa: false },
    { id: 'u006', email: 'james@arcussoft.com',    password: 'demo123', name: 'James Wu',       role: 'CTO',  title: 'Chief Technology Officer',   avatar: 'JW', color: '#7c3aed', portals: ['ceo','cto','coo','cfo','cpo'],                lastLogin: null, mfa: false },
    { id: 'u007', email: 'elena@arcussoft.com',    password: 'demo123', name: 'Elena Rossi',    role: 'CMO',  title: 'Chief Marketing Officer',    avatar: 'ER', color: '#0d9488', portals: ['ceo','cmo','cro','cfo'],                      lastLogin: null, mfa: false },
    { id: 'u008', email: 'tom@arcussoft.com',      password: 'demo123', name: 'Tom Nakamura',   role: 'CPO',  title: 'Chief Product Officer',      avatar: 'TN', color: '#e11d48', portals: ['ceo','cpo','cto','cs','cro'],                 lastLogin: null, mfa: false },
    { id: 'u009', email: 'admin@arcussoft.com',    password: 'admin123',name: 'System Admin',   role: 'ADMIN',title: 'System Administrator',       avatar: 'SA', color: '#1a1916', portals: ['ceo','cro','cfo','coo','cs','cto','cmo','cpo','admin'], lastLogin: null, mfa: false },
    { id: 'u010', email: 'demo@arcussoft.com',     password: 'demo',    name: 'Demo Viewer',    role: 'VIEWER',title: 'Read-Only Demo Account',   avatar: 'DV', color: '#a8a59e', portals: ['ceo','cro','cfo','coo','cs','cto','cmo','cpo'], lastLogin: null, mfa: false },
  ];

  // ── Initialize Users ──
  function initUsers() {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    }
  }

  function getUsers() {
    initUsers();
    return JSON.parse(localStorage.getItem(USERS_KEY));
  }

  function getUser(id) {
    return getUsers().find(u => u.id === id);
  }

  function getUserByEmail(email) {
    return getUsers().find(u => u.email === email);
  }

  function updateUser(id, data) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...data };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return users[idx];
    }
    return null;
  }

  // ── Session Management ──
  function login(email, password, remember = false) {
    const user = getUserByEmail(email);
    if (!user) return { success: false, error: 'Account not found. Check your email address.' };
    if (user.password !== password) return { success: false, error: 'Incorrect password. Try again.' };
    if (user.locked) return { success: false, error: 'Account is locked. Contact your administrator.' };

    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      title: user.title,
      avatar: user.avatar,
      color: user.color,
      portals: user.portals,
      loginTime: Date.now(),
      expiresAt: remember ? Date.now() + (30 * 24 * 60 * 60 * 1000) : Date.now() + (8 * 60 * 60 * 1000),
      remember: remember,
      sessionId: 'sess_' + Math.random().toString(36).substr(2, 12),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    updateUser(user.id, { lastLogin: new Date().toISOString() });
    logActivity(user.id, 'login', 'Session started');

    return { success: true, user: session };
  }

  function logout() {
    const session = getSession();
    if (session) logActivity(session.userId, 'logout', 'Session ended');
    localStorage.removeItem(SESSION_KEY);
  }

  function getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        logout();
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function isAuthenticated() {
    return getSession() !== null;
  }

  function requireAuth(redirectUrl) {
    if (!isAuthenticated()) {
      window.location.href = redirectUrl || 'login.html';
      return false;
    }
    return true;
  }

  // ── Role & Permission ──
  function hasPortalAccess(portal) {
    const session = getSession();
    if (!session) return false;
    if (session.role === 'ADMIN') return true;
    return session.portals.includes(portal);
  }

  function canEdit() {
    const session = getSession();
    return session && session.role !== 'VIEWER';
  }

  function isAdmin() {
    const session = getSession();
    return session && session.role === 'ADMIN';
  }

  function isViewer() {
    const session = getSession();
    return session && session.role === 'VIEWER';
  }

  function getAccessiblePortals() {
    const session = getSession();
    if (!session) return [];
    return session.portals;
  }

  // ── Activity Log ──
  function logActivity(userId, action, detail) {
    const log = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
    log.unshift({
      userId,
      action,
      detail,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1',
      ua: navigator.userAgent.substring(0, 80),
    });
    if (log.length > 200) log.length = 200;
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log));
  }

  function getActivity(userId) {
    const log = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
    return userId ? log.filter(l => l.userId === userId) : log;
  }

  // ── Password Management ──
  function changePassword(userId, oldPwd, newPwd) {
    const user = getUser(userId);
    if (!user) return { success: false, error: 'User not found.' };
    if (user.password !== oldPwd) return { success: false, error: 'Current password incorrect.' };
    if (newPwd.length < 6) return { success: false, error: 'New password must be at least 6 characters.' };
    updateUser(userId, { password: newPwd });
    logActivity(userId, 'password_change', 'Password updated');
    return { success: true };
  }

  function resetPassword(email) {
    const user = getUserByEmail(email);
    if (!user) return { success: false, error: 'No account with that email.' };
    // In production, this would send an email
    logActivity(user.id, 'password_reset_requested', 'Reset link sent');
    return { success: true, message: 'Password reset link sent to ' + email };
  }

  // ── User Management (Admin) ──
  function createUser(data) {
    const users = getUsers();
    if (users.find(u => u.email === data.email)) return { success: false, error: 'Email already exists.' };
    const newUser = {
      id: 'u' + String(users.length + 1).padStart(3, '0'),
      email: data.email,
      password: data.password || 'changeme123',
      name: data.name,
      role: data.role || 'VIEWER',
      title: data.title || '',
      avatar: (data.name || 'XX').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2),
      color: data.color || '#a8a59e',
      portals: data.portals || ['ceo'],
      lastLogin: null,
      mfa: false,
      locked: false,
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    logActivity('admin', 'user_created', `Created ${newUser.email}`);
    return { success: true, user: newUser };
  }

  function deleteUser(userId) {
    if (userId === 'u009') return { success: false, error: 'Cannot delete admin account.' };
    const users = getUsers().filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    logActivity('admin', 'user_deleted', `Deleted ${userId}`);
    return { success: true };
  }

  function lockUser(userId) {
    updateUser(userId, { locked: true });
    logActivity('admin', 'user_locked', `Locked ${userId}`);
    return { success: true };
  }

  function unlockUser(userId) {
    updateUser(userId, { locked: false });
    logActivity('admin', 'user_unlocked', `Unlocked ${userId}`);
    return { success: true };
  }

  // ── UI Helpers ──
  function renderUserBadge(container) {
    const session = getSession();
    if (!session) return;
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    el.innerHTML = `
      <div class="auth-badge" onclick="DSLAuth.toggleDropdown()">
        <div class="auth-avatar" style="background:${session.color}">${session.avatar}</div>
        <div class="auth-info">
          <div class="auth-name">${session.name}</div>
          <div class="auth-role">${session.role} · ${session.title}</div>
        </div>
        <div class="auth-chevron">▾</div>
      </div>
      <div class="auth-dropdown" id="auth-dropdown">
        <div class="auth-dd-header">
          <div class="auth-avatar-lg" style="background:${session.color}">${session.avatar}</div>
          <div>
            <div class="auth-dd-name">${session.name}</div>
            <div class="auth-dd-email">${session.email}</div>
          </div>
        </div>
        <div class="auth-dd-divider"></div>
        ${session.role === 'ADMIN' ? `
        <a class="auth-dd-item" href="admin.html">
          <span class="auth-dd-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span> Admin Panel
        </a>
        <a class="auth-dd-item" href="admin.html#users">
          <span class="auth-dd-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span> User Management
        </a>
        <a class="auth-dd-item" href="admin.html#activity">
          <span class="auth-dd-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></span> Activity Log
        </a>
        <div class="auth-dd-divider"></div>
        ` : ''}
        <div class="auth-dd-divider"></div>
        <a class="auth-dd-item" href="#" onclick="DSLAuth.showChangePasswordModal();return false;">
          <span class="auth-dd-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span> Change Password
        </a>
        <div class="auth-dd-divider"></div>
        <a class="auth-dd-item auth-dd-logout" href="#" onclick="DSLAuth.logout();window.location.href='login.html';return false;">
          <span class="auth-dd-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span> Sign Out
        </a>
      </div>
    `;
  }

  function renderPortalNav(container) {
    const session = getSession();
    if (!session) return;
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    const portalMap = {
      ceo: { name: 'CEO', file: 'dsl-ceo.html', color: '#3b82f6' },
      cro: { name: 'CRO', file: 'dsl-cro.html', color: '#16a34a' },
      cfo: { name: 'CFO', file: 'dsl-cfo.html', color: '#d97706' },
      coo: { name: 'COO', file: 'dsl-coo.html', color: '#ea580c' },
      cs:  { name: 'CS',  file: 'dsl-cs.html',  color: '#dc2626' },
      cto: { name: 'CTO', file: 'dsl-cto.html', color: '#7c3aed' },
      cmo: { name: 'CMO', file: 'dsl-cmo.html', color: '#0d9488' },
      cpo: { name: 'CPO', file: 'dsl-cpo.html', color: '#e11d48' },
    };

    const currentPage = window.location.pathname.split('/').pop();
    let html = '';

    for (const [key, portal] of Object.entries(portalMap)) {
      const accessible = session.portals.includes(key) || session.role === 'ADMIN';
      const isActive = currentPage === portal.file;
      if (accessible) {
        html += `<a href="${portal.file}" class="nav-portal${isActive ? ' active' : ''}" style="${isActive ? `color:${portal.color};border-bottom-color:${portal.color}` : ''}">${portal.name}</a>`;
      } else {
        html += `<span class="nav-portal nav-locked" title="No access"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> ${portal.name}</span>`;
      }
    }

    if (session.role === 'ADMIN') {
      const isAdminPage = currentPage === 'admin.html';
      html += `<a href="admin.html" class="nav-portal${isAdminPage ? ' active' : ''}" style="${isAdminPage ? 'color:#1a1916;border-bottom-color:#1a1916' : ''}">Admin</a>`;
    }

    el.innerHTML = html;
  }

  function toggleDropdown() {
    const dd = document.getElementById('auth-dropdown');
    if (dd) dd.classList.toggle('show');
  }

  // ── Inject Auth Guard ──
  function injectGuard(portalId) {
    if (!isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }
    if (portalId && !hasPortalAccess(portalId)) {
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f8f7f4;font-family:Inter,sans-serif">
          <div style="text-align:center;max-width:400px">
            <div style="font-size:48px;margin-bottom:16px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
            <h2 style="font-size:20px;font-weight:700;color:#1a1916;margin-bottom:8px">Access Restricted</h2>
            <p style="font-size:13px;color:#7a7770;margin-bottom:20px">Your account (<strong>${getSession().email}</strong>) does not have permission to access the ${portalId.toUpperCase()} Portal.</p>
            <a href="login.html" style="display:inline-block;padding:10px 24px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600">Return to Login</a>
          </div>
        </div>`;
      return;
    }
  }

  // ── Change Password Modal ──
  function showChangePasswordModal() {
    toggleDropdown();
    if (document.getElementById('dsl-chpwd-modal')) {
      document.getElementById('dsl-chpwd-modal').style.display = 'flex';
      return;
    }
    const overlay = document.createElement('div');
    overlay.id = 'dsl-chpwd-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.3);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:Inter,system-ui,sans-serif';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:32px;width:400px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.15)">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <div style="width:40px;height:40px;border-radius:10px;background:#dbeafe;display:flex;align-items:center;justify-content:center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
          <div><div style="font-size:16px;font-weight:700;color:#1a1916">Change Password</div><div style="font-size:11px;color:#7a7770">${getSession().email}</div></div>
        </div>
        <div style="margin-bottom:14px"><label style="display:block;font-size:10px;font-weight:600;color:#3d3b36;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em">Current Password</label><input type="password" id="dsl-chpwd-old" style="width:100%;padding:9px 12px;border:1px solid #e4e2dc;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e4e2dc'"></div>
        <div style="margin-bottom:14px"><label style="display:block;font-size:10px;font-weight:600;color:#3d3b36;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em">New Password</label><input type="password" id="dsl-chpwd-new" style="width:100%;padding:9px 12px;border:1px solid #e4e2dc;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e4e2dc'"><div style="font-size:9px;color:#7a7770;margin-top:4px">Minimum 6 characters</div></div>
        <div style="margin-bottom:18px"><label style="display:block;font-size:10px;font-weight:600;color:#3d3b36;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em">Confirm New Password</label><input type="password" id="dsl-chpwd-confirm" style="width:100%;padding:9px 12px;border:1px solid #e4e2dc;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#e4e2dc'"></div>
        <div id="dsl-chpwd-error" style="display:none;padding:8px 12px;background:#fee2e2;border-radius:8px;font-size:11px;color:#b91c1c;margin-bottom:14px"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="DSLAuth.hideChangePasswordModal()" style="padding:8px 16px;border-radius:8px;font-size:11px;font-weight:600;border:1px solid #e4e2dc;background:#fff;color:#3d3b36;cursor:pointer;font-family:inherit">Cancel</button>
          <button onclick="DSLAuth.submitChangePassword()" style="padding:8px 20px;border-radius:8px;font-size:11px;font-weight:600;border:none;background:#3b82f6;color:#fff;cursor:pointer;font-family:inherit">Update Password</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('dsl-chpwd-old').focus();
  }

  function hideChangePasswordModal() {
    const m = document.getElementById('dsl-chpwd-modal');
    if (m) m.style.display = 'none';
    document.getElementById('dsl-chpwd-old').value = '';
    document.getElementById('dsl-chpwd-new').value = '';
    document.getElementById('dsl-chpwd-confirm').value = '';
    const err = document.getElementById('dsl-chpwd-error');
    if (err) { err.style.display = 'none'; err.textContent = ''; }
  }

  function submitChangePassword() {
    const oldPwd = document.getElementById('dsl-chpwd-old').value;
    const newPwd = document.getElementById('dsl-chpwd-new').value;
    const confirm = document.getElementById('dsl-chpwd-confirm').value;
    const errEl = document.getElementById('dsl-chpwd-error');

    if (!oldPwd || !newPwd || !confirm) {
      errEl.textContent = 'All fields are required.';
      errEl.style.display = 'block';
      return;
    }
    if (newPwd.length < 6) {
      errEl.textContent = 'New password must be at least 6 characters.';
      errEl.style.display = 'block';
      return;
    }
    if (newPwd !== confirm) {
      errEl.textContent = 'New passwords do not match.';
      errEl.style.display = 'block';
      return;
    }

    const session = getSession();
    const result = changePassword(session.userId, oldPwd, newPwd);
    if (!result.success) {
      errEl.textContent = result.error;
      errEl.style.display = 'block';
      return;
    }

    hideChangePasswordModal();
    showToast('success', 'Password updated successfully.');
  }

  // ── Toast (fallback if page doesn't define one) ──
  if (typeof showToast === 'undefined') {
    window.showToast = function(type, msg) {
      document.querySelectorAll('.dsl-toast').forEach(t => t.remove());
      const t = document.createElement('div');
      t.className = 'dsl-toast';
      const bg = type === 'success' ? '#16a34a' : '#dc2626';
      t.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;padding:10px 18px;border-radius:10px;font-size:12px;font-weight:600;color:#fff;font-family:Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.15);display:flex;align-items:center;gap:6px;background:' + bg;
      const icon = type === 'success'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      t.innerHTML = icon + ' ' + msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);
    };
  }

  // ── Public API ──
  return {
    initUsers, getUsers, getUser, getUserByEmail, updateUser,
    login, logout, getSession, isAuthenticated, requireAuth,
    hasPortalAccess, canEdit, isAdmin, isViewer, getAccessiblePortals,
    logActivity, getActivity,
    changePassword, resetPassword,
    createUser, deleteUser, lockUser, unlockUser,
    renderUserBadge, renderPortalNav, toggleDropdown,
    injectGuard,
    showChangePasswordModal, hideChangePasswordModal, submitChangePassword,
  };
})();

// Auto-init users on load
DSLAuth.initUsers();

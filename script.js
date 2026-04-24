// 🛡️ SECURITY: API Keys should be stored in a Backend Proxy (e.g., Cloudflare Workers)
// Leave these EMPTY when pushing to GitHub. 
// Once you deploy your proxy, paste the URL below.
const AI_PROXY_URL = 'https://aiproxy.shekharphi785.workers.dev';
// const GROQ_API_KEY = '';
// const GITHUB_TOKEN = '';
// const OPENAI_API_KEY = '';
// const DEEPSEEK_API_KEY = '';

// ───────────────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const ESC_SHEET = 'https://hook.eu1.make.com/poqodcqm5h3khmskhvwga9ylh82n9pfj';
const PROD_SHEET = 'https://script.google.com/macros/s/AKfycbw-fm5b_bjvFD8FR2-sHCRNTW-mxqYFSCVTf326u6e2TMc-ewN1Bhn3D-hj2_HgllIcog/exec';
const CASE_SHEET = 'https://script.google.com/macros/s/AKfycby50lm964MC3UKXDdDORr1pS93pdmGtqB5-NQEstVR6iYQHGErjzps55QRLEMGeUObSMA/exec';
const CALLBACK_SHEET = 'https://script.google.com/macros/s/AKfycbyWsISnlU3TzYKgxOSoB8gpVznTlbSHYJLNYTbXWcI_DfJ63jjlGegTjfli_NbxoKyaoQ/exec';
const NOTI_SHEET = 'https://script.google.com/macros/s/AKfycbyydNFlWyHVyr-3DlxwKFHUGrkBahC0r5oGWFshmRYu1ByDrqXJPkfAxokte6Wc0IjWLA/exec'; // Replace with the App Script URL you deploy

const PROXY = 'https://airtable-proxy.shekharphi785.workers.dev';
const AT_BASE = 'appSaGKLSDYFngrJi';
const AT_CONFIG_TABLE = 'tbluq1UYtX3iL7XU3';
const AT_USERS_TABLE = 'tblwVLCPAmuOUUbIi';
const AT_RESTR_TABLE = 'tblKF8PT1ni9XHaoE';

const AT_URL_CONFIG = `${PROXY}/v0/${AT_BASE}/${AT_CONFIG_TABLE}`;
const AT_URL_USERS = `${PROXY}/v0/${AT_BASE}/${AT_USERS_TABLE}`;
const AT_URL_RESTR = `${PROXY}/v0/${AT_BASE}/${AT_RESTR_TABLE}`;

const atHeaders = () => ({ 'Content-Type': 'application/json' });

let ADMIN_UNLOCKED = false, _cloudPin = '', _cloudEmps = [], _allUsers = [], _restrictedEmps = [], _configRecordId = null, _configLoaded = false;
let SESSION = { name: '', empId: '' };

const svgSun = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
const svgMoon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

const updateThemeIcon = (isLight) => {
  $('theme-icon').innerHTML = isLight ? svgMoon : svgSun;
};

const toggleMode = () => {
  const isLight = document.body.getAttribute('data-mode') === 'light';
  const newMode = isLight ? 'dark' : 'light';
  document.body.setAttribute('data-mode', newMode);
  localStorage.setItem('philips_mode', newMode);
  updateThemeIcon(!isLight);
};

const setTheme = (theme) => {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('philips_theme', theme);
  $('user-dropdown').classList.remove('open');
};

const initTheme = () => {
  const savedTheme = localStorage.getItem('philips_theme') || 'default';
  const savedMode = localStorage.getItem('philips_mode') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  document.body.setAttribute('data-mode', savedMode);
  updateThemeIcon(savedMode === 'light');
};

const toggleUserMenu = (e) => {
  if (e) e.stopPropagation();
  $('user-dropdown').classList.toggle('open');
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('#noti-wrapper')) {
    const n = $('noti-dropdown');
    if (n && n.classList.contains('open')) n.classList.remove('open');
  }
  if (!e.target.closest('.user-dropdown-wrapper:not(#noti-wrapper)')) {
    const d = $('user-dropdown');
    if (d && d.classList.contains('open')) d.classList.remove('open');
  }
});

const loadSession = () => { const s = localStorage.getItem('philips_session'); if (s) try { SESSION = JSON.parse(s); } catch (e) { } };
const saveSession = () => localStorage.setItem('philips_session', JSON.stringify(SESSION));
const clearSession = () => { SESSION = { name: '', empId: '' }; localStorage.removeItem('philips_session'); };

const loadCloudConfig = async () => {
  try {
    const [configData, usersData, restrData] = await Promise.all([
      fetch(`${AT_URL_CONFIG}?maxRecords=1`, { headers: atHeaders() }).then(r => r.json()),
      fetch(`${AT_URL_USERS}?maxRecords=100`, { headers: atHeaders() }).then(r => r.json()),
      fetch(`${AT_URL_RESTR}?maxRecords=100`, { headers: atHeaders() }).then(r => r.json())
    ]);

    console.log('Airtable Config:', configData);
    console.log('Airtable Users:', usersData);

    if (configData.records?.length) {
      const rec = configData.records[0];
      _configRecordId = rec.id;
      if (rec.fields.Pin) _cloudPin = String(rec.fields.Pin).trim();
      if (rec.fields.Emp) _cloudEmps = String(rec.fields.Emp).split(',').filter(Boolean).map(id => ({ id: id.trim(), name: '' }));
    }
    if (usersData.records) _allUsers = usersData.records.map(r => ({ empId: (r.fields.empId || '').trim(), name: (r.fields.name || '').trim(), recordId: r.id })).filter(u => u.empId);
    if (restrData.records) _restrictedEmps = restrData.records.map(r => ({ empId: (r.fields.empId || '').trim(), recordId: r.id })).filter(u => u.empId);

    console.log('Processed Users:', _allUsers);
    _configLoaded = true;
    if (SESSION.empId) applySession();
  } catch (err) {
    console.warn('Airtable load failed:', err);
    _configLoaded = true;
  }
};

const pToast = (msg, type = 'ok') => {
  const t = $('esc-toast');
  const m = $('esc-toast-msg');
  const i = $('esc-toast-icon');
  if (!t || !m) return;
  m.textContent = msg;
  i.textContent = type === 'ok' ? '✅' : '❌';
  t.style.background = type === 'ok' ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)';
  t.style.color = type === 'ok' ? '#34d399' : '#ef4444';
  t.style.borderColor = type === 'ok' ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
};

const isAllowedUser = empId => {
  const id = empId.toLowerCase();
  return isAdminUser(empId) || _allUsers.some(u => u.empId.toLowerCase() === id);
};
const isRestrictedAllowed = empId => {
  const id = empId.toLowerCase();
  return _restrictedEmps.some(u => u.empId.toLowerCase() === id);
};
const isAdminUser = empId => {
  const id = empId.toLowerCase();
  return _cloudEmps.some(e => e.id.toLowerCase() === id);
};

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadCloudConfig();
  loadSession();
  if (SESSION.name && SESSION.empId) {
    applySession();
    switchToDashboard();
  }
  const today = new Date().toISOString().split('T')[0];
  $('esc-caseDate').value = today;
  $('prod-date').value = today;

  setInterval(pollNotifications, 10000); // Polling every 10 seconds to avoid hitting Google limits
  renderNotifications();
});



const doLogin = () => {
  const nameEl = $('inp-name');
  const empEl = $('inp-emp');
  if (!nameEl || !empEl) return console.error('Login inputs not found');

  const name = nameEl.value.trim();
  const emp = empEl.value.trim().toUpperCase();

  console.log(`Login Attempt: Name="${name}", ID="${emp}"`);

  if (!name) return pToast('Please enter your full name', 'err');
  if (!emp) return pToast('Please enter your Employee ID', 'err');

  if (!_configLoaded) {
    console.warn('Login attempted before config loaded');
    return pToast('Database still loading, please wait a moment…', 'err');
  }

  if (!isAllowedUser(emp)) {
    console.error(`Login failed for ID: ${emp}. Not found in allowed users list. Current List:`, _allUsers);
    return pToast(`Access Denied: ID "${emp}" is not authorized.`, 'err');
  }

  SESSION = { name, empId: emp };
  saveSession();
  applySession();
  switchToDashboard();
  pToast(`Welcome, ${name}!`, 'ok');
};

const doLogout = () => {
  clearSession();
  const pDash = $('page-dashboard');
  const pLogin = $('page-login');
  if (pDash) pDash.classList.remove('active');
  if (pLogin) pLogin.classList.add('active');

  const inName = $('inp-name');
  const inEmp = $('inp-emp');
  if (inName) inName.value = '';
  if (inEmp) inEmp.value = '';

  showPanel('escalation');
  const uDrop = $('user-dropdown');
  if (uDrop) uDrop.classList.remove('open');

  chatHistory = [];
};

const esc = str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const applySession = () => {
  if (!SESSION.name || !SESSION.empId) return;
  $('dash-name').textContent = SESSION.name;
  $('dash-emp').textContent = SESSION.empId;
  $('dash-avatar').textContent = (SESSION.name || 'U').charAt(0).toUpperCase();
  $$('.auto-name-txt').forEach(el => el.textContent = SESSION.name);
  $$('.auto-emp-txt').forEach(el => el.textContent = SESSION.empId);
  $$('.auto-name').forEach(el => el.value = SESSION.name);
  $$('.auto-emp').forEach(el => el.value = SESSION.empId);
  const adminBtn = $('topbar-admin-btn');
  if (adminBtn) adminBtn.style.display = isAdminUser(SESSION.empId) ? 'block' : 'none';

  // Also update chatbot greeting
  const greet = $('chatbot-greet-name');
  if (greet) greet.textContent = SESSION.name.split(' ')[0];
};

const switchToDashboard = () => {
  $('page-login').classList.remove('active');
  $('page-dashboard').classList.add('active');
  // Initialize chat when switching to dashboard if needed
  setTimeout(restoreChatUI, 100);
};

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && $('page-login').classList.contains('active')) doLogin();
});

const showPanel = id => {
  if (['productivity', 'cases'].includes(id) && SESSION.empId && !isRestrictedAllowed(SESSION.empId))
    return pToast('Access restricted. Contact your admin.', 'err');
  if (id === 'admin' && SESSION.empId && !isAdminUser(SESSION.empId))
    return pToast('Admin access denied.', 'err');

  ['escalation', 'productivity', 'cases', 'callback', 'websites', 'help', 'admin'].forEach(p => {
    const pnl = $('panel-' + p);
    if (pnl) pnl.classList.remove('active');
    const navEl = $('nav-' + p);
    if (navEl) navEl.classList.remove('active');
  });

  const activePnl = $('panel-' + id);
  if (activePnl) activePnl.classList.add('active');
  const navActive = $('nav-' + id);
  if (navActive) navActive.classList.add('active');

  if (id === 'help') {
    setTimeout(restoreChatUI, 50);
    const msgs = $('chatbot-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }
};

$('escalationForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('escSubmitBtn');
  btn.textContent = 'Submitting…';
  btn.style.opacity = '0.7';
  btn.disabled = true;

  const caseTypeEl = document.querySelector('input[name="caseType"]:checked');
  const payload = {
    agentName: SESSION.name,
    employeeId: SESSION.empId,
    caseNumber: $('esc-caseNumber').value,
    workshop: $('esc-workshop').value,
    caseDate: $('esc-caseDate').value,
    escalationReason: $('esc-escalationReason').value,
    agentRemarks: $('esc-agentRemarks').value,
    caseType: caseTypeEl ? caseTypeEl.value : '',
    submittedAt: new Date().toLocaleString()
  };

  fetch(ESC_SHEET, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

  escToast('✅', 'Escalation submitted successfully!');
  resetEscalation();
  btn.textContent = 'Submit Escalation';
  btn.style.opacity = '1';
  btn.disabled = false;
});

const resetEscalation = () => {
  $('escalationForm').reset();
  $('esc-caseDate').value = new Date().toISOString().split('T')[0];
};

const submitProductivity = async () => {
  const origin = document.querySelector('input[name="prodOrigin"]:checked');
  const caseNo = $('prod-case').value.trim();
  const dateVal = $('prod-date').value;
  const emailV = $('prod-email-addr').value.trim();

  if (!origin) return pToast('Select an origin', 'err');
  if (!caseNo) return pToast('Enter a case number', 'err');
  if (!emailV) return pToast('Enter an email address', 'err');

  const btn = $('prodSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="f-spinner"></span>Submitting…';

  const payload = { name: SESSION.name, empId: SESSION.empId, origin: origin.value, caseNumber: caseNo, date: dateVal, email: emailV, timestamp: new Date().toISOString() };
  fetch(PROD_SHEET, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

  pToast('Entry submitted successfully!', 'ok');
  $('prod-case').value = '';
  $('prod-email-addr').value = '';
  $$('input[name="prodOrigin"]').forEach(r => r.checked = false);
  btn.disabled = false;
  btn.innerHTML = 'Submit Entry &nbsp;→';
};

let caseEntries = [];
const submitCase = async () => {
  const caseId = $('case-id').value.trim();
  const origin = $('case-origin').value;

  if (!caseId) return pToast('Enter a Case ID', 'err');
  if (!origin) return pToast('Select an origin', 'err');

  const btn = $('caseSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="f-spinner"></span>Submitting…';

  const entry = { name: SESSION.name, empId: SESSION.empId, caseId, origin, timestamp: new Date().toLocaleString('en-IN') };
  fetch(CASE_SHEET, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });

  caseEntries.push(entry);
  renderCaseTable();
  pToast('✅ Case submitted and logged!', 'ok');
  $('case-id').value = '';
  $('case-origin').value = '';
  btn.disabled = false;
  btn.innerHTML = 'Submit Case &nbsp;→';
};

/* Callback Submission */
$('callbackForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('cbSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="f-spinner"></span>Submitting…';

  const payload = {
    agentName: SESSION.name,
    empId: SESSION.empId,
    consumerContact: $('cb-contact').value.trim(),
    referenceCase: $('cb-case').value.trim(),
    callBackReason: $('cb-reason').value.trim(),
    callBackTime: $('cb-time').value,
    preferredTime: $('cb-pref-time').value,
    timestamp: new Date().toLocaleString('en-IN')
  };

  fetch(CALLBACK_SHEET, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

  // Assume success immediately (bypassing Google's redirect rejection)
  pToast('✅ Callback request submitted!', 'ok');
  $('callbackForm').reset();
  btn.disabled = false;
  btn.innerHTML = 'Submit Request &nbsp;→';
});

const switchAdminTab = tab => {
  ['admins', 'users', 'restricted', 'noti'].forEach(t => {
    if ($(`tab-${t}`)) $(`tab-${t}`).style.display = 'none';
    if ($(`tab-btn-${t}`)) $(`tab-btn-${t}`).classList.remove('active');
  });
  if ($(`tab-${tab}`)) $(`tab-${tab}`).style.display = 'block';
  if ($(`tab-btn-${tab}`)) $(`tab-btn-${tab}`).classList.add('active');
};

const verifyAdminPin = () => {
  if ($('admin-pin-input').value === _cloudPin) {
    ADMIN_UNLOCKED = true;
    $('admin-gate').style.display = 'none';
    $('admin-dashboard').style.display = 'block';
    renderEmpList(); renderUsersList(); renderRestrictedList();
    pToast('Admin unlocked', 'ok');
  } else {
    pToast('Incorrect PIN', 'err');
    $('admin-pin-input').value = '';
  }
};

const changeAdminPin = () => {
  const np = $('new-pin').value.trim();
  const cp = $('confirm-pin').value.trim();
  if (!np) return pToast('Enter a new PIN', 'err');
  if (np !== cp) return pToast('PINs do not match', 'err');
  _cloudPin = np;
  if (_configRecordId) {
    fetch(`${AT_URL_CONFIG}/${_configRecordId}`, { method: 'PATCH', headers: atHeaders(), body: JSON.stringify({ fields: { Pin: np } }) })
      .then(() => pToast('PIN updated & synced ✓', 'ok'))
      .catch(() => pToast('PIN changed locally but sync failed', 'err'));
  }
  $('new-pin').value = ''; $('confirm-pin').value = '';
};

const saveAdminEmpsToAirtable = () => {
  if (!_configRecordId) return;
  fetch(`${AT_URL_CONFIG}/${_configRecordId}`, { method: 'PATCH', headers: atHeaders(), body: JSON.stringify({ fields: { Emp: _cloudEmps.map(e => e.id).join(',') } }) })
    .catch(err => console.warn('Admin emp sync failed:', err));
};

const addAuthorizedEmp = () => {
  const id = $('new-admin-id').value.trim().toUpperCase();
  const name = $('new-admin-name').value.trim();
  if (!id) return pToast('Enter an Employee ID', 'err');
  if (_cloudEmps.some(e => e.id.toLowerCase() === id.toLowerCase())) return pToast('Already in admin list', 'err');

  _cloudEmps.push({ id, name: name || '' });
  saveAdminEmpsToAirtable();
  $('new-admin-id').value = ''; $('new-admin-name').value = '';
  renderEmpList(); pToast('Admin added & synced ✓', 'ok');
};

const removeAuthorizedEmp = id => {
  _cloudEmps = _cloudEmps.filter(e => e.id !== id);
  saveAdminEmpsToAirtable();
  renderEmpList(); pToast('Admin removed & synced ✓', 'ok');
};

const clearAllEmps = () => {
  if (!confirm('Remove all admin Employee IDs?')) return;
  _cloudEmps = []; saveAdminEmpsToAirtable(); renderEmpList(); pToast('All admins cleared & synced ✓', 'ok');
};

const renderEmpList = () => {
  $('emp-count').textContent = _cloudEmps.length;
  if (!_cloudEmps.length) return $('emp-list').innerHTML = '<div class="admin-empty">No admin employees yet.</div>';
  $('emp-list').innerHTML = _cloudEmps.map(e => `<div class="admin-emp-row"><div class="admin-emp-info"><div class="admin-emp-id">${e.id}</div>${e.name ? `<div class="admin-emp-name">${e.name}</div>` : ''}</div><button class="admin-remove-btn" data-action="remove-admin" data-id="${e.id}">Remove</button></div>`).join('');
};

const addPortalUser = () => {
  const id = $('new-user-id').value.trim().toUpperCase();
  const name = $('new-user-name').value.trim();
  if (!id) return pToast('Enter an Employee ID', 'err');
  if (!name) return pToast('Enter a name', 'err');
  if (_allUsers.some(u => u.empId.toLowerCase() === id.toLowerCase())) return pToast('Already in portal users', 'err');

  fetch(AT_URL_USERS, { method: 'POST', headers: atHeaders(), body: JSON.stringify({ fields: { empId: id, name } }) })
    .then(r => r.json()).then(rec => {
      _allUsers.push({ empId: id, name, recordId: rec.id });
      $('new-user-id').value = ''; $('new-user-name').value = '';
      renderUsersList(); pToast('Portal user added & synced ✓', 'ok');
    }).catch(() => pToast('Failed to add user', 'err'));
};

const removePortalUser = id => {
  fetch(`${AT_URL_USERS}/${id}`, { method: 'DELETE', headers: atHeaders() }).then(() => {
    _allUsers = _allUsers.filter(u => u.recordId !== id);
    renderUsersList(); pToast('Portal user removed & synced ✓', 'ok');
  }).catch(() => pToast('Failed to remove user', 'err'));
};

const renderUsersList = () => {
  $('users-count').textContent = _allUsers.length;
  if (!_allUsers.length) return $('users-list').innerHTML = '<div class="admin-empty">No portal users yet.</div>';
  $('users-list').innerHTML = _allUsers.map(u => `<div class="admin-emp-row"><div class="admin-emp-info"><div class="admin-emp-id">${u.empId}</div>${u.name ? `<div class="admin-emp-name">${u.name}</div>` : ''}</div><button class="admin-remove-btn" data-action="remove-user" data-id="${u.recordId}">Remove</button></div>`).join('');
};

const addRestrictedUser = () => {
  const id = $('new-restr-id').value.trim().toUpperCase();
  if (!id) return pToast('Enter an Employee ID', 'err');
  if (_restrictedEmps.some(u => u.empId.toLowerCase() === id.toLowerCase())) return pToast('Already in restricted users', 'err');

  fetch(AT_URL_RESTR, { method: 'POST', headers: atHeaders(), body: JSON.stringify({ fields: { empId: id } }) })
    .then(r => r.json()).then(rec => {
      _restrictedEmps.push({ empId: id, recordId: rec.id });
      $('new-restr-id').value = ''; renderRestrictedList(); pToast('Restricted user added & synced ✓', 'ok');
    }).catch(() => pToast('Failed to add restricted user', 'err'));
};

const removeRestrictedUser = id => {
  fetch(`${AT_URL_RESTR}/${id}`, { method: 'DELETE', headers: atHeaders() }).then(() => {
    _restrictedEmps = _restrictedEmps.filter(u => u.recordId !== id);
    renderRestrictedList(); pToast('Restricted user removed & synced ✓', 'ok');
  }).catch(() => pToast('Failed to remove user', 'err'));
};

const renderRestrictedList = () => {
  $('restr-count').textContent = _restrictedEmps.length;
  if (!_restrictedEmps.length) return $('restr-list').innerHTML = '<div class="admin-empty">No restricted users yet.</div>';
  $('restr-list').innerHTML = _restrictedEmps.map(u => `<div class="admin-emp-row"><div class="admin-emp-info"><div class="admin-emp-id">${u.empId}</div></div><button class="admin-remove-btn" data-action="remove-restr" data-id="${u.recordId}">Remove</button></div>`).join('');
};

const lockAdmin = () => {
  ADMIN_UNLOCKED = false;
  $('admin-gate').style.display = 'block';
  $('admin-dashboard').style.display = 'none';
  $('admin-pin-input').value = '';
  pToast('Admin locked', 'ok');
};

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && $('panel-admin')?.classList.contains('active') && !ADMIN_UNLOCKED) verifyAdminPin();
});

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'remove-admin') removeAuthorizedEmp(id);
  if (action === 'remove-user') removePortalUser(id);
  if (action === 'remove-restr') removeRestrictedUser(id);
  if (action === 'delete-noti') deleteNotification(id);
});

/* Notification System */
const toggleNotiMenu = (e) => {
  if (e) e.stopPropagation();
  $('noti-dropdown').classList.toggle('open');
  $('user-dropdown').classList.remove('open'); // close user menu if open
  markNotificationsRead();
};

let _lastNotiCount = -1;
const pollNotifications = async () => {
  if (!SESSION.empId) return;

  // If no URL is set, fallback to local storage
  if (!NOTI_SHEET.startsWith('http')) {
    const localNotis = JSON.parse(localStorage.getItem('philips_notifications') || '[]');
    if (localNotis.length !== _lastNotiCount) {
      _lastNotiCount = localNotis.length;
      renderNotifications();
    }
    return;
  }

  try {
    // Fetch from Google Sheet
    const res = await fetch(NOTI_SHEET);
    const notis = await res.json();

    localStorage.setItem('philips_notifications', JSON.stringify(notis));
    if (notis.length !== _lastNotiCount) {
      _lastNotiCount = notis.length;
      renderNotifications();
    }
  } catch (err) {
    console.warn('Failed to poll notifications', err);
  }
};

const pushNotification = async () => {
  const msg = $('new-noti-msg').value.trim();
  if (!msg) return pToast('Enter a notification message', 'err');

  const newNoti = {
    id: Date.now().toString(),
    msg: msg,
    sender: SESSION.name,
    time: new Date().toLocaleString('en-IN')
  };

  // Fallback to local storage if no URL
  if (!NOTI_SHEET.startsWith('http')) {
    const notis = JSON.parse(localStorage.getItem('philips_notifications') || '[]');
    notis.unshift(newNoti);
    localStorage.setItem('philips_notifications', JSON.stringify(notis));
    $('new-noti-msg').value = '';
    pToast('Notification pushed locally', 'ok');
    renderNotifications();
    return;
  }

  const btn = document.querySelector('#tab-noti .f-btn');
  const origText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="f-spinner"></span>Updating…';

  try {
    // Send to Google Sheet
    await fetch(NOTI_SHEET, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNoti)
    });

    $('new-noti-msg').value = '';
    pToast('Notification pushed to all users!', 'ok');
    // Optimistically update local array
    const notis = JSON.parse(localStorage.getItem('philips_notifications') || '[]');
    notis.unshift(newNoti);
    localStorage.setItem('philips_notifications', JSON.stringify(notis));
    renderNotifications();
  } catch (e) {
    pToast('Failed to push notification', 'err');
  }

  btn.disabled = false;
  btn.innerHTML = origText;
};

const renderNotifications = () => {
  const notis = JSON.parse(localStorage.getItem('philips_notifications') || '[]');
  const readState = JSON.parse(localStorage.getItem('philips_noti_read_' + SESSION.empId) || '[]');

  // Check for unread
  const unreadCount = notis.filter(n => !readState.includes(n.id)).length;
  const badge = $('noti-badge');
  if (badge) {
    if (unreadCount > 0) {
      badge.style.display = 'flex';
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    } else {
      badge.style.display = 'none';
    }
  }

  // Render dropdown list
  const list = $('noti-list');
  if (list) {
    if (!notis.length) {
      list.innerHTML = '<div style="padding:16px;text-align:center;font-size:0.8rem;color:var(--text-muted)">No new notifications</div>';
    } else {
      list.innerHTML = notis.map(n => `
        <div class="noti-item" style="padding:12px 16px;border-bottom:1px solid var(--border-light);background:${readState.includes(n.id) ? 'transparent' : 'var(--icon-bg)'}">
          <div style="font-size:0.8rem;color:var(--text-main);margin-bottom:4px;line-height:1.3">${esc(n.msg)}</div>
          <div style="font-size:0.65rem;color:var(--text-muted);display:flex;justify-content:space-between">
            <span>By ${esc(n.sender)}</span>
            <span>${n.time}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Render admin list if admin panel is open
  const adminList = $('admin-noti-list');
  if (adminList && isAdminUser(SESSION.empId)) {
    if (!notis.length) {
      adminList.innerHTML = '<div class="admin-empty">No notifications sent yet.</div>';
    } else {
      adminList.innerHTML = notis.map(n => `
        <div class="admin-emp-row" style="align-items:flex-start">
          <div class="admin-emp-info" style="flex:1;padding-right:10px">
            <div style="font-size:0.82rem;color:var(--text-main);line-height:1.4;margin-bottom:4px">${esc(n.msg)}</div>
            <div style="font-size:0.65rem;color:var(--text-muted)">Sent by ${esc(n.sender)} on ${n.time}</div>
          </div>
          <button class="admin-remove-btn" data-action="delete-noti" data-id="${n.id}" style="flex-shrink:0">Delete</button>
        </div>
      `).join('');
    }
  }
};

const markNotificationsRead = () => {
  if (!SESSION.empId) return;
  const notis = JSON.parse(localStorage.getItem('philips_notifications') || '[]');
  const ids = notis.map(n => n.id);
  localStorage.setItem('philips_noti_read_' + SESSION.empId, JSON.stringify(ids));
  renderNotifications();
};

const clearNotifications = () => {
  if (!confirm('Clear all notifications?')) return;
  localStorage.setItem('philips_notifications', '[]');
  renderNotifications();
};

const deleteNotification = async (id) => {
  if (!confirm('Delete this notification for everyone?')) return;

  // Optimistically remove locally
  let notis = JSON.parse(localStorage.getItem('philips_notifications') || '[]');
  notis = notis.filter(n => n.id !== id);
  localStorage.setItem('philips_notifications', JSON.stringify(notis));
  renderNotifications();

  // If Google Sheet is set, send delete request
  if (NOTI_SHEET.startsWith('http')) {
    try {
      await fetch(NOTI_SHEET, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: id })
      });
    } catch (e) { }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHATBOT — Gemini-powered Philips Support AI
// ═══════════════════════════════════════════════════════════════════════════════

const CHAT_SYSTEM_PROMPT = `You are a helpful, professional AI assistant. You help users with any tasks they ask — writing emails, summarizing information, answering questions, drafting messages, explaining concepts, or general productivity tasks. Keep your answers clear, concise, and friendly.

You are currently assisting {{AGENT_NAME}} (ID: {{AGENT_ID}}).`;

const CHAT_LS_KEY = 'philips_chat_history';
const CHAT_MODEL_KEY = 'philips_chat_model';

// Load persisted history and model
const savedHistory = localStorage.getItem(CHAT_LS_KEY);
const savedModel = localStorage.getItem(CHAT_MODEL_KEY);
let chatHistory = savedHistory ? JSON.parse(savedHistory) : [];
let chatOpen = false;
let isChatLoading = false;

// Save selected model to LocalStorage
const updateSelectedModel = () => {
  const model = $('chatbot-model-select').value;
  localStorage.setItem(CHAT_MODEL_KEY, model);
};

// Re-render any previously saved messages into the UI
const restoreChatUI = () => {
  // Restore model selection
  if (savedModel) {
    const sel = $('chatbot-model-select');
    if (sel) sel.value = savedModel;
  }

  if (!chatHistory.length) return;
  const msgs = $('chatbot-messages');
  // Hide the welcome banner if there are messages
  const welcome = msgs.querySelector('.chatbot-welcome');
  if (welcome) welcome.style.display = 'none';
  chatHistory.forEach(({ role, content }) => {
    if (role === 'user' || role === 'assistant') {
      appendChatMessage(role === 'assistant' ? 'bot' : 'user', content);
    }
  });
};




const clearChatHistory = () => {
  if (!confirm('Clear all chat history?')) return;
  chatHistory = [];
  localStorage.removeItem(CHAT_LS_KEY);
  // Restore initial UI
  const msgs = $('chatbot-messages');
  msgs.innerHTML = `
    <div class="chatbot-welcome">
      <div class="chatbot-welcome-icon" style="margin-bottom: 15px;">
        <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 5px;">How can I help you, <span id="chatbot-greet-name">${SESSION.name ? SESSION.name.split(' ')[0] : 'Agent'}</span>?</h3>
    </div>
  `;
};

const sendChatMessage = async () => {
  if (isChatLoading) return;
  const input = $('chatbot-input');
  const userMsg = input.value.trim();
  if (!userMsg) return;

  // Identify selected model and provider
  const fullModelValue = $('chatbot-model-select').value; // e.g. "groq:model" or "github:model"
  const [provider, modelId] = fullModelValue.split(':');




  // Add user message to UI and history
  appendChatMessage('user', userMsg);
  chatHistory.push({ role: 'user', content: userMsg });
  input.value = '';
  input.style.height = 'auto';

  // Show typing indicator
  const typingId = showTypingIndicator();
  isChatLoading = true;
  $('chatbot-send-btn').disabled = true;

  try {
    const systemPrompt = CHAT_SYSTEM_PROMPT
      .replace('{{AGENT_NAME}}', SESSION.name || 'Agent')
      .replace('{{AGENT_ID}}', SESSION.empId || 'Unknown');

    // 🌐 UNIFIED PROXY FETCH
    // If AI_PROXY_URL is set, we use it to hide our keys.
    // If not, it will fall back to direct calls (for local testing ONLY)
    let res;
    if (AI_PROXY_URL) {
      res = await fetch(AI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider, // 'groq' or 'github'
          model: modelId,
          messages: [{ role: 'system', content: systemPrompt }, ...chatHistory]
        })
      });
    } else {
      // ⚠️ FALLBACK: Direct call (Keys must be hardcoded above to work)
      let directUrl = '';
      if (provider === 'groq') directUrl = 'https://api.groq.com/openai/v1/chat/completions';
      else if (provider === 'openai') directUrl = 'https://api.openai.com/v1/chat/completions';
      else if (provider === 'deepseek') directUrl = 'https://api.deepseek.com/v1/chat/completions';
      else directUrl = 'https://models.inference.ai.azure.com/chat/completions'; // github

      let directKey = '';
      if (provider === 'groq') directKey = (typeof GROQ_API_KEY !== 'undefined' ? GROQ_API_KEY : '');
      else if (provider === 'openai') directKey = (typeof OPENAI_API_KEY !== 'undefined' ? OPENAI_API_KEY : '');
      else if (provider === 'deepseek') directKey = (typeof DEEPSEEK_API_KEY !== 'undefined' ? DEEPSEEK_API_KEY : '');
      else directKey = (typeof GITHUB_TOKEN !== 'undefined' ? GITHUB_TOKEN : '');

      res = await fetch(directUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + directKey
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'system', content: systemPrompt }, ...chatHistory],
          temperature: 0.7,
          max_tokens: 800
        })
      });
    }

    const data = await res.json();


    if (!res.ok || data.error) {
      let errDetail = 'Unknown API Error';
      if (data.error) {
        errDetail = data.error.message || data.error.code || JSON.stringify(data.error);
      } else {
        errDetail = `HTTP ${res.status}: ${res.statusText}`;
      }
      console.error(`${provider.toUpperCase()} API Error:`, data);
      throw new Error(errDetail);
    }

    const botReply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    chatHistory.push({ role: 'assistant', content: botReply });
    // Persist to LocalStorage
    localStorage.setItem(CHAT_LS_KEY, JSON.stringify(chatHistory));

    removeTypingIndicator(typingId);
    await appendChatMessage('bot', botReply, true);

  } catch (err) {
    removeTypingIndicator(typingId);
    appendChatMessage('bot', `❌ ${provider.toUpperCase()} API Error: ${err.message}`);
  } finally {
    isChatLoading = false;
    $('chatbot-send-btn').disabled = false;
    input.focus();
  }
};

const appendChatMessage = async (role, text, animate = false) => {
  const msgs = $('chatbot-messages');
  const div = document.createElement('div');
  div.className = 'chatbot-msg chatbot-msg-' + role;

  const bubble = document.createElement('div');
  bubble.className = 'chatbot-bubble';

  if (animate && role === 'bot') {
    div.appendChild(bubble);
    msgs.appendChild(div);
    await typeEffect(bubble, text, msgs);
  } else {
    bubble.innerHTML = formatChatText(text);
    div.appendChild(bubble);
  }

  // Timestamp
  const ts = document.createElement('div');
  ts.className = 'chatbot-ts';
  const now = new Date();
  ts.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  div.appendChild(ts);

  if (!animate || role !== 'bot') {
    msgs.appendChild(div);
  }
  msgs.scrollTop = msgs.scrollHeight;
};

const typeEffect = (element, text, scrollEl) => {
  return new Promise((resolve) => {
    let i = 0;
    const words = text.split(' ');
    let currentText = '';

    const interval = setInterval(() => {
      if (i < words.length) {
        currentText += words[i] + ' ';
        element.innerHTML = formatChatText(currentText.trim());
        scrollEl.scrollTop = scrollEl.scrollHeight;
        i++;
      } else {
        clearInterval(interval);
        resolve();
      }
    }, 45); // Speed of typing (ms per word)
  });
};

const formatChatText = (text) => {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code style="background:var(--icon-bg);padding:1px 5px;border-radius:4px;font-size:0.85em;font-family:monospace">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--primary)">$1</a>')
    // Bullet points
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul style="margin:6px 0 6px 14px;padding:0">$1</ul>')
    // Line breaks
    .replace(/\n\n/g, '</p><p style="margin:6px 0">')
    .replace(/\n/g, '<br>');
};

const showTypingIndicator = () => {
  const msgs = $('chatbot-messages');
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.className = 'chatbot-msg chatbot-msg-bot';
  div.id = id;
  div.innerHTML = `<div class="chatbot-bubble chatbot-typing"><span></span><span></span><span></span></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
};

const removeTypingIndicator = (id) => {
  const el = $(id);
  if (el) el.remove();
};

const handleChatKey = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
};

const autoresizeChatInput = (el) => {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
};

// No more floating widget needed

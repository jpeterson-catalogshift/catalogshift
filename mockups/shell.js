// CatalogShift Portal — shared shell
// Each page sets: const PAGE = 'home'; (or 'catalog', 'maturity', etc.)
// before including this script. Shell reads PAGE to set the active nav item.
// Maturity subpage detection is automatic from window.location.href — no extra variable needed.

(function () {

  var NAV = [
    { id: 'home',          icon: 'home',              label: 'Home',              href: 'index.html' },
    { id: 'catalog',       icon: 'package',            label: 'Catalog',           href: 'portal_catalog.html' },
    { id: 'maturity',      icon: 'trending-up',        label: 'Maturity Insights', href: 'portal_maturity.html' },
    { id: 'upload',        icon: 'upload',             label: 'File Upload',       href: 'portal_upload.html' },
    { id: 'calibrations',  icon: 'sliders-horizontal', label: 'Calibrations',      href: 'portal_calibrations.html' },
    { id: 'channels',      icon: 'cable',              label: 'Channel Manager',   href: 'portal_channels.html' },
    { id: 'reports',       icon: 'file-text',          label: 'Reports Center',    href: 'portal_reports.html' },
    { id: 'pipeline',      icon: 'activity',           label: 'Pipeline Runs',     href: 'portal_pipeline.html' },
    { id: 'actions',       icon: 'check-square',       label: 'Action Items',      href: 'portal_actions.html' },
    { id: 'notifications', icon: 'bell',               label: 'Notifications',     href: 'portal_notifications.html' },
  ];

  var MATURITY_CHILDREN = [
    { id: 'maturity_level',      icon: 'layers',   label: 'Level Detail',     href: 'portal_maturity_level.html' },
    { id: 'maturity_categories', icon: 'grid-2x2', label: 'Field Categories', href: 'portal_maturity_categories.html' },
    { id: 'maturity_signals',    icon: 'zap',      label: 'Signal Groups',    href: 'portal_maturity_signals.html' },
  ];

  var MATURITY_SUBPAGE_MAP = {
    'portal_maturity_level.html':      'maturity_level',
    'portal_maturity_categories.html': 'maturity_categories',
    'portal_maturity_signals.html':    'maturity_signals',
    'portal_maturity_products.html':   'maturity_products',
  };

  var CALIBRATIONS_CHILDREN = [
    { id: 'calibrations_signals', icon: 'zap',        label: 'Signal Calibrations', href: 'portal_calibrations_signals.html' },
    { id: 'calibrations_field',   icon: 'git-branch',  label: 'Field Calibrations',  href: 'portal_calibrations_field.html' },
  ];

  var CALIBRATIONS_SUBPAGE_MAP = {
    'portal_calibrations_signals.html':      'calibrations_signals',
    'portal_calibrations_field.html':        'calibrations_field',
    'portal_calibrations_field_picker.html': 'calibrations_field',
  };

  var activePage   = (typeof PAGE !== 'undefined') ? PAGE : '';
  var currentFile  = window.location.href.split('/').pop().split('?')[0];
  var activeSubpage = MATURITY_SUBPAGE_MAP[currentFile] || '';
  var isMaturityExpanded = activePage === 'maturity';
  var activeCalSubpage = CALIBRATIONS_SUBPAGE_MAP[currentFile] || '';
  var isCalibrationsExpanded = activePage === 'calibrations';

  // Share modal — shared component, available on every page
  var shareOverlay = document.createElement('div');
  shareOverlay.id = 'share-overlay';
  shareOverlay.onclick = function(e) { if (e.target === shareOverlay) window.closeShareModal(); };
  shareOverlay.innerHTML =
    '<div id="share-modal">' +
      '<div class="share-modal-header">' +
        '<span class="share-modal-title">Flag</span>' +
        '<button class="share-modal-close" onclick="window.closeShareModal()">✕</button>' +
      '</div>' +
      '<div class="share-modal-body">' +
        '<label class="share-label">Message</label>' +
        '<textarea class="share-textarea" rows="3">I found some catalog issues that need attention — here\'s the filtered list for review.</textarea>' +
        '<label class="share-label">Link</label>' +
        '<div class="share-url-box" id="share-url-display"></div>' +
        '<label class="share-label">Send to</label>' +
        '<select class="share-select"><option value="">Select a team member…</option><option>Sarah M.</option><option>Bob K.</option><option>Jeremy P.</option></select>' +
      '</div>' +
      '<div class="share-modal-footer">' +
        '<button class="share-btn-primary" onclick="window.closeShareModal()">Create Action Item</button>' +
        '<button class="share-btn-secondary" onclick="window.closeShareModal()">Notify</button>' +
        '<button class="share-btn-secondary" onclick="window.closeShareModal()">Assign to me</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(shareOverlay);

  window.openShareModal = function() {
    var el = document.getElementById('share-url-display');
    if (el) el.textContent = window.location.href;
    document.getElementById('share-overlay').classList.add('open');
  };
  window.closeShareModal = function() {
    document.getElementById('share-overlay').classList.remove('open');
  };

  // Wireframe toggle — centered in topbar
  window.toggleWireframe = function() {
    document.body.classList.toggle('debug');
    var btn = document.getElementById('wireframe-toggle');
    if (btn) {
      btn.classList.toggle('active');
      btn.textContent = document.body.classList.contains('debug') ? '⬛ Wireframe ON' : '⬜ Wireframe';
    }
  };

  // Inject sub-item styles once
  var style = document.createElement('style');
  style.textContent =
    '.topbar { position:relative !important; }' +
    '#wireframe-toggle { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); padding:4px 10px; border-radius:5px; font-size:11px; font-weight:600; cursor:pointer; border:1px dashed #C8DDD8; background:transparent; color:#89B5A8; font-family:Inter,sans-serif; letter-spacing:0.03em; }' +
    '#wireframe-toggle:hover { border-color:#89B5A8; color:#4A7A6B; }' +
    '#wireframe-toggle.active { border-color:red; color:red; background:#fff0f0; }' +
    '#share-overlay { display:none; position:fixed; inset:0; background:rgba(26,46,40,0.5); z-index:10000; align-items:center; justify-content:center; }' +
    '#share-overlay.open { display:flex; }' +
    '#share-modal { background:#fff; border-radius:12px; width:440px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,0.2); overflow:hidden; font-family:Inter,sans-serif; }' +
    '.share-modal-header { display:flex; align-items:center; justify-content:space-between; padding:18px 22px 14px; border-bottom:1px solid #C8DDD8; }' +
    '.share-modal-title { font-family:Newsreader,serif; font-size:18px; font-weight:600; color:#1A2E28; }' +
    '.share-modal-close { background:none; border:none; font-size:18px; color:#89B5A8; cursor:pointer; line-height:1; padding:0 2px; }' +
    '.share-modal-close:hover { color:#1A2E28; }' +
    '.share-modal-body { padding:20px 22px; display:flex; flex-direction:column; gap:12px; }' +
    '.share-label { font-size:11.5px; font-weight:600; color:#4A7A6B; letter-spacing:0.01em; }' +
    '.share-textarea { width:100%; padding:9px 11px; border:1px solid #C8DDD8; border-radius:7px; font-family:Inter,sans-serif; font-size:13px; color:#1A2E28; resize:none; outline:none; line-height:1.5; }' +
    '.share-textarea:focus { border-color:#A8D9C5; }' +
    '.share-url-box { padding:8px 11px; background:#F7FBF9; border:1px solid #C8DDD8; border-radius:7px; font-size:11.5px; color:#4A7A6B; word-break:break-all; line-height:1.4; }' +
    '.share-select { width:100%; padding:8px 11px; border:1px solid #C8DDD8; border-radius:7px; font-family:Inter,sans-serif; font-size:13px; color:#1A2E28; background:#F7FBF9; outline:none; }' +
    '.share-select:focus { border-color:#A8D9C5; }' +
    '.share-modal-footer { padding:14px 22px 18px; display:flex; gap:8px; border-top:1px solid #C8DDD8; }' +
    '.share-btn-primary { flex:1; padding:9px; background:#1A2E28; color:#FFFDF9; border:none; border-radius:7px; font-family:Inter,sans-serif; font-size:13px; font-weight:600; cursor:pointer; }' +
    '.share-btn-primary:hover { background:#2C2420; }' +
    '.share-btn-secondary { flex:1; padding:9px; background:transparent; color:#4A7A6B; border:1px solid #C8DDD8; border-radius:7px; font-family:Inter,sans-serif; font-size:13px; font-weight:500; cursor:pointer; }' +
    '.share-btn-secondary:hover { border-color:#A8D9C5; color:#1A2E28; }' +
    '.nav-item.expanded { background: rgba(255,255,255,0.07); color: #C4DDD8; border-left-color: #6BCBA8; }' +
    '.nav-subitem { display:flex; align-items:center; gap:8px; padding:6px 10px 6px 32px; border-radius:5px; font-size:12px; font-weight:500; color:#6BAF9A; cursor:pointer; margin-bottom:2px; border-left:2px solid transparent; }' +
    '.nav-subitem:hover { background:rgba(255,255,255,0.06); color:#C4DDD8; }' +
    '.nav-subitem.active { color:#D4EDE7; background:rgba(255,255,255,0.1); border-left-color:#6BCBA8; }' +
    '.nav-subitem svg { width:13px; height:13px; stroke-width:1.75; color:inherit; flex-shrink:0; }' +
    '.debug * { outline: 1px solid rgba(255,0,0,0.25) !important; }';
  document.head.appendChild(style);

  var topbarHTML = '\
    <div class="topbar-left">\
      <div class="topbar-logo">CatalogShift</div>\
      <div class="topbar-divider"></div>\
      <div class="topbar-store">Alpine Gear Collective</div>\
    </div>\
    <button id="wireframe-toggle" onclick="window.toggleWireframe()">⬜ Wireframe</button>\
    <div class="topbar-right">\
      <button class="topbar-btn" onclick="location.href=\'portal_notifications.html\'"><i data-lucide="bell"></i><span class="topbar-badge">3</span></button>\
      <button class="topbar-btn" onclick="location.href=\'portal_actions.html\'"><i data-lucide="check-square"></i><span class="topbar-badge">5</span></button>\
      <div class="topbar-sep"></div>\
      <button class="topbar-btn">Help</button>\
      <button class="topbar-btn">Support</button>\
      <div class="topbar-sep"></div>\
      <div class="topbar-account">\
        <div class="account-avatar">JP</div>\
        Jeremy P.\
      </div>\
    </div>';

  var navItems = NAV.map(function (item) {
    var isExpanded = (item.id === 'maturity' && isMaturityExpanded) || (item.id === 'calibrations' && isCalibrationsExpanded);
    var isDirectActive = item.id === activePage && !activeSubpage && !activeCalSubpage;
    var cls = isDirectActive ? 'nav-item active' : (isExpanded ? 'nav-item expanded' : 'nav-item');

    var html = '<div class="' + cls + '" onclick="location.href=\'' + item.href + '\'">' +
               '<i data-lucide="' + item.icon + '"></i>' + item.label + '</div>';

    if (isExpanded) {
      var children = item.id === 'maturity' ? MATURITY_CHILDREN : CALIBRATIONS_CHILDREN;
      var activeChild = item.id === 'maturity' ? activeSubpage : activeCalSubpage;
      html += children.map(function (child) {
        var childCls = child.id === activeChild ? 'nav-subitem active' : 'nav-subitem';
        return '<div class="' + childCls + '" onclick="event.stopPropagation();location.href=\'' + child.href + '\'">' +
               '<i data-lucide="' + child.icon + '"></i>' + child.label + '</div>';
      }).join('');
    }

    return html;
  }).join('');

  var sidebarHTML = '\
    <div class="brand">\
      <div class="brand-name">CatalogShift</div>\
      <div class="brand-sub">Portal</div>\
    </div>\
    <div class="nav">' + navItems + '</div>';

  var topbarEl = document.getElementById('shell-topbar');
  if (topbarEl) topbarEl.innerHTML = topbarHTML;

  var sidebarEl = document.getElementById('shell-sidebar');
  if (sidebarEl) sidebarEl.innerHTML = sidebarHTML;

})();

'use strict';

// ── EchoesUI ──────────────────────────────────────────────────────────────────
// Handles all DOM rendering. Reads state via EchoesEngine accessors.
// Never modifies game state directly — calls EchoesEngine for all actions.
// Layout: desktop = 184px left sidebar + main. Mobile = collapsible top bar.
// ─────────────────────────────────────────────────────────────────────────────

const EchoesUI = (() => {

  function _root() {
    return document.getElementById('game-root');
  }

  function _addLog(logEl, message, cls) {
    const div = document.createElement('div');
    div.className = 'log-entry' + (cls ? ' ' + cls : '');
    div.textContent = message;
    logEl.appendChild(div);
  }


  // ── _ensureGameLayout ───────────────────────────────────────────────────────
  // Builds the sidebar + game-body structure if it doesn't exist yet.
  // Safe to call repeatedly — only creates elements that are missing.

  function _ensureGameLayout() {
    const root = _root();

    if (!document.getElementById('game-body')) {
      root.innerHTML = '';

      // Mobile stats bar (hidden on desktop via CSS)
      const mobileStats = document.createElement('div');
      mobileStats.id = 'mobile-stats';
      mobileStats.className = 'mobile-stats';

      const mobileBar = document.createElement('div');
      mobileBar.id = 'mobile-bar';
      mobileBar.className = 'mobile-bar';
      mobileBar.onclick = _toggleMobileExpand;
      mobileStats.appendChild(mobileBar);

      const mobileExpanded = document.createElement('div');
      mobileExpanded.id = 'mobile-expanded';
      mobileExpanded.className = 'mobile-expanded';
      mobileStats.appendChild(mobileExpanded);

      root.appendChild(mobileStats);

      // Game body: sidebar + game-screen
      const gameBody = document.createElement('div');
      gameBody.id = 'game-body';
      gameBody.className = 'game-body';

      const sidebar = document.createElement('div');
      sidebar.id = 'stats-sidebar';
      sidebar.className = 'stats-sidebar';
      gameBody.appendChild(sidebar);

      root.appendChild(gameBody);
    }
  }

  function _toggleMobileExpand() {
    const expanded = document.getElementById('mobile-expanded');
    const arrow    = document.querySelector('.mb-arrow');
    if (!expanded) return;
    const isOpen = expanded.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open', isOpen);
  }


  // ── renderStats ─────────────────────────────────────────────────────────────
  // Updates both the desktop sidebar and the mobile top bar.
  // maxHp/maxMp derived from classDef — never stored in session (Rule 3).

  function renderStats(state, classDef) {
    _ensureGameLayout();

    const maxHp  = classDef ? classDef.hp : 0;
    const maxMp  = classDef ? classDef.mp : 0;
    const hpPct  = maxHp > 0 ? Math.round(state.hp / maxHp * 100) : 0;
    const mpPct  = maxMp > 0 ? Math.round(state.mp / maxMp * 100) : 0;
    const label  = state.class
      ? state.class.charAt(0).toUpperCase() + state.class.slice(1)
      : '';

    // ── Desktop sidebar ──────────────────────────────────────────────────────
    const sidebar = document.getElementById('stats-sidebar');
    if (sidebar) {
      sidebar.innerHTML = '';

      // Class panel
      const classPanel = _panel();
      classPanel.innerHTML = `<div class="s-label">Class</div><div class="s-value">${label}</div>`;
      sidebar.appendChild(classPanel);

      // HP panel
      const hpPanel = _panel();
      hpPanel.innerHTML = `
        <div class="s-label">Hit Points</div>
        <div class="s-bar-wrap"><div class="s-bar-fill" style="width:${hpPct}%;background:${_hpColor(hpPct)}"></div></div>
        <div class="s-row"><span class="s-key">HP</span><span class="s-hp">${state.hp} / ${maxHp}</span></div>
      `;
      sidebar.appendChild(hpPanel);

      // MP panel (Mage only)
      if (maxMp > 0) {
        const mpPanel = _panel();
        mpPanel.innerHTML = `
          <div class="s-label">Mana</div>
          <div class="s-bar-wrap"><div class="s-bar-fill" style="width:${mpPct}%;background:#4070c0"></div></div>
          <div class="s-row"><span class="s-key">MP</span><span class="s-mp">${state.mp} / ${maxMp}</span></div>
        `;
        sidebar.appendChild(mpPanel);
      }

      // Stats panel
      const statsPanel = _panel();
      statsPanel.innerHTML = `
        <div class="s-label">Stats</div>
        <div class="s-row"><span class="s-key">XP</span><span class="s-val">${state.xp}</span></div>
        <div class="s-row"><span class="s-key">Gold</span><span class="s-gd">${state.gold}g</span></div>
      `;
      sidebar.appendChild(statsPanel);

      // Inventory panel
      const session = EchoesEngine.getSession();
      const invPanel = _panel();
      const invLabel = document.createElement('div');
      invLabel.className = 's-label';
      invLabel.textContent = 'Inventory';
      invPanel.appendChild(invLabel);

      if (session && session.bag.items.length > 0) {
        session.bag.items.forEach(itemId => {
          const item = EchoesEngine.inventory.lookupItem(itemId);
          const el = document.createElement('div');
          el.className = 's-inv-item';
          el.textContent = item ? item.label : itemId;
          invPanel.appendChild(el);
        });
      } else {
        const empty = document.createElement('div');
        empty.className = 's-inv-empty';
        empty.textContent = 'empty';
        invPanel.appendChild(empty);
      }
      sidebar.appendChild(invPanel);
    }

    // ── Mobile bar ───────────────────────────────────────────────────────────
    const mobileBar = document.getElementById('mobile-bar');
    if (mobileBar) {
      const currentNode = state.currentNode
        ? EchoesEngine.getLevel()?.nodes.find(n => n.id === state.currentNode)
        : null;
      const locLabel = currentNode ? currentNode.label : '—';

      mobileBar.innerHTML = `
        <span class="mb-class">${label}</span>
        <div class="mobile-bar-hp">
          <div class="mobile-bar-hp-fill" style="width:${hpPct}%"></div>
        </div>
        <span class="mb-hp">HP ${state.hp}</span>
        <span class="mb-gold">${state.gold}g</span>
        <span class="mb-loc">${locLabel}</span>
        <span class="mb-arrow">\u25BE</span>
      `;
    }

    const mobileExpanded = document.getElementById('mobile-expanded');
    if (mobileExpanded) {
      mobileExpanded.innerHTML = `
        <div class="s-panel">
          <div class="s-row"><span class="s-key">HP</span><span class="s-hp">${state.hp} / ${maxHp}</span></div>
          ${maxMp > 0 ? `<div class="s-row"><span class="s-key">MP</span><span class="s-mp">${state.mp} / ${maxMp}</span></div>` : ''}
        </div>
        <div class="s-panel">
          <div class="s-row"><span class="s-key">XP</span><span class="s-val">${state.xp}</span></div>
          <div class="s-row"><span class="s-key">Gold</span><span class="s-gd">${state.gold}g</span></div>
        </div>
      `;
    }
  }

  function _panel() {
    const div = document.createElement('div');
    div.className = 's-panel';
    return div;
  }

  function _hpColor(pct) {
    return pct > 50 ? '#b03030' : pct > 25 ? '#b07030' : '#dd2020';
  }


  // ── renderNode ──────────────────────────────────────────────────────────────
  // Renders node content into #game-screen inside .game-body.

  function renderNode(node, state, session, messages = []) {
    _ensureGameLayout();

    const gameBody = document.getElementById('game-body');
    let screen = document.getElementById('game-screen');
    if (!screen) {
      screen = document.createElement('div');
      screen.id = 'game-screen';
      gameBody.appendChild(screen);
    }
    screen.innerHTML = '';

    // Scrollable log area (label + description + event log)
    const logArea = document.createElement('div');
    logArea.className = 'node-log-area';

    const labelEl = document.createElement('div');
    labelEl.className = 'node-label';
    labelEl.textContent = node.label;
    logArea.appendChild(labelEl);

    const descEl = document.createElement('div');
    descEl.className = 'node-description';
    descEl.textContent = node.description;
    logArea.appendChild(descEl);

    if (messages.length > 0) {
      const logEl = document.createElement('div');
      logEl.id = 'node-log';
      logEl.className = 'node-log';
      messages.forEach(msg => {
        const isDevMsg = msg.startsWith('[DEV]');
        _addLog(logEl, msg, isDevMsg ? 'log-dev' : 'log-event');
      });
      logArea.appendChild(logEl);
    } else {
      // Empty log container so showMessage() has somewhere to append
      const logEl = document.createElement('div');
      logEl.id = 'node-log';
      logEl.className = 'node-log';
      logArea.appendChild(logEl);
    }

    screen.appendChild(logArea);

    // Choices panel (fixed at bottom)
    const choicesEl = document.createElement('div');
    choicesEl.className = 'choices-area';
    screen.appendChild(choicesEl);

    // Victory ending
    if (node.ending === 'victory') {
      _renderVictory(choicesEl, state);
      return;
    }

    // Death ending
    if (node.ending === 'death') {
      _renderDeath(choicesEl);
      return;
    }

    // Combat node — Phase 3 placeholder
    if (node.encounter) {
      const enc = node.encounter;
      const encEl = document.createElement('div');
      encEl.className = 'encounter-placeholder';
      encEl.innerHTML = `\u2694 <b>${enc.label}</b> &nbsp;&middot;&nbsp; HP: ${enc.hp} &nbsp;&middot;&nbsp; ATK: ${enc.atk} &nbsp;&middot;&nbsp; DEF: ${enc.def}`;
      choicesEl.appendChild(encEl);

      const note = document.createElement('div');
      note.className = 'encounter-note';
      note.textContent = 'Combat system arrives in Phase 3.';
      choicesEl.appendChild(note);

      const skipBtn = document.createElement('button');
      skipBtn.className = 'choice-btn choice-dev';
      skipBtn.textContent = `[DEV] Skip \u2014 fight ${enc.label} \u2192 victory`;
      skipBtn.onclick = () => EchoesEngine.devSkipCombat(node);
      choicesEl.appendChild(skipBtn);
      return;
    }

    // Normal node — render choices
    if (node.choices && node.choices.length > 0) {
      node.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';

        let label = choice.label;
        if (choice.goldCost) label += ` (${choice.goldCost}g)`;
        btn.textContent = label;

        // Disable if required item not in inventory
        if (choice.requires) {
          if (!EchoesEngine.inventory.hasItem(choice.requires)) {
            const item = EchoesEngine.inventory.lookupItem(choice.requires);
            btn.disabled = true;
            btn.classList.add('choice-disabled');
            btn.title = `Requires: ${item ? item.label : choice.requires}`;
          }
        }

        // Disable if not enough gold
        if (choice.goldCost && state.gold < choice.goldCost) {
          btn.disabled = true;
          btn.classList.add('choice-disabled');
          btn.title = `Need ${choice.goldCost}g (have ${state.gold}g)`;
        }

        btn.onclick = () => EchoesEngine.applyChoice(choice);
        choicesEl.appendChild(btn);
      });
    }
  }


  // ── Ending screens ──────────────────────────────────────────────────────────

  function _renderVictory(container, state) {
    const msg = document.createElement('div');
    msg.className = 'ending-title ending-victory';
    msg.textContent = '\u2746 VICTORY \u2014 THE DUNGEON IS CONQUERED';
    container.appendChild(msg);

    const label = state.class
      ? state.class.charAt(0).toUpperCase() + state.class.slice(1)
      : '';
    const stats = document.createElement('div');
    stats.className = 'ending-stats';
    stats.textContent = `${label} \u00b7 ${state.gold}g \u00b7 ${state.xp} XP`;
    container.appendChild(stats);

    const castleBtn = document.createElement('button');
    castleBtn.className = 'choice-btn choice-primary';
    castleBtn.textContent = '\u2192 Enter the Castle of Echoes';
    castleBtn.onclick = () => EchoesEngine.handleVictory();
    container.appendChild(castleBtn);

    const againBtn = document.createElement('button');
    againBtn.className = 'choice-btn';
    againBtn.textContent = '\u21a9 Play Again';
    againBtn.onclick = () => {
      const level = EchoesEngine.getLevel();
      try { localStorage.removeItem(level.saveKey); } catch (e) {}
      EchoesEngine.session.reset();
      renderClassSelect(EchoesEngine.getClasses());
    };
    container.appendChild(againBtn);
  }

  function _renderDeath(container) {
    const msg = document.createElement('div');
    msg.className = 'ending-title ending-death';
    msg.textContent = '\u2620 YOU HAVE FALLEN';
    container.appendChild(msg);

    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = '\u21a9 Try Again';
    btn.onclick = () => {
      const level = EchoesEngine.getLevel();
      try { localStorage.removeItem(level.saveKey); } catch (e) {}
      renderClassSelect(EchoesEngine.getClasses());
    };
    container.appendChild(btn);
  }


  // ── renderClassSelect ───────────────────────────────────────────────────────

  function renderClassSelect(classes) {
    const root = _root();
    root.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'class-select';

    const title = document.createElement('h1');
    title.textContent = 'Echoes RPG';
    screen.appendChild(title);

    const sub = document.createElement('p');
    sub.className = 'class-select-sub';
    sub.textContent = 'Choose your class to begin';
    screen.appendChild(sub);

    const cards = document.createElement('div');
    cards.className = 'class-cards';

    Object.values(classes).forEach(cls => {
      const btn = document.createElement('button');
      btn.className = 'class-card';
      btn.innerHTML = `
        <div class="class-label">${cls.label}</div>
        <div class="class-stats">HP: ${cls.hp} · ATK: ${cls.atk} · DEF: ${cls.def}${cls.mp > 0 ? ' · MP: ' + cls.mp : ''}</div>
        <div class="class-desc">${cls.description}</div>
      `;
      btn.onclick = () => EchoesEngine.startNewGame(cls.id);
      cards.appendChild(btn);
    });

    screen.appendChild(cards);
    root.appendChild(screen);
  }


  // ── showMessage ─────────────────────────────────────────────────────────────

  function showMessage(message) {
    const logEl = document.getElementById('node-log');
    if (logEl) {
      _addLog(logEl, message, 'log-warning');
    }
  }


  return { renderClassSelect, renderStats, renderNode, showMessage };

})();

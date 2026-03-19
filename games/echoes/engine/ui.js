'use strict';

// ── EchoesUI ──────────────────────────────────────────────────────────────────
// Handles all DOM rendering. Reads state via EchoesEngine accessors.
// Never modifies game state directly — calls EchoesEngine for all actions.
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

  // ── renderClassSelect ───────────────────────────────────────────────────────
  // Renders the class selection screen. Full takeover of #game-root.

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


  // ── renderStats ─────────────────────────────────────────────────────────────
  // Renders or updates the stats bar. maxHp/maxMp derived from classDef (Rule 3).

  function renderStats(state, classDef) {
    const root = _root();
    let bar = document.getElementById('stats-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'stats-bar';
      bar.className = 'stats-bar';
      root.insertBefore(bar, root.firstChild);
    }

    const maxHp = classDef ? classDef.hp : '?';
    const maxMp = classDef ? classDef.mp : 0;
    const label = state.class
      ? state.class.charAt(0).toUpperCase() + state.class.slice(1)
      : '';

    bar.innerHTML = `
      <span class="stat"><b>${label}</b></span>
      <span class="stat">HP: ${state.hp} / ${maxHp}</span>
      ${maxMp > 0 ? `<span class="stat">MP: ${state.mp} / ${maxMp}</span>` : ''}
      <span class="stat">XP: ${state.xp}</span>
      <span class="stat">Gold: ${state.gold}g</span>
    `;
  }


  // ── renderNode ──────────────────────────────────────────────────────────────
  // Renders a node — label, description, log messages, and choice buttons.
  // messages[] contains pending notifications from the engine (item pickups, costs).

  function renderNode(node, state, session, messages = []) {
    // Ensure #game-screen exists without disturbing #stats-bar
    let screen = document.getElementById('game-screen');
    if (!screen) {
      screen = document.createElement('div');
      screen.id = 'game-screen';
      screen.className = 'game-screen';
      _root().appendChild(screen);
    }
    screen.innerHTML = '';

    // Node label (location name)
    const labelEl = document.createElement('div');
    labelEl.className = 'node-label';
    labelEl.textContent = node.label;
    screen.appendChild(labelEl);

    // Node description
    const descEl = document.createElement('div');
    descEl.className = 'node-description';
    descEl.textContent = node.description;
    screen.appendChild(descEl);

    // Message log (item pickups, costs, warnings)
    const logEl = document.createElement('div');
    logEl.id = 'node-log';
    logEl.className = 'node-log';
    messages.forEach(msg => {
      const isDevMsg = msg.startsWith('[DEV]');
      _addLog(logEl, msg, isDevMsg ? 'log-dev' : 'log-event');
    });
    screen.appendChild(logEl);

    // Choices area
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

        // Disable if requires item not in inventory
        if (choice.requires) {
          const hasItem = EchoesEngine.inventory.hasItem(choice.requires);
          if (!hasItem) {
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
      // Inventory persists through death — do not reset session
      renderClassSelect(EchoesEngine.getClasses());
    };
    container.appendChild(btn);
  }


  // ── showMessage ─────────────────────────────────────────────────────────────
  // Appends a warning message to the active log area.

  function showMessage(message) {
    const logEl = document.getElementById('node-log');
    if (logEl) {
      _addLog(logEl, message, 'log-warning');
    }
  }


  return { renderClassSelect, renderStats, renderNode, showMessage };

})();

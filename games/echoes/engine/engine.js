'use strict';

// ── EchoesEngine ─────────────────────────────────────────────────────────────
// Central game engine. Manages state, save/load, navigation, and inventory
// lookups. Contains no game-specific content — all content lives in JSON files.
// ─────────────────────────────────────────────────────────────────────────────

const EchoesEngine = (() => {

  // ── Private state ───────────────────────────────────────────────────────────
  let _level   = null;   // level1.json data
  let _classes = null;   // classes.json data
  let _items   = null;   // items.json data
  let _state   = null;   // current level save (dungeon_save, castle_save, etc.)
  let _session = null;   // player_session (bag, keyring, equipment, reputation)
  let _bonusAtk = 0;     // transient combat bonus — in-memory only, never saved
  let _bonusDef = 0;     // transient combat bonus — in-memory only, never saved
  let _pendingMessages = []; // messages to display on next renderNode call


  // ── session ─────────────────────────────────────────────────────────────────
  // Manages player_session in localStorage.
  // Stores IDs only — never labels, stats, slot counts, or computed values.

  const session = {

    load() {
      try {
        const raw = localStorage.getItem('player_session');
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('[EchoesEngine] player_session corrupt — using default state');
      }
      return null;
    },

    save() {
      try {
        localStorage.setItem('player_session', JSON.stringify(_session));
      } catch (e) {
        console.warn('[EchoesEngine] Failed to write player_session', e);
      }
    },

    // Wipes player_session and initialises a fresh default state.
    // Bag starts as shoulder_bag. Slot count is derived at runtime from
    // items.json[containers][bag.itemId].slots — never stored here.
    reset() {
      _session = {
        bag:        { itemId: 'shoulder_bag', items: [] },
        keyring:    null,
        equipment:  { weapon: null, armor: null, accessory: null },
        reputation: {}
      };
      session.save();
    }

  };


  // ── levelSave ───────────────────────────────────────────────────────────────
  // Manages level-specific save keys (dungeon_save, castle_save, etc.).

  const levelSave = {

    load(saveKey) {
      try {
        const raw = localStorage.getItem(saveKey);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn(`[EchoesEngine] ${saveKey} corrupt — ignoring`);
      }
      return null;
    },

    save(saveKey, state) {
      try {
        localStorage.setItem(saveKey, JSON.stringify(state));
      } catch (e) {
        console.warn(`[EchoesEngine] Failed to write ${saveKey}`, e);
      }
    }

  };


  // ── inventory ───────────────────────────────────────────────────────────────

  const inventory = {

    // Returns the full item object from items.json for a given ID.
    // Searches known, unknown, resolved, and containers sections in order.
    lookupItem(itemId) {
      if (!_items) return null;
      const sections = ['known', 'unknown', 'resolved', 'containers'];
      for (const section of sections) {
        if (_items[section] && _items[section][itemId]) {
          return _items[section][itemId];
        }
      }
      console.warn(`[EchoesEngine] Unknown item ID: "${itemId}"`);
      return null;
    },

    // Returns true if itemId is in the player's bag or key ring.
    hasItem(itemId) {
      if (!_session) return false;
      const inBag     = _session.bag.items.includes(itemId);
      const inKeyring = _session.keyring && _session.keyring.items.includes(itemId);
      return inBag || !!inKeyring;
    }

  };


  // ── Internal helpers ────────────────────────────────────────────────────────

  function _findNode(nodeId) {
    const node = _level.nodes.find(n => n.id === nodeId);
    if (!node) console.warn(`[EchoesEngine] Unknown node ID: "${nodeId}"`);
    return node || null;
  }

  // Initialises a fresh game for the chosen class.
  function _startNewGame(classId) {
    const cls = _classes[classId];
    if (!cls) {
      console.warn(`[EchoesEngine] Unknown class ID: "${classId}"`);
      return;
    }

    session.reset();

    _state = {
      class:          classId,
      hp:             cls.hp,
      mp:             cls.mp,
      xp:             0,
      gold:           0,
      currentNode:    _level.startNode,
      clearedCombats:   [],
      clearedChests:    [],
      clearedGoldGains: [],
      usedAbilities:    [],
      flags:            {}
    };

    _bonusAtk = 0;
    _bonusDef = 0;

    levelSave.save(_level.saveKey, _state);
    navigateNode(_level.startNode);
  }

  // Writes the 5-field cross-level carry and redirects to the next level.
  // Called on victory. Clears the next level's save key before redirecting.
  function _handleVictory() {
    const crosslevel = {
      class: _state.class,
      hp:    _state.hp,
      mp:    _state.mp,
      xp:    _state.xp,
      gold:  _state.gold
    };
    try {
      localStorage.setItem(_level.crossLevelKey, JSON.stringify(crosslevel));
      localStorage.removeItem(_level.clearSaveOnExit);
    } catch (e) {
      console.warn('[EchoesEngine] Failed to write cross-level carry data', e);
    }
    window.location.href = _level.nextLevelPath;
  }

  // DEV ONLY — skips a combat encounter, awarding XP/gold/loot as if won.
  // Rewards only fire on first clear — same guard as clearedChests.
  // Phase 3 replaces this with the real combat loop.
  function _devSkipCombat(node) {
    if (!node.encounter) return;

    if (!_state.clearedCombats.includes(node.id)) {
      _state.clearedCombats.push(node.id);
      _state.xp   += node.encounter.xp;
      _state.gold += node.encounter.gold;
      _pendingMessages.push(`[DEV] Combat skipped: +${node.encounter.xp} XP, +${node.encounter.gold}g`);

      if (node.encounter.loot) {
        const item = inventory.lookupItem(node.encounter.loot);
        if (item) {
          _session.bag.items.push(node.encounter.loot);
          _pendingMessages.push(`Obtained: ${item.label}`);
          session.save();
        }
      }
    } else {
      _pendingMessages.push(`[DEV] Already cleared — no rewards`);
    }

    navigateNode(node.encounter.onWin);
  }


  // ── navigateNode ────────────────────────────────────────────────────────────
  // Moves the player to nodeId. Applies node effects (hpCost, goldGain, chest),
  // updates currentNode in the level save, and renders via EchoesUI.

  function navigateNode(nodeId) {
    const node = _findNode(nodeId);
    if (!node) return;

    // Apply transient combat bonuses (in-memory only)
    if (node.bonusAtk) _bonusAtk = node.bonusAtk;
    if (node.bonusDef) _bonusDef = node.bonusDef;

    // Apply HP cost (gauntlet, cultist_steal, rune_fail, etc.)
    if (node.hpCost) {
      _state.hp = Math.max(0, _state.hp - node.hpCost);
      _pendingMessages.push(`\u2212${node.hpCost} HP`);
      if (_state.hp <= 0) {
        levelSave.save(_level.saveKey, _state);
        session.save();
        _pendingMessages = [];
        navigateNode('death');
        return;
      }
    }

    // Apply gold gain — only on first visit (tracked by clearedGoldGains)
    if (node.goldGain && !(_state.clearedGoldGains || []).includes(node.id)) {
      _state.gold += node.goldGain;
      _pendingMessages.push(`+${node.goldGain} gold`);
      _state.clearedGoldGains = _state.clearedGoldGains || [];
      _state.clearedGoldGains.push(node.id);
    }

    // Process chest items — only on first visit (tracked by clearedChests)
    if (node.chest && node.chest.length > 0 && !_state.clearedChests.includes(node.id)) {
      node.chest.forEach(itemId => {
        const item = inventory.lookupItem(itemId);
        if (!item) return; // warning already logged by lookupItem
        _session.bag.items.push(itemId);
        _pendingMessages.push(`Obtained: ${item.label}`);
      });
      _state.clearedChests.push(node.id);
    }

    // Update currentNode — stores node ID only, never a label or description
    _state.currentNode = node.id;

    // Persist state
    levelSave.save(_level.saveKey, _state);
    session.save();

    // Render
    EchoesUI.renderStats(_state, _classes[_state.class]);
    EchoesUI.renderNode(node, _state, _session, _pendingMessages);
    _pendingMessages = [];
  }


  // ── applyChoice ─────────────────────────────────────────────────────────────
  // Validates choice conditions (requires, goldCost) before navigating.

  function applyChoice(choice) {
    if (choice.requires && !inventory.hasItem(choice.requires)) {
      const item = inventory.lookupItem(choice.requires);
      EchoesUI.showMessage(`You need the ${item ? item.label : choice.requires} to do this.`);
      return;
    }

    if (choice.goldCost) {
      if (_state.gold < choice.goldCost) {
        EchoesUI.showMessage(`Not enough gold — need ${choice.goldCost}g, have ${_state.gold}g.`);
        return;
      }
      _state.gold -= choice.goldCost;
      _pendingMessages.push(`\u2212${choice.goldCost} gold`);
    }

    navigateNode(choice.next);
  }


  // ── load ────────────────────────────────────────────────────────────────────
  // Entry point. Fetches level JSON + data files, then resumes or shows class select.

  async function load(levelJsonPath) {
    try {
      const [levelData, classesData, itemsData] = await Promise.all([
        fetch(levelJsonPath).then(r => r.json()),
        fetch('/games/echoes/data/classes.json').then(r => r.json()),
        fetch('/games/echoes/data/items.json').then(r => r.json()),
      ]);
      _level   = levelData;
      _classes = classesData;
      _items   = itemsData;
    } catch (e) {
      console.error('[EchoesEngine] Failed to load data files:', e);
      return;
    }

    // Try to resume an existing save
    const savedState = levelSave.load(_level.saveKey);
    if (savedState && savedState.class && _classes[savedState.class]) {
      _state   = savedState;
      _session = session.load() || (() => { session.reset(); return _session; })();
      EchoesUI.renderStats(_state, _classes[_state.class]);
      navigateNode(_state.currentNode);
    } else {
      // No valid save — show class selection
      _session = session.load();
      EchoesUI.renderClassSelect(_classes);
    }
  }


  // ── Public API ──────────────────────────────────────────────────────────────
  return {
    load,
    navigateNode,
    applyChoice,
    startNewGame:   _startNewGame,
    handleVictory:  _handleVictory,
    devSkipCombat:  _devSkipCombat,
    session,
    levelSave,
    inventory,
    // State accessors for ui.js
    getLevel()      { return _level; },
    getLevelState() { return _state; },
    getSession()    { return _session; },
    getClasses()    { return _classes; },
    getItems()      { return _items; },
    getBonusAtk()   { return _bonusAtk; },
    getBonusDef()   { return _bonusDef; }
  };

})();

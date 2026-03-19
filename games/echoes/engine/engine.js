'use strict';

// ── EchoesEngine ─────────────────────────────────────────────────────────────
// Central game engine. Manages state, save/load, navigation, combat, and
// inventory lookups. Contains no game-specific content — all content lives in
// JSON files.
// ─────────────────────────────────────────────────────────────────────────────

const EchoesEngine = (() => {

  // ── Private state ───────────────────────────────────────────────────────────
  let _level       = null;   // level JSON data
  let _classes     = null;   // classes.json data
  let _items       = null;   // items.json data
  let _entities    = null;   // entities.json data
  let _progression = null;   // progression.json data
  let _state       = null;   // current level save (dungeon_save, castle_save, etc.)
  let _session     = null;   // player_session (bag, keyring, equipment, reputation)
  let _combat      = null;   // active combat state — in-memory only, never saved
  let _pendingMessages = []; // messages to display on next render call


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
    },

    // Writes the 5-field cross-level carry object and clears the next level's
    // save key. Called on level victory before redirecting.
    writeTransition(crossLevelKey, clearKey, stateObject) {
      try {
        localStorage.setItem(crossLevelKey, JSON.stringify(stateObject));
        localStorage.removeItem(clearKey);
      } catch (e) {
        console.warn('[EchoesEngine] Failed to write cross-level transition', e);
      }
    }

  };


  // ── progression ─────────────────────────────────────────────────────────────
  // Derives player level from total XP using progression.json thresholds.
  // Player level is NEVER stored — always computed at runtime (Rule 3).

  const progression = {

    getLevel(xp) {
      if (!_progression || !_progression.length) return 1;
      let level = 1;
      for (const entry of _progression) {
        if (xp >= entry.xpRequired) level = entry.level;
        else break;
      }
      return level;
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
    },

    // Adds an item to the player's bag and queues an "Obtained" message.
    // No slot limit enforcement — that is Phase 5.
    // Caller is responsible for calling session.save() after all adds are done.
    addItem(itemId) {
      if (!_session) return;
      const item = inventory.lookupItem(itemId);
      if (!item) return;
      _session.bag.items.push(itemId);
      _pendingMessages.push(`Obtained: ${item.label}`);
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
      class:            classId,
      hp:               cls.hp,
      mp:               cls.mp,
      xp:               0,
      gold:             0,
      currentNode:      _level.startNode,
      clearedCombats:   [],
      clearedChests:    [],
      clearedGoldGains: [],
      usedAbilities:    [],
      flags:            {}
    };

    levelSave.save(_level.saveKey, _state);
    navigateNode(_level.startNode);
  }

  // Writes the 5-field cross-level carry and redirects to the next level.
  // Called on victory when the player chooses to proceed.
  function _handleVictory() {
    const crosslevel = {
      class: _state.class,
      hp:    _state.hp,
      mp:    _state.mp,
      xp:    _state.xp,
      gold:  _state.gold
    };
    levelSave.writeTransition(_level.crossLevelKey, _level.clearSaveOnExit, crosslevel);
    window.location.href = _level.nextLevelPath;
  }


  // ── Combat ──────────────────────────────────────────────────────────────────

  // Applies the enemy's attack to the player. Returns damage dealt.
  // Derives flood bonus from level mechanics at combat time (Rule 3).
  function _enemyAttack(entity) {
    const cls = _classes[_state.class];
    let playerDef = cls.def;

    // Flood bonus: environmental, persists for full combat vs elder_dragon.
    // Value derived from level JSON — never stored in save.
    if (_state.flags && _state.flags.floodTriggered && _combat.entityId === 'elder_dragon') {
      const mech = _level.mechanics && _level.mechanics.floodMechanic;
      playerDef += mech ? mech.bonusDef : 0;
    }

    const dmg = Math.max(1, entity.atk - playerDef);
    _state.hp  = Math.max(0, _state.hp - dmg);
    _combat.log.push(`${entity.label} strikes for ${dmg} \u2014 your HP: ${_state.hp}`);
    return dmg;
  }

  // Initiates a combat encounter for the given node.
  // Looks up the entity, applies pre-combat flag bonuses, and renders combat UI.
  // The player then drives turns via combatAction().
  function _startCombat(node) {
    const enc    = node.encounter;
    const entity = _entities ? _entities[enc.entityId] : null;

    if (!entity) {
      console.warn(`[EchoesEngine] Unknown entityId: "${enc.entityId}" \u2014 skipping combat`);
      _pendingMessages.push(`[WARNING] Unknown enemy \u2014 combat skipped`);
      if (!_state.clearedCombats.includes(node.id)) {
        _state.clearedCombats.push(node.id);
        levelSave.save(_level.saveKey, _state);
      }
      if (enc.onWin) navigateNode(enc.onWin);
      return;
    }

    // Sneak attack bonus — consume the flag, derive value from level mechanics.
    // One-time first-strike bonus vs elder_dragon only (Rule 3).
    let sneakBonusAtk = 0;
    if (_state.flags && _state.flags.dragonSneakAvailable && enc.entityId === 'elder_dragon') {
      const mech = _level.mechanics && _level.mechanics.sneakAttack;
      sneakBonusAtk = mech ? mech.bonusAtk : 0;
      delete _state.flags.dragonSneakAvailable; // consumed — persists as absent
      levelSave.save(_level.saveKey, _state);
      if (sneakBonusAtk > 0) {
        _pendingMessages.push(`Sneak attack! +${sneakBonusAtk} bonus damage on first strike.`);
      }
    }

    _combat = {
      entityId:     enc.entityId,
      node:         node,
      enemyHp:      entity.hp,
      enemyMaxHp:   entity.hp,
      log:          [..._pendingMessages],
      round:        1,
      sneakBonusAtk
    };
    _pendingMessages = [];

    EchoesUI.renderCombat(_combat, entity, _state, _classes[_state.class]);
  }

  // Processes a player action during an active combat encounter.
  // action: 'attack' | 'useItem'
  // payload: itemId (required when action === 'useItem')
  function combatAction(action, payload) {
    if (!_combat || !_entities) return;

    const entity = _entities[_combat.entityId];
    const node   = _combat.node;
    const cls    = _classes[_state.class];

    if (action === 'attack') {
      // ── Player attacks ───────────────────────────────────────────────────
      let playerAtk = cls.atk;

      // Sneak bonus on first strike only (consumed after use)
      if (_combat.sneakBonusAtk > 0) {
        playerAtk += _combat.sneakBonusAtk;
        _combat.sneakBonusAtk = 0;
      }

      const dmgToEnemy = Math.max(1, playerAtk - entity.def);
      _combat.enemyHp  = Math.max(0, _combat.enemyHp - dmgToEnemy);
      _combat.log.push(`You strike for ${dmgToEnemy} \u2014 ${entity.label} HP: ${_combat.enemyHp}`);

      if (_combat.enemyHp <= 0) {
        _resolveCombatWin(entity, node);
        return;
      }

      // ── Enemy attacks ────────────────────────────────────────────────────
      _enemyAttack(entity);
      levelSave.save(_level.saveKey, _state);

      if (_state.hp <= 0) {
        _resolveCombatLose(node);
        return;
      }

    } else if (action === 'useItem') {
      // ── Use a consumable item ────────────────────────────────────────────
      const itemId = payload;
      if (!itemId || !_session) return;

      const idx = _session.bag.items.indexOf(itemId);
      if (idx === -1) return;

      const item = inventory.lookupItem(itemId);
      if (!item) return;

      if (item.effect === 'heal') {
        const maxHp  = cls.hp;
        const healed = Math.min(item.value, maxHp - _state.hp);
        _state.hp    = Math.min(maxHp, _state.hp + item.value);
        _session.bag.items.splice(idx, 1);
        _combat.log.push(`You use ${item.label} \u2014 restored ${healed} HP. Your HP: ${_state.hp}`);

      } else if (item.effect === 'restore_mp') {
        const maxMp    = cls.mp;
        const restored = Math.min(item.value, maxMp - _state.mp);
        _state.mp      = Math.min(maxMp, _state.mp + item.value);
        _session.bag.items.splice(idx, 1);
        _combat.log.push(`You use ${item.label} \u2014 restored ${restored} MP. Your MP: ${_state.mp}`);

      } else {
        return; // item not usable in combat
      }

      // Using an item is the player's turn — enemy gets to attack
      _enemyAttack(entity);
      levelSave.save(_level.saveKey, _state);
      session.save();

      if (_state.hp <= 0) {
        _resolveCombatLose(node);
        return;
      }
    }

    _combat.round++;
    EchoesUI.renderStats(_state, cls);
    EchoesUI.renderCombat(_combat, entity, _state, cls);
  }

  function _resolveCombatWin(entity, node) {
    const prevLevel = progression.getLevel(_state.xp);

    // Award XP and gold
    _state.xp   += entity.xp;
    _state.gold += entity.gold;
    _pendingMessages.push(`Victory! +${entity.xp} XP, +${entity.gold}g`);

    // Level-up notification (derived, never stored)
    const newLevel = progression.getLevel(_state.xp);
    if (newLevel > prevLevel) {
      _pendingMessages.push(`Level up! You are now level ${newLevel}.`);
    }
    console.log(`[EchoesEngine] Player level: ${newLevel} (${_state.xp} XP)`);

    // Drop entity loot into bag (no slot limit — Phase 5)
    if (entity.loot && entity.loot.length > 0) {
      entity.loot.forEach(itemId => inventory.addItem(itemId));
    }

    // Mark node as cleared — stores node ID, not entity ID
    _state.clearedCombats.push(node.id);

    const onWin = node.encounter.onWin;
    _combat = null;

    levelSave.save(_level.saveKey, _state);
    session.save();

    navigateNode(onWin);
  }

  function _resolveCombatLose(node) {
    _pendingMessages.push('You have been defeated\u2026');
    const onLose = node.encounter.onLose;
    _combat = null;
    levelSave.save(_level.saveKey, _state);
    navigateNode(onLose);
  }


  // ── navigateNode ────────────────────────────────────────────────────────────
  // Moves the player to nodeId. Applies node effects (flag bonuses, hpCost,
  // goldGain, chest), updates currentNode in the level save, and renders via
  // EchoesUI — or triggers combat if an uncleared encounter is present.

  function navigateNode(nodeId) {
    const node = _findNode(nodeId);
    if (!node) return;

    // Flag-based combat bonuses — set when visiting bonus nodes.
    // Values are derived from _level.mechanics at combat time (Rule 3).
    // Never store the numeric bonus — only the flag.
    if (node.bonusAtk) {
      _state.flags = _state.flags || {};
      _state.flags.dragonSneakAvailable = true;
    }
    if (node.bonusDef) {
      _state.flags = _state.flags || {};
      _state.flags.floodTriggered = true;
    }

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
        if (!item) return;
        _session.bag.items.push(itemId);
        _pendingMessages.push(`Obtained: ${item.label}`);
      });
      _state.clearedChests.push(node.id);
    }

    // Update currentNode — stores node ID only, never a label or description
    _state.currentNode = node.id;

    // Check for an uncleared encounter — trigger combat before rendering
    if (node.encounter && !_state.clearedCombats.includes(node.id)) {
      levelSave.save(_level.saveKey, _state);
      session.save();
      EchoesUI.renderStats(_state, _classes[_state.class]);
      _startCombat(node);
      return;
    }

    // Persist state and render
    levelSave.save(_level.saveKey, _state);
    session.save();

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
        EchoesUI.showMessage(`Not enough gold \u2014 need ${choice.goldCost}g, have ${_state.gold}g.`);
        return;
      }
      _state.gold -= choice.goldCost;
      _pendingMessages.push(`\u2212${choice.goldCost} gold`);
    }

    navigateNode(choice.next);
  }


  // ── load ────────────────────────────────────────────────────────────────────
  // Entry point. Fetches level JSON + all data files, then resumes or shows
  // class select.

  async function load(levelJsonPath) {
    try {
      const [levelData, classesData, itemsData, entitiesData, progressionData] = await Promise.all([
        fetch(levelJsonPath).then(r => r.json()),
        fetch('/games/echoes/data/classes.json').then(r => r.json()),
        fetch('/games/echoes/data/items.json').then(r => r.json()),
        fetch('/games/echoes/data/entities.json').then(r => r.json()),
        fetch('/games/echoes/data/progression.json').then(r => r.json()),
      ]);
      _level       = levelData;
      _classes     = classesData;
      _items       = itemsData;
      _entities    = entitiesData;
      _progression = progressionData;
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
    combatAction,
    startNewGame:  _startNewGame,
    handleVictory: _handleVictory,
    session,
    levelSave,
    inventory,
    progression,
    // State accessors for ui.js
    getLevel()      { return _level; },
    getLevelState() { return _state; },
    getSession()    { return _session; },
    getClasses()    { return _classes; },
    getItems()      { return _items; },
    getEntities()   { return _entities; },
    getCombat()     { return _combat; }
  };

})();

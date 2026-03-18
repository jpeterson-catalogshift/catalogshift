# Echoes RPG — Design Reference

Developer reference for the Echoes RPG Easter egg.
Full design docs live in Notion (see Conversation Log page for IDs).
This file is the coding-session quick reference.

---

## File Structure

```
easter-egg/
  index.html              ← Level 1: Dungeon of Echoes (LIVE)
  castle/index.html       ← Level 2: Castle of Echoes (LIVE)
  forest/index.html       ← Level 3: Forest of Echoes (PLANNED)
  river/index.html        ← Level 4: River of Echoes (PLANNED)
  town/index.html         ← Level 5: Town of Echoes Hub (PLANNED)
  DESIGN.md               ← This file
```

---

## localStorage Keys

| Key | Written By | Read By | Purpose |
|---|---|---|---|
| `dungeon_save` | L1 | L1 | Level 1 progress |
| `dungeon_crosslevel` | L1 victory | L2 init | Stats carried L1→L2 |
| `castle_save` | L2 | L2 | Level 2 progress |
| `castle_crosslevel` | L2 victory | L3 init | Stats carried L2→L3 |
| `level_3_save` | L3 | L3 | Level 3 progress |
| `level_4_save` | L4 | L4 | Level 4 progress |
| `world_flags` | L1–L4 | L2–Town | Consequence carry-forward (JSON object) |
| `town_state` | Town | Town | Persistent hub state |
| `death_count` | All levels | Town ending | Running death total |
| `journal_entries` | All levels | Town journal | Auto-logged key decisions |

---

## world_flags — Complete Reference

All flags are properties on a single JSON object stored in `world_flags`.
Read with: `const flags = JSON.parse(localStorage.getItem('world_flags') || '{}')`
Write with: save the whole object back after updating a property.

### Level 1 Flags

| Flag | Set When | Used In |
|---|---|---|
| `goblin_chief_bribed` | Paid 25 gold to Goblin Chief | L3 (goblin scout recognises you), Town (tavern rumour source) |

### Level 2 Flags

| Flag | Set When | Used In |
|---|---|---|
| `prisoner_freed` | Unlocked her cell with Castle Key | L3 (she's at hermit's clearing), Town (market stall) |
| `sorcerer_spared` | Did not fight the Court Sorcerer | L3 (ingredient recognised), Town (sorcerer's tower) |

### Level 3 Flags

| Flag | Set When | Used In |
|---|---|---|
| `forest_merchant_helped` | Helped the injured merchant mid-forest | L4 (merchant vouches for you) |
| `bandit_deal_taken` | Made deal with bandit captain | L4 (smuggler contact knows you) |
| `ancient_entity_talked` | Talked to entity before fighting | L4 (extra dialogue throughout), Town (lore entry in tower) |
| `sorcerer_ingredient_found` | Picked up ingredient in Ancient Grove | Town (sorcerer's tower fully operational) |
| `prisoner_found_forest` | Found prisoner at hermit's clearing | Town (market stall unlocks) |

### Level 4 Flags

| Flag | Set When | Used In |
|---|---|---|
| `smuggler_allied` | Befriended / worked with smugglers | Town (Mysterious Stranger stall) |
| `smuggler_destroyed` | Killed smuggler boss | Town (no stall, small merchant discount) |
| `spirits_allied` | Befriended river spirits | Town (temple enhancement) |
| `merchant_allied` | Helped and crossed with merchants | Town (shop expansion, better prices) |
| `faction_peace_brokered` | Brokered peace between smugglers and spirits | Town (River Trader's Post) |
| `mercenary_captain_recruited` | Convinced captain to join | Town (bounty board expansion, stables guard) |
| `mercenary_captain_fought` | Defeated the captain | Town (no bounty board expansion) |
| `dam_destroyed` | Destroyed the dam | Town (required for thriving state) |

---

## Level Structure Summary

### Level 1 — Dungeon of Echoes (41 nodes)
- Class select → two-wing dungeon → Elder Dragon
- Key mechanic: rune riddle (Ancient Tome), sneak attack, flood bonus, bribeable chief

### Level 2 — Castle of Echoes (35 nodes)
- Stats carry from L1 → Shadow King final boss
- Key mechanic: Crown Fragment (+35 ATK), prisoner rescue, sorcerer encounter

### Level 3 — Forest of Echoes (78 nodes)
- Two parallel paths (Bandit Road / Old Trail) converging at Deep Forest
- Dead End A: Hermit's Clearing — Grove Sigil (hard gate for Treant Warden)
- Dead End B: Ruined Watchtower — Ancient Torch (soft gate for final boss)
- Sub-boss: Shadow Beast
- Final boss: Ancient Entity (corrupted forest guardian)
- Key reveal: corruption source is the river upstream

### Level 4 — River of Echoes (80 nodes)
- Three factions: Smugglers / River Spirits / Merchants
- Crossing method depends on faction relationships
- Sub-boss: River Monster (avoidable via faction routes)
- Final boss: corrupt trade lord who built the dam
- Key mechanic: faction conflict — can broker peace or choose a side

### Level 5 — Town of Echoes (Hub)
- Persistent hub, not a linear level
- Buildings unlock based on world_flags from Levels 1–4
- Catch-up quests at Inn/Tavern for missed actions
- Final ending only available when dam_destroyed + major flags resolved

---

## Town Buildings & Unlock Conditions

| Building | Unlocked By |
|---|---|
| Shop | Always open. Expands with `merchant_allied` |
| Inn | Always open |
| Bakery | Always open |
| Blacksmith | Always open |
| Tavern | Always open |
| Sorcerer's Tower | `sorcerer_spared` + `sorcerer_ingredient_found` |
| Market Stall | `prisoner_freed` + `prisoner_found_forest` |
| Temple | Always open. Enhanced by `spirits_allied` |
| Stables | Always open. Guard added by `mercenary_captain_recruited` |
| Notice Board | Always present. Expands with `mercenary_captain_recruited` |
| Mysterious Stranger's Stall | `smuggler_allied` only |
| River Trader's Post | `faction_peace_brokered` only |

---

## Catch-Up Quests (Inn / Tavern)

If a flag-setting action was missed, the Town posts a quest to go back:

| Missed | Quest Source | Unlocks |
|---|---|---|
| Prisoner not freed (L2) | Innkeeper | Market Stall |
| Sorcerer not spared (L2) | Barkeep / Stranger | Sorcerer's Tower |
| Hermit not found (L3) | Inn notice board | Grove Sigil / ingredient access |
| Goblin Chief not bribed (L1) | Tavern notice board | Goblin tavern contact |
| No L4 faction allied | Barkeep rumours | Relevant building |

---

## Color Themes

| Level | Background | Text | Title/Accent |
|---|---|---|---|
| Dungeon | #06060c | #c8b88a | #e8c87a (amber) |
| Castle | #0c180c | #c8b88a | #a8d878 (green) |
| Forest | TBD | TBD | Deep green/brown |
| River | TBD | TBD | Blue/teal |
| Town | TBD | TBD | Warm amber/gold |

---

## Recurring Characters

| Character | Introduced | Full Journey |
|---|---|---|
| The Prisoner | L2 dungeons | Freed → L3 hermit clearing → Town market stall |
| Court Sorcerer | L2 great hall | Spared → L3 ingredient → Town sorcerer's tower |
| Goblin Chief | L1 | Bribed → L3 scout encounter → Town tavern rumour |
| Travelling Merchant | L3 forest edge | Helped → L4 river bank → Town shop |

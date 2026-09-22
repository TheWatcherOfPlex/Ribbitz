// Ribbitz level-up presets — Phase 5, scoped per owner decision 2026-09-22:
// ONLY current-level-through-20, never below current level (see
// docs/REBUILD_PLAN.md's Phase 5 section for the full reasoning). Owner
// chose (2026-09-22, via AskUserQuestion) to put all 3 remaining levels
// into Druid: Ranger stays at 6, Druid goes 11 -> 12 -> 13 -> 14.
//
// Rules edition: 2014 5e core rules (NOT the 2024/5.5e revision) — owner
// confirmed 2026-09-22. Circle of Spores is a Tasha's Cauldron of
// Everything (2020) subclass, which is a 2014-ruleset supplement, so it's
// consistent with that.
//
// IMPORTANT — HP is deliberately NOT included here. Owner (2026-09-22):
// "dont roll my health level ups for each of those, my DM likes us to do
// that live." Every level entry below has an `hpNote` reminder instead of
// a computed/rolled HP value — do not add one without being asked again.
//
// IMPORTANT — spell slots are shown as the RAW PHB multiclass table
// value, NOT silently reconciled with the character's actual live sheet.
// The live sheet's caster-level-14 slots (current, level 17) are missing
// the 7th-level slot that RAW says should exist at that combined caster
// level (Ranger 6 => 3 half-caster levels + Druid 11 = 14 combined) —
// this is the SAME "7th-level spell slot" discrepancy already flagged
// and deliberately left unfixed by the 2026-09-12 math audit (see
// REBUILD_PLAN.md's deferred-backlog notes). Projecting these presets
// forward from RAW rather than from the sheet's actual (short-by-one)
// value would either silently perpetuate that gap or silently "fix" it
// without the owner's say-so — neither is this system's call to make.
// `sheetDiscrepancyNote` surfaces this explicitly so the owner and their
// DM can decide together when they actually reach these levels.
//
// Sources checked 2026-09-22 (WebFetch against 5thsrd.org's mirror of the
// PHB multiclass spellcaster table, and dnd5e.wikidot.com for Circle of
// Spores' Fungal Body text):
// - https://5thsrd.org/rules/multiclassing/
// - https://dnd5e.wikidot.com/druid:spores

export const RIBBITZ_LEVEL_PRESETS = [
  {
    level: 17,
    isCurrent: true,
    rangerLevel: 6,
    druidLevel: 11,
    combinedCasterLevel: 14,
    proficiencyBonus: '+6',
    spellSlotsRAW: { '1st': 4, '2nd': 3, '3rd': 3, '4th': 3, '5th': 2, '6th': 1, '7th': 1, '8th': 0, '9th': 0 },
    sheetDiscrepancyNote:
      "Live sheet currently shows no 7th-level slot at this combined caster level, but the RAW PHB multiclass table says there should be one (1). Known, previously-flagged discrepancy — not fixed here, decide with your DM.",
    newFeatures: [],
    hpNote: 'Current level — no new HP to roll.',
    notes: 'Baseline/reference row — this is where Ribbitz is right now, not a level-up.',
  },
  {
    level: 18,
    isCurrent: false,
    rangerLevel: 6,
    druidLevel: 12,
    combinedCasterLevel: 15,
    proficiencyBonus: '+6',
    spellSlotsRAW: { '1st': 4, '2nd': 3, '3rd': 3, '4th': 3, '5th': 2, '6th': 1, '7th': 1, '8th': 1, '9th': 0 },
    sheetDiscrepancyNote:
      'Same known 7th-level-slot discrepancy as level 17 carries forward — decide with your DM whether to correct it before/at this level.',
    newFeatures: [
      {
        name: 'Ability Score Improvement (Druid)',
        source: 'Druid class feature, level 12',
        summary: 'Increase one ability score by 2, or two scores by 1 each, or take a feat — a player choice, not pre-filled here.',
      },
    ],
    hpNote: 'Roll HP live with your DM when you take this level — not pre-rolled.',
    notes: '',
  },
  {
    level: 19,
    isCurrent: false,
    rangerLevel: 6,
    druidLevel: 13,
    combinedCasterLevel: 16,
    proficiencyBonus: '+6',
    spellSlotsRAW: { '1st': 4, '2nd': 3, '3rd': 3, '4th': 3, '5th': 2, '6th': 1, '7th': 1, '8th': 1, '9th': 0 },
    sheetDiscrepancyNote: 'Same known 7th-level-slot discrepancy carries forward.',
    newFeatures: [
      {
        name: 'More prepared spells',
        source: 'Druid class rule (Wisdom modifier + Druid level)',
        summary: 'Prepared spell count increases automatically with Druid level — which spells to prepare is a player choice at the table, not pre-filled here.',
      },
    ],
    hpNote: 'Roll HP live with your DM when you take this level — not pre-rolled.',
    notes: 'No new class or subclass feature at Druid 13 itself.',
  },
  {
    level: 20,
    isCurrent: false,
    rangerLevel: 6,
    druidLevel: 14,
    combinedCasterLevel: 17,
    proficiencyBonus: '+6',
    spellSlotsRAW: { '1st': 4, '2nd': 3, '3rd': 3, '4th': 3, '5th': 2, '6th': 1, '7th': 1, '8th': 1, '9th': 1 },
    sheetDiscrepancyNote: 'Same known 7th-level-slot discrepancy carries forward.',
    newFeatures: [
      {
        name: 'Fungal Body',
        source: 'Circle of Spores subclass feature, Druid level 14',
        summary:
          "The fungal spores in your body alter you: you can't be blinded, deafened, frightened, or poisoned, and any critical hit against you counts as a normal hit instead, unless you're incapacitated.",
      },
    ],
    hpNote: 'Roll HP live with your DM when you take this level — not pre-rolled.',
    notes: 'This is the level cap (20) with the owner-chosen Ranger 6 / Druid 14 split.',
  },
]

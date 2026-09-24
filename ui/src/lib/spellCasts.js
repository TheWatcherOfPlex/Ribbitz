// Spell casting data — Phase (2026-09-24), owner request: "go through all
// the spells and any that require me to roll, make a button for that."
// Keyed by the same slug the spell list already uses (slugifyHeading of
// the spell name). Sourced from ui/public/content/Spells and Magic
// Abilities.md's "Official Text" for each spell — read in full before
// writing this, not guessed. Every spell's to-hit/DC uses the character's
// flat spell-attack (+10) / spell-dc (18) from statMap — unlike weapons,
// there's no per-spell variation there, so no per-entry override needed.
//
// `kind`:
//   'spell-attack'        — Ribbitz makes a spell attack roll; damage only
//                            applies on a hit.
//   'melee-spell-attack'  — same as above but explicitly melee range (Contagion).
//   'save-negates'        — target makes a save; full damage on fail, ZERO
//                            on success (not half) — e.g. Poison Spray.
//   'save-half'           — target makes a save; full damage on fail, HALF
//                            (round down) on success — e.g. Moonbeam.
//   'heal'                — no attack/save at all, just a healing roll,
//                            usually with a choice of slot level.
//   'ability-check'       — Ribbitz makes his own ability check (not the
//                            target's save) — e.g. Dispel Magic.
//
// `damage`: array of { label, die, dmgType } — dmgType keys into the
// --dmg-* CSS custom properties (themes.css) for consistent color-coding.
// Multiple entries = the caster picks one at cast time (e.g. Toll the
// Dead's uninjured-vs-injured die).
//
// `heal`: array of { label, die, includeWisMod } for 'heal' kind.
export const SPELL_CASTS = {
  // --- Cantrips ---
  'poison-spray': {
    kind: 'save-negates',
    saveAbility: 'Constitution',
    damage: [{ label: 'Poison', die: '4d12', dmgType: 'poison' }],
  },
  'primal-savagery': {
    kind: 'spell-attack',
    damage: [{ label: 'Acid', die: '4d10', dmgType: 'acid' }],
  },
  'chill-touch': {
    kind: 'spell-attack',
    damage: [{ label: 'Necrotic', die: '4d8', dmgType: 'necrotic' }],
  },
  'toll-the-dead': {
    kind: 'save-negates',
    saveAbility: 'Wisdom',
    damage: [
      { label: 'Uninjured target', die: '4d8', dmgType: 'necrotic' },
      { label: 'Injured target', die: '4d12', dmgType: 'necrotic' },
    ],
  },

  // --- 1st level ---
  'cure-wounds': {
    kind: 'heal',
    heal: [
      { label: '1st-level slot', die: '1d8', includeWisMod: true },
      { label: '2nd-level slot', die: '2d8', includeWisMod: true },
      { label: '3rd-level slot', die: '3d8', includeWisMod: true },
    ],
  },

  // --- 2nd level ---
  // NOTE: slugifyHeading() does NOT strip parenthetical suffixes like
  // "(Concentration)" — it only replaces non-alphanumerics with dashes —
  // so these two keys must include "-concentration" to match the real
  // slug produced from each spell's actual <h3> heading text. Caught this
  // by checking against slugifyHeading's actual behavior before shipping,
  // not by guessing the slug from the spell name alone.
  'healing-spirit-concentration': {
    kind: 'heal',
    heal: [
      { label: '2nd-level slot (per use)', die: '1d6', includeWisMod: false },
      { label: '3rd-level slot (per use)', die: '2d6', includeWisMod: false },
    ],
  },
  'moonbeam-concentration': {
    kind: 'save-half',
    saveAbility: 'Constitution',
    damage: [{ label: 'Radiant', die: '2d10', dmgType: 'radiant' }],
  },

  // --- 4th level ---
  blight: {
    kind: 'save-half',
    saveAbility: 'Constitution',
    damage: [{ label: 'Necrotic', die: '8d8', dmgType: 'necrotic' }],
  },

  // --- 5th level ---
  'mass-cure-wounds': {
    kind: 'heal',
    heal: [{ label: '5th-level slot', die: '3d8', includeWisMod: true }],
  },
  cloudkill: {
    kind: 'save-half',
    saveAbility: 'Constitution',
    damage: [{ label: 'Poison', die: '5d8', dmgType: 'poison' }],
  },
  contagion: {
    kind: 'melee-spell-attack',
    note: 'On a hit: target is afflicted with a disease of your choice (DM may pick instead) — no direct damage, see the spell text for the 6 disease options.',
  },

  // --- 3rd level ---
  'dispel-magic': {
    kind: 'ability-check',
    checkLabel: 'Wisdom (vs. 10 + the spell’s level, for spells 4th level or higher)',
  },
}

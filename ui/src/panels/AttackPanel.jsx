import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatControl from '../components/StatControl.jsx'
import { rollDice, rollDamage, parseStatNumber } from '../lib/diceRoller.js'

// Extracted from KitPanel.jsx (Weapons + Ammo half only) — split out per
// owner request 2026-09-23: "Weapons, Ammo, Drugs & Herbs, Grung Abilities"
// combined into one panel was too crowded. Drugs & Herbs moved to
// InventoryPanel.jsx, Grung Abilities to GrungPanel.jsx. See
// docs/PROGRESS_LOG.md 2026-09-23 for the attack-button math sourcing.
//
// Attack/damage math: the to-hit and damage FLAT bonuses are broken into
// real labeled parts (Dexterity Modifier, Proficiency Bonus pulled live
// from statMap; the weapon's own fixed bonuses — Archery Fighting Style,
// magic weapon bonus, Fey Blessing, Sharpshooter Penalty — hardcoded per
// weapon since they're weapon properties, not sheet-tracked stats). These
// exact numbers are sourced from ui/public/content/Actions.md's own
// documented "Attack Roll Breakdown" section per weapon, verified there
// to reconcile to the live sheet's combined to-hit values (e.g. Blowgun
// Standard = DEX(5) + PB(6) + Archery(2) + Magic(1) = 14, matching
// statMap['blowgun-hit']). If those combined values on the sheet ever
// change for a reason other than DEX/PB drifting, these hardcoded
// per-weapon bonuses will need re-checking against Actions.md.
const standardArrowsName = 'Arrows'
const standardBlowgunDartsName = 'Blowgun Darts'
const pondPoppersName = 'Pond Poppers (x5)'

const ATTACK_MODES = {
  standard: 'Standard',
  heavy: 'Heavy (Sharpshooter)',
  dreadAmbusher: 'Dread Ambusher (Round 1 bonus attack)',
}

// Elemental ammo bonus damage — sourced from ui/public/content/Inventory.md's
// "Ammunition & Weapons" section (Fire Darts: 1d8 Piercing + 1d6 Fire; Water
// Darts: 1d8 Piercing + 1d6 Water; Lava Darts: 1d8 Piercing + "Lava effects",
// no clean die given). Only Darts are explicitly documented there — Arrows
// get the same 4 elemental variants tracked in `vitals` (arrowFire/
// arrowWater/arrowLava) with the identical structure, so the same +1d6
// fire/water rule is applied to them by analogy, NOT because it's separately
// documented for arrows. Flag this to the owner if arrows ever turn out to
// work differently.
const AMMO_TYPES = [
  { id: 'standard', label: 'Standard', elementalDie: null },
  { id: 'fire', label: 'Fire', elementalDie: '1d6' },
  { id: 'water', label: 'Water', elementalDie: '1d6' },
  { id: 'lava', label: 'Lava', elementalDie: null }, // "Lava effects" — no die documented
]

function AttackButton({ label, onClick }) {
  return (
    <button type="button" className="attack-panel__roll-btn" onClick={onClick}>
      {label}
    </button>
  )
}

// Owner ask (2026-09-23): "add equipped buttons to each ammo type for darts
// and arrows. By default standard is selected, but if we switch to a
// different type of ammo it adds that ammo type to our roll." This is the
// toggle row — clicking a type sets it as the currently-equipped ammo for
// that weapon's damage rolls (Standard/Fire/Water/Lava), default Standard.
function AmmoSelector({ equippedId, onSelect }) {
  return (
    <div className="attack-panel__ammo-select">
      {AMMO_TYPES.map((type) => (
        <button
          key={type.id}
          type="button"
          className={`attack-panel__ammo-select-btn${equippedId === type.id ? ' attack-panel__ammo-select-btn--active' : ''}`}
          onClick={() => onSelect(type.id)}
        >
          {type.label}
        </button>
      ))}
    </div>
  )
}

// Ranged weapon: Standard / Heavy(Sharpshooter) / Dread Ambusher to-hit
// buttons, plus Standard/Heavy damage buttons. Dread Ambusher uses the
// SAME math as Standard — per ui/public/content/Actions.md, Dread Ambusher
// isn't a different formula, it's simply the 3rd attack the character gets
// on the first round of combat (Gloom Stalker feature) — this button just
// gives it its own clearly-labeled slot for round-1 tracking.
function RangedWeapon({
  name,
  linkTo,
  dexMod,
  proficiency,
  weaponBonusLabel,
  weaponBonus,
  dmgDie,
  dmgFlatLabel,
  dmgBonus,
  ammoType,
}) {
  const hasCore = Number.isFinite(dexMod) && Number.isFinite(proficiency) && Number.isFinite(weaponBonus)
  const standardHitParts = [
    { label: 'Dexterity Modifier', value: dexMod },
    { label: 'Proficiency Bonus', value: proficiency },
    { label: weaponBonusLabel, value: weaponBonus },
  ]
  const heavyHitParts = [...standardHitParts, { label: 'Sharpshooter Penalty', value: -5 }]
  // Damage's flat bonus is NOT the same as the to-hit weaponBonus above —
  // e.g. Longbow's Archery Fighting Style (+2) adds to the ATTACK roll
  // only, never to damage, so damage only gets DEX + the magic weapon
  // bonus. Always pass dmgBonus explicitly rather than reusing weaponBonus.
  const standardDmgParts = dmgFlatLabel ? [{ label: dmgFlatLabel, value: dexMod + dmgBonus }] : []
  const heavyDmgParts = [...standardDmgParts, { label: 'Sharpshooter Bonus', value: 10 }]

  // Equipped ammo (Standard/Fire/Water/Lava) adds its own die on top of the
  // weapon's own damage die, e.g. Fire dart = weapon's 1d8 + 1d6 fire. Lava
  // has no documented bonus die, so it just rolls the base weapon damage.
  const elementalDie = ammoType?.elementalDie
  const standardDieNotation = elementalDie ? `${dmgDie}+${elementalDie}` : dmgDie
  const heavyDieNotation = elementalDie ? `${dmgDie}+${elementalDie}` : dmgDie
  const ammoSuffix = ammoType && ammoType.id !== 'standard' ? ` + ${ammoType.label}` : ''

  return (
    <div className="attack-panel__weapon">
      <Link className="attack-panel__weapon-name" to={linkTo}>
        {name}
      </Link>

      <div className="attack-panel__group">
        <span className="attack-panel__group-label">Attack</span>
        <AttackButton
          label={ATTACK_MODES.standard}
          onClick={() => hasCore && rollDice(`${name} — ${ATTACK_MODES.standard} Attack`, standardHitParts)}
        />
        <AttackButton
          label={ATTACK_MODES.heavy}
          onClick={() => hasCore && rollDice(`${name} — ${ATTACK_MODES.heavy} Attack`, heavyHitParts)}
        />
        <AttackButton
          label={ATTACK_MODES.dreadAmbusher}
          onClick={() => hasCore && rollDice(`${name} — ${ATTACK_MODES.dreadAmbusher}`, standardHitParts)}
        />
      </div>

      <div className="attack-panel__group">
        <span className="attack-panel__group-label">Damage</span>
        <AttackButton
          label={`Standard${ammoSuffix} (${standardDieNotation}${
            standardDmgParts.length ? '+' + standardDmgParts[0].value : ''
          })`}
          onClick={() => rollDamage(`${name} — Standard Damage${ammoSuffix}`, standardDieNotation, standardDmgParts)}
        />
        <AttackButton
          label={`Heavy${ammoSuffix} (${heavyDieNotation}+${heavyDmgParts.reduce((s, p) => s + p.value, 0)})`}
          onClick={() => rollDamage(`${name} — Heavy Damage${ammoSuffix}`, heavyDieNotation, heavyDmgParts)}
        />
      </div>
    </div>
  )
}

// Melee weapon: just a Standard to-hit + Standard damage button — no
// Sharpshooter (ranged-only feat) and the owner scoped Dread Ambusher to
// ranged weapons specifically (2026-09-23).
function MeleeWeapon({
  name,
  linkTo,
  dexMod,
  proficiency,
  weaponBonusLabel,
  weaponBonus,
  dmgDie,
  dmgFlatLabel,
  dmgBonus,
}) {
  const hasCore = Number.isFinite(dexMod) && Number.isFinite(proficiency) && Number.isFinite(weaponBonus)
  const hitParts = [
    { label: 'Dexterity Modifier', value: dexMod },
    { label: 'Proficiency Bonus', value: proficiency },
    ...(weaponBonus ? [{ label: weaponBonusLabel, value: weaponBonus }] : []),
  ]
  const dmgParts = dmgFlatLabel ? [{ label: dmgFlatLabel, value: dexMod + dmgBonus }] : []

  return (
    <div className="attack-panel__weapon">
      <Link className="attack-panel__weapon-name" to={linkTo}>
        {name}
      </Link>

      <div className="attack-panel__group">
        <span className="attack-panel__group-label">Attack</span>
        <AttackButton
          label={ATTACK_MODES.standard}
          onClick={() => hasCore && rollDice(`${name} — Attack`, hitParts)}
        />
      </div>

      <div className="attack-panel__group">
        <span className="attack-panel__group-label">Damage</span>
        <AttackButton
          label={`${dmgDie}${dmgParts.length ? '+' + dmgParts[0].value : ''}`}
          onClick={() => rollDamage(`${name} — Damage`, dmgDie, dmgParts)}
        />
      </div>
    </div>
  )
}

export default function AttackPanel({
  statMap,
  vitals,
  updateVital,
  setInventoryItemValue,
  standardBlowgunDartsQuantity,
  standardArrowsQuantity,
  pondPoppersQuantity,
}) {
  const dexMod = parseStatNumber(statMap?.['dex-mod'])
  const proficiency = parseStatNumber(statMap?.['proficiency'])

  // Which ammo type is currently "loaded" per weapon — defaults to Standard,
  // per the owner's ask. Session-local (not persisted to the sheet); this is
  // about which ammo you just loaded for THIS attack, not inventory state.
  const [blowgunAmmoId, setBlowgunAmmoId] = useState('standard')
  const [longbowAmmoId, setLongbowAmmoId] = useState('standard')
  const blowgunAmmo = AMMO_TYPES.find((t) => t.id === blowgunAmmoId)
  const longbowAmmo = AMMO_TYPES.find((t) => t.id === longbowAmmoId)

  return (
    <div className="panel__content attack-panel">
      <div className="attack-panel__section">
        <div className="attack-panel__title">Weapons</div>

        <RangedWeapon
          name="Blowgun +1"
          linkTo="/actions#vanguard-blowgun-1-broken---single-shot"
          dexMod={dexMod}
          proficiency={proficiency}
          weaponBonusLabel="Archery Style + Magic Weapon"
          weaponBonus={3}
          dmgDie="1d8"
          dmgFlatLabel={null}
          dmgBonus={0}
          ammoType={blowgunAmmo}
        />

        <RangedWeapon
          name="Longbow +2"
          linkTo="/actions#skywardens-longbow-2"
          dexMod={dexMod}
          proficiency={proficiency}
          weaponBonusLabel="Archery Style + Magic Weapon"
          weaponBonus={4}
          dmgDie="1d10"
          dmgFlatLabel="Dexterity + Magic Weapon"
          dmgBonus={2}
          ammoType={longbowAmmo}
        />

        <MeleeWeapon
          name="Dagger +1 — Fey Blessed"
          linkTo="/actions#dagger-1-fey-blessing"
          dexMod={dexMod}
          proficiency={proficiency}
          weaponBonusLabel="Fey Blessing"
          weaponBonus={1}
          dmgDie="1d4"
          dmgFlatLabel="Dexterity + Fey Blessing"
          dmgBonus={1}
        />

        <MeleeWeapon
          name="Dagger — Poison Dipped"
          linkTo="/actions#dagger-non-magical-poison-dipped"
          dexMod={dexMod}
          proficiency={proficiency}
          weaponBonusLabel=""
          weaponBonus={0}
          dmgDie="1d4"
          dmgFlatLabel="Dexterity Modifier"
          dmgBonus={0}
        />
      </div>

      <div className="attack-panel__section">
        <div className="attack-panel__title">Ammo</div>
        <div className="panel__content--ammo combat-kit__ammo">
          <div className="ammo-group">
            <div className="ammo-group__title">Blowgun Darts</div>
            <StatControl
              label="Standard"
              value={standardBlowgunDartsQuantity}
              onChange={(nextValue) => setInventoryItemValue(standardBlowgunDartsName, nextValue)}
            />
            <StatControl label="Fire" value={vitals.dartFire} onChange={updateVital('dartFire')} />
            <StatControl label="Water" value={vitals.dartWater} onChange={updateVital('dartWater')} />
            <StatControl label="Lava" value={vitals.dartLava} onChange={updateVital('dartLava')} />
            <AmmoSelector equippedId={blowgunAmmoId} onSelect={setBlowgunAmmoId} />
          </div>
          <div className="ammo-group">
            <div className="ammo-group__title">Arrows</div>
            <StatControl
              label="Standard"
              value={standardArrowsQuantity}
              onChange={(nextValue) => setInventoryItemValue(standardArrowsName, nextValue)}
            />
            <StatControl label="Fire" value={vitals.arrowFire} onChange={updateVital('arrowFire')} />
            <StatControl label="Water" value={vitals.arrowWater} onChange={updateVital('arrowWater')} />
            <StatControl label="Lava" value={vitals.arrowLava} onChange={updateVital('arrowLava')} />
            <AmmoSelector equippedId={longbowAmmoId} onSelect={setLongbowAmmoId} />
          </div>
          <div className="ammo-group ammo-group--single">
            <StatControl
              label="Pond Poppers"
              value={pondPoppersQuantity}
              onChange={(nextValue) => setInventoryItemValue(pondPoppersName, nextValue)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

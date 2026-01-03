<!--
Ribbitz document: Actions
Primary purpose: combat reference with clear action economy.
-->

# ⚔️ Actions (Combat)

**Navigation:**
- ⬅️ [README](./README.md)
- 📄 [Basic Stats](./Basic%20Stats.md)
- 🎒 [Inventory](./Inventory.md)
- ✨ [Class Features](./Class%20Features.md)
- ✨ [Spells & Magic Abilities](./Spells_and_Magic_Abilities.md)
- 📜 [Backstory](./Backstory.md)

---

> **At-a-glance:** Blowgun is the main weapon. Most turns are **4 shots**, first round can be **6 shots**.

<span style="color:#8a2be2"><b>Homebrew note:</b></span> this page contains Ribbitz-specific weapon rules.

---

## 🎯 Attacks

### Vanguard Double-Barrel Blowgun (+1)

#### Core Statline

| Item | Value |
|---|---|
| **Range** | 25/100 *(Sharpshooter: no disadvantage at long range)* |
| **Properties** | Loading, Double-Barrel (homebrew), +1 magic |
| **Per-shot damage** | `1d8` piercing *(rolled per hit)* |
| **Elemental rider** | `1d6` elemental *(rolled per hit; separate roll for damage type split)* |

#### Attack Rolls (per barrel shot)

| Mode | To Hit | Damage |
|---|---:|---|
| **Standard** | **+13** | `1d8` piercing + `1d6` elemental |
| **Sharpshooter** | **+8** | `1d8 + 10` piercing + `1d6` elemental |

**Hit math:** `DEX 5 + PB 5 + Archery 2 + Magic 1 = +13`

#### Double-Barrel / Number of Shots

- When you take the **Attack** action, you fire **2 shots per attack** (one per barrel).
- **Normal turns:** 2 attacks × 2 barrels = **4 shots**
- **First round (Dread Ambusher):** 3 attacks × 2 barrels = **6 shots**

#### Quick Roll Order (fast turns)

1) **Hit:** Blowgun `Std/Hv xN Atk`

2) **Piercing:** Blowgun `Std/Hv xN Dmg`

3) **Elemental:** Blowgun `Elemental xN Dmg`

#### Note (Damage History)

This weapon originally dealt **8 flat** (1 base + DEX + 1 Fey Inverted Water Fall Blessing + a damage-only bonus from Rob Catagasts forge).
That flat 8 damage was too strong, so the DM converted it to **1d8**.

---
### Other Attacks (Quick)

| Attack | To Hit | Damage | Notes |
|---|---:|---|---|
| **Dagger +1** | **+11** | `1d4 + 6` | melee or thrown (20/60) |
| **Dagger (non-magical)** | **+10** | `1d4 + 5` | melee or thrown (20/60); may be poison-dipped |
| **Unarmed Strike** | **+7** | `1 + 2` bludgeoning | |
| **Bite** | **+7** | `1d6 + 2` piercing | |
| **Tongue Slap** *(Grung v4)* | **+7** | `1d6 + 2` piercing | range 10/15 |

---

## 🧩 Special Actions

### Tongue Grapple
- **Range:** 10/15
- **Effect:** grapple / pull up to **10 ft**
- **Check:** target DEX save vs your STR (Athletics)
- **Uses:** PB per Long Rest *(PB=5)*

### Poison Skin (Passive)
- Trigger: any creature grapples you or directly contacts your skin/saliva
- **Save:** CON **DC 17** = `12 + PB (5)`
- **Duration:** 1 minute
- Repeat save: if no longer in contact, target repeats save at end of turn

### Poison Weapon (Bonus Action)
- Apply Grung poison to a weapon
- **Save:** CON **DC 17** = `9 + PB (5) + CON mod (3)`
- **Uses:** PB per day *(PB=5)*
- Requirement: must have moistened/submerged within last 24h

### Halo of Spores (Reaction)
- Trigger: enemy within 10 ft
- **Save:** CON vs Spell Save DC **17**
- **Damage:** `1d6` necrotic *(roll twice = `2d6` while Symbiotic Entity is active)*

---

## 🐸 Blowgun Options (Homebrew)

### Song of the Grung (1/day)
- **Action:** 1 action (croak into blowgun)
- **Range:** 30 ft line
- **Save:** CON vs Spell Save DC **17**
- **Damage:** `2d8` thunder (half on success)
- **On failed save:** push 10 ft away from caster; deafened rider effects

> Full text + trackers live in: [Spells & Magic Abilities](./Spells_and_Magic_Abilities.md)

### Double-Barrel (Bonus Action)
- Shoot at multiple (2) enemies.

### Hot-Swap (Free Action)
- Swap damage types at any time.

### Poison Darts (Usage Limits)

| Dart | Uses | Save | Effect |
|---|---:|---:|---|
| **Sleep** | 1/day | CON 17 | Unconscious 1 min |
| **Paralyze** | 1/day | CON 17 | Paralyzed 1 min |
| **Purple Grung** | 5/day | CON 17 | Seek water 1 min |

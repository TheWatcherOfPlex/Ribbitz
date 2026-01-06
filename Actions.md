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
- ✨ [Spells & Magic Abilities](./Spells%20and%20Magic%20Abilities.md)
- 📜 [Backstory](./Backstory.md)
- 📚 [Reference Materials](./Reference%20Materials/)

> 💡 **Tip:** Click section to see attacks/abilities → Click individual item for full details

---

<details>
<summary><h2>🎯 Attacks</h2></summary>

<details>
<summary><h3>Vanguard Blowgun (+1) *(Broken - Single Shot)*</h3></summary>

#### Core Stats

| Item | Value |
|---|---|
| **Weight** | 1 lb |
| **Range** | 25/100 *(Ribbits has Sharpshooter feat: no disadvantage at long range)* |
| **Properties** | +1 magic *(broken in half - no longer double-barrel)* |
| **Per-shot damage** | `1d8` piercing *(rolled per hit)* |
| **Elemental damage** | `1d6` elemental *(rolled per elemental hit)* |

#### Attack Roll Breakdown

**To Hit Calculation:**
- **Standard:** DEX (5) + Proficiency (5) + Archery Fighting Style (2) + Magic Weapon (1) = **+13**
- **Sharpshooter:** DEX (5) + Proficiency (5) + Archery (2) + Magic (1) - Sharpshooter Penalty (5) = **+8**

#### Damage Ranges (Per Shot)

| Attack Type | Min | Avg | Max | Formula |
|-------------|----:|----:|----:|---------|
| **Standard** | 1 | 4.5 | 8 | 1d8 |
| **Standard + Elemental** | 2 | 9 | 14 | 1d8 + 1d6 |
| **Heavy (Sharpshooter)** | 11 | 14.5 | 18 | 1d8 + 10 |
| **Heavy + Elemental** | 12 | 19 | 24 | 1d8 + 10 + 1d6 |

#### Number of Shots

- When you take the **Attack** action, you fire **1 shot per attack**.
- **Normal turns:** 2 attacks = **2 shots**
- **First round (Dread Ambusher):** 3 attacks = **3 shots**

#### Hot-Swap (Free Action)
- Swap damage types at any time.

#### Poison Darts (Usage Limits)

| Dart | Uses | Save | Effect |
|---|---:|---:|---|
| **Sleep** | 1/day | CON 17 | Unconscious 1 min |
| **Paralyze** | 1/day | CON 17 | Paralyzed 1 min |
| **Purple Grung** | 5/day | CON 17 | Seek water 1 min |

#### Song of the Grung (1/day)
- **Action:** 1 action (croak into blowgun)
- **Range:** 30 ft line
- **Save:** CON vs Spell Save DC **17**
- **Damage:** `2d8` thunder (half on success)
- **On failed save:** push 10 ft away from caster; deafened + rider effects

> Full text + trackers live in: [Spells & Magic Abilities](./Spells%20and%20Magic%20Abilities.md)

#### Note (Damage History)

This weapon originally dealt **10 flat** (1 base + DEX + 1 Fey Inverted Water Fall Blessing + a damage-only bonus from Rob Catagasts forge).
That flat 10 damage was too strong, so the DM converted it to **1d8**.

</details>

<details>
<summary><h3>Skywarden's Longbow +2</h3></summary>

#### Core Stats

| Item | Value |
|---|---|
| **Weight** | 2 lbs |
| **Range** | 150/600 *(no disadvantage at long range with Sharpshooter feat)* |
| **Properties** | +2 magic weapon, illumination |
| **Damage** | `1d10 + 7` piercing *(per hit)* |

#### Attack Roll Breakdown

**To Hit Calculation:**
- **Standard:** DEX (5) + Proficiency (5) + Archery Fighting Style (2) + Magic Weapon (2) = **+14**
- **Sharpshooter:** DEX (5) + Proficiency (5) + Archery (2) + Magic (2) - Sharpshooter Penalty (5) = **+9**

#### Damage Ranges (Per Shot)

| Attack Type | Min | Avg | Max | Formula |
|-------------|----:|----:|----:|---------|
| **Standard** | 8 | 12.5 | 17 | 1d10 + 7 |
| **Standard + Elemental** | 9 | 17 | 23 | 1d10 + 7 + 1d6 |
| **Heavy (Sharpshooter)** | 18 | 22.5 | 27 | 1d10 + 7 + 10 |
| **Heavy + Elemental** | 19 | 27 | 33 | 1d10 + 7 + 10 + 1d6 |

#### Special Features

- **Ignores Cover:** Always ignores half cover and three-quarters cover
- **Illumination:** Targets hit let off a faint light visible only to Ribbitz (tracks up to 3 targets)
- **Pierce All Cover (1/day):** Once per day, can ignore ALL cover (including total cover) against one illuminated target

</details>

<details>
<summary><h3>Other Attacks (Quick Reference)</h3></summary>

| Attack | To Hit | Damage | Notes |
|---|---:|---|---|
| **Dagger +1** | **+11** | `1d4 + 6` | melee or thrown (20/60) |
| **Dagger (non-magical)** | **+10** | `1d4 + 5` | melee or thrown (20/60); currently poison-dipped |
| **Unarmed Strike** | **+7** | `1 + 2` bludgeoning | |
| **Bite** | **+7** | `1d6 + 2` piercing | |
| **Tongue Slap** | **+7** | `1d6 + 2` piercing | range 10/15 |

</details>

</details>

---

<details>
<summary><h2>🧩 Special Actions</h2></summary>

<details>
<summary><h3>Tongue Grapple</h3></summary>

- **Range:** 10/15
- **Effect:** grapple / pull up to **10 ft**
- **Check:** target DEX save vs your STR (Athletics)
- **Uses:** PB per Long Rest *(PB=5)*

</details>

<details>
<summary><h3>Poison Skin (Passive)</h3></summary>

- **Trigger:** any creature grapples you or directly contacts your skin/saliva
- **Save:** CON **DC 17** = `9 + PB (5) + CON mod (3)`
- **Duration:** 1 minute
- **Repeat save:** if no longer in contact, target repeats save at end of turn

</details>

<details>
<summary><h3>Poison Weapon (Bonus Action)</h3></summary>

- **Apply:** Grung poison to a weapon
- **Save:** CON **DC 17** = `9 + PB (5) + CON mod (3)`
- **Uses:** PB per day *(PB=5)*
- **Requirement:** must have moistened/submerged within last 24h

</details>

<details>
<summary><h3>Halo of Spores (Reaction)</h3></summary>

- **Trigger:** enemy within 10 ft
- **Save:** CON vs Spell Save DC **17**
- **Damage:** `1d6` necrotic *(roll twice = `2d6` while Symbiotic Entity is active)*

</details>

</details>

---

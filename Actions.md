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

---

## 🎯 Attacks

### Vanguard Blowgun (+1) *(Broken - Single Shot)*

#### Core Stats

| Item | Value |
|---|---|
| **Range** | 25/100 *(Ribbits has Sharpshooter feat: no disadvantage at long range)* |
| **Properties** | +1 magic *(broken in half - no longer double-barrel)* |
| **Per-shot damage** | `1d8` piercing *(rolled per hit)* |
| **Elemental damage** | `1d6` elemental *(rolled per elemental hit)* |

#### Attack Rolls

| Mode | To Hit | Damage |
|---|---:|---|
| **Standard** | **+13** | `1d8` piercing + `1d6` elemental (If elemental dart is used) |
| **Sharpshooter Heavy Attack** | **+8** | `1d8` + piercing + `10` Sharpshooter Bonus Piercing + `1d6` elemental |

**Standard Hit math:** `DEX 5 + PB 5 + Archery 2 + Magic 1 = +13`
**Sharpshooter Heavy Attack Hit math:** `DEX 5 + PB 5 + Archery 2 + Magic 1 - 5 Sharpshooter Pentalty= +8`

#### Number of Shots

- When you take the **Attack** action, you fire **1 shot per attack**.
- **Normal turns:** 2 attacks = **2 shots**
- **First round (Dread Ambusher):** 3 attacks = **3 shots**

### Hot-Swap (Free Action)
- Swap damage types at any time.

### Poison Darts (Usage Limits)

| Dart | Uses | Save | Effect |
|---|---:|---:|---|
| **Sleep** | 1/day | CON 17 | Unconscious 1 min |
| **Paralyze** | 1/day | CON 17 | Paralyzed 1 min |
| **Purple Grung** | 5/day | CON 17 | Seek water 1 min |

### Song of the Grung (1/day)
- **Action:** 1 action (croak into blowgun)
- **Range:** 30 ft line
- **Save:** CON vs Spell Save DC **17**
- **Damage:** `2d8` thunder (half on success)
- **On failed save:** push 10 ft away from caster; deafened rider effects

> Full text + trackers live in: [Spells & Magic Abilities](./Spells%20and%20Magic%20Abilities.md)

#### Note (Damage History)

This weapon originally dealt **8 flat** (1 base + DEX + 1 Fey Inverted Water Fall Blessing + a damage-only bonus from Rob Catagasts forge).
That flat 8 damage was too strong, so the DM converted it to **1d8**.

---

### Skywarden's Longbow +2

#### Core Stats

| Item | Value |
|---|---|
| **Range** | 150/600 *(no disadvantage at long range with Sharpshooter feat)* |
| **Properties** | +2 magic weapon, illumination |
| **Damage** | `1d10` piercing *(per hit)* |

#### Attack Rolls

| Mode | To Hit | Damage |
|---|---:|---|
| **Standard** | **+14** | `1d10 + 7` piercing |
| **Sharpshooter** | **+9** | `1d10 + 17` piercing |

**Hit math:** `DEX 5 + PB 5 + Archery 2 + Magic 2 = +14`

#### Special Features

- **Ignores Cover:** Always ignores half cover and three-quarters cover
- **Illumination:** Targets hit let off a faint light visible only to Ribbitz (tracks up to 3 targets)
- **Pierce All Cover (1/day):** Once per day, can ignore ALL cover (including total cover) against one illuminated target

---

### Other Attacks (Quick)

| Attack | To Hit | Damage | Notes |
|---|---:|---|---|
| **Dagger +1** | **+11** | `1d4 + 6` | melee or thrown (20/60) |
| **Dagger (non-magical)** | **+10** | `1d4 + 5` | melee or thrown (20/60); currently poison-dipped |
| **Unarmed Strike** | **+7** | `1 + 2` bludgeoning | |
| **Bite** | **+7** | `1d6 + 2` piercing | |
| **Tongue Slap** | **+7** | `1d6 + 2` piercing | range 10/15 |

---

## 🧩 Special Actions

### Tongue Grapple
- **Range:** 10/15
- **Effect:** grapple / pull up to **10 ft**
- **Check:** target DEX save vs your STR (Athletics)
- **Uses:** PB per Long Rest *(PB=5)*

### Poison Skin (Passive)
- Trigger: any creature grapples you or directly contacts your skin/saliva
- **Save:** CON **DC 17** = `9 + PB (5) + CON mod (3)`
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

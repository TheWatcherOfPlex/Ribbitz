# Ribbitz AI Handoff

Last updated: 2026-05-23

## Purpose

Ribbitz is the D&D character/stream helper project used by Dice Knights livestream tooling.

## Start Here

- Detailed project handoff: `/srv/docker/ribbitz/HANDOFF.md`
- Project README: `/srv/docker/ribbitz/README.md`
- Central AI index: `/Data/AI-Handoffs/INDEX.md`
- Linux FullScope index: `/Data/AI-Handoffs/FullScopeHandoff - Linux.md`
- Dice Knights source handoff: `/srv/docker/dice-knights-git/AI_HANDOFF.md`

Read this file first for routing, then open the detailed handoff only for the area you need.

## Runtime

- Project path: `/srv/docker/ribbitz`
- Active container/service: `diceknights-ribbitz`
- Compose source: `/srv/docker/dice-knights/docker-compose.yml`
- Runtime data path: `/srv/docker/dice-knights/docker-data/ribbitz`

## Common Task Routing

- General project architecture/content: `/srv/docker/ribbitz/HANDOFF.md`
- Livestream integration context: Dice Knights livestream docs plus Ribbitz detailed handoff
- OBS auto-sync tooling: `/srv/docker/ribbitz/OBS Auto Sync/Documentation/HANDOFF.md`
- Ribbitz stat assistant details: `/srv/docker/ribbitz/OBS Auto Sync/Documentation/HANDOFF_Ribbits_Stat_Assistant.md`
- Sophie’s Dice bridge work: see the bridge section in `/srv/docker/ribbitz/HANDOFF.md`

## Sophie’s Dice Bridge

- Ribbitz UI calls `POST /ribbits-app/api/sophie/roll`.
- `diceknights-ribbitz` forwards to the bridge at `SOPHIES_DICE_BRIDGE_URL`.
- Default bridge URL: `http://10.0.0.42:5195`.
- Stealth bridge path: `C:\Users\Drachen\Documents\SophiesDice\RibbitzBridge`.
- For safe testing, use a dry run payload such as `{ "key": "skill-acrobatics", "dryRun": true }`.
- Sophie’s Dice supports function-key hotkeys only through `F15`; do not use `F16` or higher in Sophie XML files.
- Current Circle of Spores Sophie roll keys: `halo-spores` (`1d8`), `halo-spores-symbiotic` (`2d8`), and `spreading-spores` (`2d8`).

## Safety Notes

- For livestream work, also check Dice Knights livestream docs and LiveKit context.
- Verify whether a change is Linux-hosted, Stealth-hosted, or cross-machine before editing.
- Do not paste secrets from `/srv/docker/Access Card.txt` or env files into docs or chat.

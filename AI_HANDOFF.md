# Ribbitz AI Handoff

Last updated: 2026-06-13

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

- As of 2026-06-13, Ribbitz dashboard roll buttons were removed because Sophie hotkey triggering caused issues during play.
- Do not re-add UI roll buttons or Sophie hotkey metadata without an explicit user request.
- `diceknights-ribbitz` may still expose legacy Sophie roll endpoints for compatibility/reference, but the dashboard UI does not call them.
- `sophieRolls` in `ui/server/server.js` must not include `hotkey` fields.
- Stealth bridge path, if future bridge work is needed: `C:\Users\Drachen\Documents\SophiesDice\RibbitzBridge`.

## Safety Notes

- For livestream work, also check Dice Knights livestream docs and LiveKit context.
- Verify whether a change is Linux-hosted, Stealth-hosted, or cross-machine before editing.
- Do not paste secrets from `/srv/docker/Access Card.txt` or env files into docs or chat.

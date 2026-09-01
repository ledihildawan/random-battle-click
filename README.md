# Retro Battle

A retro arcade turn-based battler. Vanilla ES modules + Vue 2 (global build), zero
bundler, zero npm dependencies — open `index.html` and play. Font is self-hosted;
works fully offline.

## Gameplay

- **10 fighters**, each with a signature special (name, color, particle FX)
- **Best-of-1/3/5 matches** (setting on the select screen, persisted)
- Four actions, fully symmetric for player and CPU:
  - **Attack `Z`** — reliable 6–10, 7% whiff, 15% crit (×2)
  - **Special `X`** — 12–20, needs a full **super meter** (charged by landing
    +30 / enduring +20 / whiffing +10); 25% miss with pity (next one connects);
    meter carries across rounds — bank it for the decider
  - **Heal `C`** — 12–20 HP, 3 medkits **per match** with escalating fail
    risk (5% / 15% / 30%); failure still burns the charge
  - **Defend `V`** — halve the next incoming blow (+25 meter, costs tempo)
- **Combo system** — consecutive hits build ×1.1 (x3) / ×1.2 (x5) damage,
  banners, screen shake; healing/defending/whiffing breaks it
- **Lifesteal** — every landed hit drains 25% of the damage dealt
- **Loser's initiative** — round 1 is a coin flip; afterwards the previous
  round's loser strikes first
- CPU AI reads public state only (your charged meter makes it brace)

## Systems

- **Stats** — global record, win streaks, best combo, per-fighter records and
  CPU-nemesis counts; persisted in `localStorage` (god-mode battles never count)
- **Konami code** (`↑↑↓↓←→←→BA`) on the title screen unlocks DEV GOD
- **Sound** — procedural chiptune (Web Audio), auto-unlocks on first input,
  ~25 contextual cues; `M` toggles mute (persisted)
- **Cinematics** — interface assembly intro, FIGHT!/ROUND N letterbox,
  K.O. freeze, per-character special FX, victory confetti / defeat rain /
  surrender fog (weather depends on the HP you surrendered at)

## Controls

| Screen   | Keys                                                                     |
| -------- | ------------------------------------------------------------------------ |
| Anywhere | `M` mute                                                                 |
| Title    | `Enter` start, konami code                                               |
| Select   | arrows navigate, `Enter` confirm, `R` cycles rounds, `Esc` back          |
| Battle   | `Z`/`X`/`C`/`V` actions, `←→` menu, `Enter` execute, `Esc` give up       |
| Dialog   | arrows/`Tab` switch, `Enter` confirm, `Esc` cancel                       |
| Winner   | arrows navigate, `Enter` execute, `R` rematch, `N` new match, `Esc` menu |

## Architecture

See `AGENTS.md` for the engineering guidelines and the host-stack constraint
map. Layout: `js/components` (Vue presentation) → `js/services` (battleEngine
domain core + shell adapters) → `js/utils` (pure helpers). No cycles, imports
flow strictly downwards.

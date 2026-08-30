// Domain data: per-character signature specials (pure, frozen, zero dependencies)
import deepFreeze from '../utils/deepFreeze.js';

/**
 * Signature specials keyed by fighter id.
 * `move` is the domain-facing move name (battle log); `type`/`color` drive the
 * Shell's particle presentation. Lives outside uiEffects so the Domain Core
 * (battleEngine) never imports from a Shell adapter (DAG: services → utils only).
 */
export const SPECIAL_FX = deepFreeze({
  1: { type: 'slash', color: '#209cee', move: 'BLADE WALTZ' },
  2: { type: 'coins', color: '#f7d51d', move: 'GOLD RUSH' },
  3: { type: 'flame', color: '#e76e55', move: 'PHOENIX INFERNO' },
  4: { type: 'hearts', color: '#ff6b9d', move: 'HEARTBREAK STORM' },
  5: { type: 'bolt', color: '#7be0ff', move: 'THUNDER VERDICT' },
  6: { type: 'poison', color: '#92cc41', move: 'VENOM GARDEN' },
  7: { type: 'wind', color: '#ffffff', move: 'GALE SLICER' },
  8: { type: 'stars', color: '#f7d51d', move: 'STARFALL' },
  9: { type: 'ice', color: '#7be0ff', move: 'GLACIER EDGE' },
  10: { type: 'quake', color: '#b9b9c2', move: 'AFTERSHOCK' },
  999: { type: 'godrays', color: '#f7d51d', move: 'DIVINE JUDGMENT' },
});

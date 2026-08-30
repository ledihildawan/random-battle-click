// Pixel placeholder shown when a fighter avatar fails to load
const FALLBACK_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' shape-rendering='crispEdges'>" +
  "<rect width='10' height='10' fill='#212529'/>" +
  "<rect x='2' y='2' width='2' height='2' fill='#7be0ff'/>" +
  "<rect x='6' y='2' width='2' height='2' fill='#7be0ff'/>" +
  "<rect x='3' y='6' width='4' height='1' fill='#e76e55'/>" +
  '</svg>';

export const AVATAR_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(FALLBACK_SVG);

export function onAvatarError(e) {
  const img = e && e.target;
  if (img && img.src !== AVATAR_FALLBACK) img.src = AVATAR_FALLBACK;
}

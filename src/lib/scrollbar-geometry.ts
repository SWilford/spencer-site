/** The SVG's first and last ruler marks are at 10 and 970 in a 980-unit viewBox. */
export function scrollbarGeometry(height: number, viewport: number, documentHeight: number, scrollTop: number) {
  const inset = Math.max(0, height) * 10 / 980;
  const track = Math.max(0, height - inset * 2);
  const thumb = Math.min(track, Math.max(44, track * viewport / Math.max(1, viewport, documentHeight)));
  const maximum = Math.max(0, documentHeight - viewport);
  const fraction = maximum ? Math.max(0, Math.min(1, scrollTop / maximum)) : 0;
  return { inset, track, thumb, maximum, fraction, offset: inset + fraction * (track - thumb) };
}

export function scrollbarFraction(clientY: number, top: number, grabOffset: number, geometry: ReturnType<typeof scrollbarGeometry>) {
  return Math.max(0, Math.min(1, (clientY - top - geometry.inset - grabOffset) / Math.max(1, geometry.track - geometry.thumb)));
}

export type Point = { x: number; y: number };
export type DecodeSector = { center: Point; polygon: Point[]; start: number; duration: number };

/** Clip a convex cell to the half-plane nearer its seed than another seed. */
function clipCell(polygon: Point[], seed: Point, other: Point): Point[] {
  const nx = other.x - seed.x, ny = other.y - seed.y;
  const limit = (other.x ** 2 + other.y ** 2 - seed.x ** 2 - seed.y ** 2) / 2;
  const result: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const da = a.x * nx + a.y * ny - limit, db = b.x * nx + b.y * ny - limit;
    if (da <= 0) result.push(a);
    if ((da <= 0) !== (db <= 0)) {
      const t = da / (da - db);
      result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return result;
}

export function createDecodeSectors(width: number, height: number, random = Math.random): DecodeSector[] {
  const count = width < 600 ? 18 : 28;
  const columns = Math.max(2, Math.round(Math.sqrt(count * width / height)));
  const rows = Math.ceil(count / columns);
  const seeds = Array.from({ length: count }, (_, i) => ({
    x: ((i % columns) + .12 + random() * .76) * width / columns,
    y: (Math.floor(i / columns) + .12 + random() * .76) * height / rows,
  }));
  const order = seeds.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return seeds.map((center, i) => {
    let polygon = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
    for (let j = 0; j < seeds.length; j++) if (i !== j) polygon = clipCell(polygon, center, seeds[j]);
    return { center, polygon, start: order[i] / (count - 1) * .62, duration: .16 + random() * .13 };
  });
}

function polygonPath(points: Point[]): string {
  return points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z";
}

/** Only tessellate the visible part of a long page; offscreen content stays intact. */
export function createDecodeKeyframes(width: number, height: number, visibleTop: number, visibleHeight: number, random = Math.random) {
  const sectors = createDecodeSectors(width, visibleHeight, random);
  const offscreen: string[] = [];
  if (visibleTop > 0) offscreen.push(polygonPath([{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: visibleTop }, { x: 0, y: visibleTop }]));
  const bottom = visibleTop + visibleHeight;
  if (bottom < height) offscreen.push(polygonPath([{ x: 0, y: bottom }, { x: width, y: bottom }, { x: width, y: height }, { x: 0, y: height }]));
  return Array.from({ length: 25 }, (_, frame) => {
    const progress = frame / 24;
    const paths = sectors.map(sector => {
      const local = Math.max(0, Math.min(1, (progress - sector.start) / sector.duration));
      // Short acquisition steps give a decoded-patch rhythm, then settle fully.
      const scale = local === 0 ? 0 : local < .25 ? .10 : local < .55 ? .50 : local < .8 ? .86 : 1.002;
      return polygonPath(sector.polygon.map(p => ({
        x: sector.center.x + (p.x - sector.center.x) * scale,
        y: visibleTop + sector.center.y + (p.y - sector.center.y) * scale,
      })));
    });
    return { offset: progress, clipPath: `path("${[...offscreen, ...paths].join(" ")}")` };
  });
}

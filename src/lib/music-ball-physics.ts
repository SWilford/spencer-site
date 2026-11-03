export type MusicBall = { x: number; y: number; vx: number; vy: number; radius: number; mass: number; angle: number; spin: number; birth: number; entered: boolean; grabbed: boolean };
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

export function musicBallRadii(weights: number[], width: number, height: number) {
  const maximum = Math.max(1, ...weights.filter(Number.isFinite));
  const values = weights.map(value => Math.max(Number.isFinite(value) ? value : 0, maximum * .006, 1));
  const scale = Math.sqrt(width * height * .23 / (Math.PI * Math.max(1, values.reduce((a, b) => a + b, 0))));
  return values.map(value => clamp(Math.sqrt(value) * scale, 12, Math.min(84, width * .19)));
}

export function createMusicBalls(weights: number[], width: number, height: number, random = Math.random): MusicBall[] {
  return musicBallRadii(weights, width, height).map((radius, index) => ({
    x: radius + random() * Math.max(0, width - radius * 2), y: -radius - 3,
    vx: (random() - .5) * 130, vy: 30 + random() * 45, radius, mass: radius * radius,
    angle: 0, spin: (random() - .5) * 2.4, birth: Math.min(index * .09, 5), entered: false, grabbed: false,
  }));
}

export function collideMusicBalls(a: MusicBall, b: MusicBall) {
  const dx = b.x - a.x, dy = b.y - a.y, reach = a.radius + b.radius;
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared >= reach * reach) return;
  const distance = Math.sqrt(distanceSquared), nx = distance ? dx / distance : 1, ny = distance ? dy / distance : 0;
  const ia = a.grabbed ? 0 : 1 / a.mass, ib = b.grabbed ? 0 : 1 / b.mass, sum = ia + ib;
  if (!sum) return;
  const overlap = reach - distance;
  a.x -= nx * overlap * ia / sum; a.y -= ny * overlap * ia / sum;
  b.x += nx * overlap * ib / sum; b.y += ny * overlap * ib / sum;
  const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (approach >= 0) return;
  const impulse = -(1 + .72) * approach / sum;
  a.vx -= impulse * nx * ia; a.vy -= impulse * ny * ia;
  b.vx += impulse * nx * ib; b.vy += impulse * ny * ib;
  const tangent = (b.vx - a.vx) * -ny + (b.vy - a.vy) * nx;
  if (!a.grabbed) a.spin = clamp(a.spin + tangent * .003, -5, 5);
  if (!b.grabbed) b.spin = clamp(b.spin - tangent * .003, -5, 5);
}

export function confineMusicBall(ball: MusicBall, width: number, height: number) {
  const r = ball.radius;
  if (ball.x < r) { ball.x = r; ball.vx = Math.abs(ball.vx) * .75; }
  if (ball.x > width - r) { ball.x = width - r; ball.vx = -Math.abs(ball.vx) * .75; }
  if (ball.y >= r) ball.entered = true;
  if (ball.entered && ball.y < r) { ball.y = r; ball.vy = Math.abs(ball.vy) * .72; }
  if (ball.y > height - r) {
    ball.y = height - r; ball.vy = Math.abs(ball.vy) < 25 ? 0 : -Math.abs(ball.vy) * .56;
    ball.vx *= .985; ball.spin *= .97;
  }
}

export function stepMusicBalls(balls: MusicBall[], width: number, height: number, dt: number, elapsed: number) {
  const active = balls.filter(ball => elapsed >= ball.birth);
  for (const ball of active) {
    if (ball.grabbed) continue;
    ball.vy = Math.min(1800, ball.vy + 870 * dt);
    ball.vx *= Math.exp(-.12 * dt); ball.spin *= Math.exp(-.12 * dt);
    ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.angle += ball.spin * dt;
    confineMusicBall(ball, width, height);
  }
  // A spatial grid keeps the collision work local when more rankings are loaded.
  const cell = Math.max(24, ...active.map(ball => ball.radius * 2));
  for (let pass = 0; pass < 2; pass++) {
    const buckets = new Map<string, number[]>();
    active.forEach((ball, index) => {
      const key = `${Math.floor(ball.x / cell)},${Math.floor(ball.y / cell)}`;
      const bucket = buckets.get(key) ?? []; bucket.push(index); buckets.set(key, bucket);
    });
    active.forEach((ball, index) => {
      const cx = Math.floor(ball.x / cell), cy = Math.floor(ball.y / cell);
      for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
        for (const other of buckets.get(`${x},${y}`) ?? []) if (other > index) collideMusicBalls(ball, active[other]);
      }
      if (!ball.grabbed) confineMusicBall(ball, width, height);
    });
  }
  for (const ball of active) if (!ball.grabbed) confineMusicBall(ball, width, height);
}

/** Static, readable packing for reduced motion; no animation must run to see the artwork. */
export function packMusicBalls(balls: MusicBall[], width: number, height: number) {
  let x = 3, baseline = height - 3, rowHeight = 0;
  for (const ball of balls) {
    const size = ball.radius * 2 + 3;
    if (x + size > width && x > 3) { baseline -= rowHeight; x = 3; rowHeight = 0; }
    ball.x = x + ball.radius; ball.y = Math.max(ball.radius, baseline - ball.radius);
    ball.birth = 0; ball.entered = true; ball.vx = 0; ball.vy = 0; ball.spin = 0;
    rowHeight = Math.max(rowHeight, size); x += size;
  }
}

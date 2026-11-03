import test from "node:test";
import assert from "node:assert/strict";
import { createMusicBalls, musicBallRadii, collideMusicBalls, stepMusicBalls } from "../src/lib/music-ball-physics.ts";

test("ball area scales with listening weight, with bounded sizes for empty and extreme data", () => {
  const radii = musicBallRadii([1, 4, 9, 16, 25, 36, 49, 64, 81, 100], 600, 400);
  assert.ok(Math.abs(radii[7] ** 2 / radii[3] ** 2 - 4) < .001);
  const edges = musicBallRadii([0, NaN, 1, 1000000000], 320, 500);
  assert.ok(edges.every(r => Number.isFinite(r) && r >= 12 && r <= 320 * .19));
  assert.ok(edges.at(-1) >= edges[2]);
});

test("circle collisions conserve momentum and lighter balls receive the larger velocity change", () => {
  const [a, b] = createMusicBalls([4, 1], 600, 400, () => .5);
  Object.assign(a, { x: 100, y: 100, vx: 120, vy: 0, radius: 20, mass: 400 });
  Object.assign(b, { x: 125, y: 100, vx: 0, vy: 0, radius: 10, mass: 100 });
  const momentum = a.mass * a.vx + b.mass * b.vx;
  collideMusicBalls(a, b);
  assert.ok(Math.abs(a.mass * a.vx + b.mass * b.vx - momentum) < .001);
  assert.ok(b.vx > a.vx); assert.ok(b.x - a.x >= 30 - .001);
});

test("staggered drops remain finite and inside the arena after entry", () => {
  const balls = createMusicBalls(Array.from({ length: 30 }, (_, i) => i + 1), 360, 560, () => .43);
  assert.ok(balls[1].birth > balls[0].birth);
  for (let frame = 0; frame < 1200; frame++) stepMusicBalls(balls, 360, 560, 1 / 120, frame / 120);
  for (const ball of balls) {
    assert.ok(Number.isFinite(ball.x) && Number.isFinite(ball.y));
    assert.ok(ball.x >= ball.radius - .01 && ball.x <= 360 - ball.radius + .01);
    assert.ok(ball.y >= ball.radius - .01 && ball.y <= 560 - ball.radius + .01);
  }
});

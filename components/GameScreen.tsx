
"use client";

import { useEffect, useRef, useState } from "react";

type GameScreenProps = {
  onBack: () => void;
};

type Asteroid = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  token: string;
  flash: number;
};

type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

type GameStatus = "playing" | "won" | "lost";

type HUD = {
  score: number;
  lives: number;
  time: number;
  selected: string[];
  feedback: string;
  status: GameStatus;
};

const TARGET_WORD = "PLAYING";

// Temporary data until the team's tokenizer is connected
const CORRECT_TOKENS = ["play", "ing"];

const TOKENS = [
  "pla",
  "play",
  "ying",
  "ing",
  "pl",
  "in",
];

const SHIP_SPEED = 260;
const BULLET_SPEED = 600;
const ASTEROID_HEALTH = 3;
const GAME_TIME = 60;

function initialHUD(): HUD {
  return {
    score: 0,
    lives: 3,
    time: GAME_TIME,
    selected: [],
    feedback: "Move with WASD. Aim and shoot with your mouse!",
    status: "playing",
  };
}

function createAsteroids(
  width: number,
  height: number
): Asteroid[] {
  const radius = Math.min(40, Math.max(27, width / 13));

  return TOKENS.map((token, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);

    return {
      id: index,
      x: width * (0.2 + column * 0.3),
      y: height * (0.22 + row * 0.27),
      vx: index % 2 === 0 ? 35 : -30,
      vy: index % 3 === 0 ? 28 : -25,
      radius,
      health: ASTEROID_HEALTH,
      token,
      flash: 0,
    };
  });
}

export default function GameScreen({
  onBack,
}: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hud, setHud] = useState<HUD>(initialHUD);
  const [round, setRound] = useState(0);

  function restartGame() {
    setHud(initialHUD());
    setRound((previous) => previous + 1);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let initialized = false;

    let score = 0;
    let lives = 3;
    let timeLeft = GAME_TIME;
    let elapsed = 0;

    let selected: string[] = [];
    let status: GameStatus = "playing";

    let feedback = "Move with WASD. Aim and shoot with your mouse!";

    let asteroids: Asteroid[] = [];
    let bullets: Bullet[] = [];

    let shotCooldown = 0;

    const keys = new Set<string>();

    const ship = {
      x: 0,
      y: 0,
      angle: -Math.PI / 2,
    };

    const mouse = {
      x: 0,
      y: 0,
    };

    // Update React HUD only when game information changes
    function updateHUD() {
      setHud({
        score,
        lives,
        time: timeLeft,
        selected: [...selected],
        feedback,
        status,
      });
    }

    // Canvas sizing
    function resizeCanvas() {
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      if (!rect.width || !rect.height) return;

      width = rect.width;
      height = rect.height;

      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!initialized) {
        ship.x = width / 2;
        ship.y = height * 0.83;

        mouse.x = width / 2;
        mouse.y = height / 2;

        asteroids = createAsteroids(width, height);

        initialized = true;
      } else {
        ship.x = Math.max(20, Math.min(width - 20, ship.x));
        ship.y = Math.max(20, Math.min(height - 20, ship.y));

        for (const asteroid of asteroids) {
          asteroid.x = Math.max(
            asteroid.radius,
            Math.min(width - asteroid.radius, asteroid.x)
          );

          asteroid.y = Math.max(
            asteroid.radius,
            Math.min(height - asteroid.radius, asteroid.y)
          );
        }
      }
    }

    // Keyboard input
    function keyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      if (["w", "a", "s", "d"].includes(key)) {
        keys.add(key);
      }
    }

    function keyUp(event: KeyboardEvent) {
      keys.delete(event.key.toLowerCase());
    }

    function clearKeys() {
      keys.clear();
    }

    // Track mouse position relative to the canvas
    function pointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();

      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    }

    // Shoot a projectile
    function shoot(event: PointerEvent) {
      if (status !== "playing" || shotCooldown > 0) {
        return;
      }

      pointerMove(event);

      const angle = Math.atan2(
        mouse.y - ship.y,
        mouse.x - ship.x
      );

      ship.angle = angle;

      bullets.push({
        x: ship.x + Math.cos(angle) * 25,
        y: ship.y + Math.sin(angle) * 25,

        vx: Math.cos(angle) * BULLET_SPEED,
        vy: Math.sin(angle) * BULLET_SPEED,

        radius: 4,
      });

      shotCooldown = 0.16;
    }

    // Draw the spaceship
    function drawShip() {
      ctx!.save();

      ctx!.translate(ship.x, ship.y);
      ctx!.rotate(ship.angle);

      // Engine flame
      ctx!.fillStyle = "#fb923c";

      ctx!.beginPath();
      ctx!.moveTo(-13, -6);
      ctx!.lineTo(-29, 0);
      ctx!.lineTo(-13, 6);
      ctx!.closePath();
      ctx!.fill();

      // Spaceship body
      ctx!.fillStyle = "#22d3ee";
      ctx!.strokeStyle = "#ffffff";
      ctx!.lineWidth = 2;

      ctx!.beginPath();

      ctx!.moveTo(23, 0);
      ctx!.lineTo(-16, -14);
      ctx!.lineTo(-9, 0);
      ctx!.lineTo(-16, 14);

      ctx!.closePath();

      ctx!.fill();
      ctx!.stroke();

      // Cockpit
      ctx!.fillStyle = "#1e40af";

      ctx!.beginPath();
      ctx!.ellipse(2, 0, 9, 5, 0, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.restore();
    }

    // Draw an asteroid
    function drawAsteroid(asteroid: Asteroid) {
      ctx!.save();

      ctx!.translate(asteroid.x, asteroid.y);

      const gradient = ctx!.createRadialGradient(
        -12, -12, 4,
        0, 0, asteroid.radius
      );

      gradient.addColorStop(
        0,
        asteroid.flash > 0 ? "#fde68a" : "#94a3b8"
      );

      gradient.addColorStop(1, "#334155");

      ctx!.fillStyle = gradient;
      ctx!.strokeStyle = "#cbd5e1";
      ctx!.lineWidth = 2;

      ctx!.beginPath();
      ctx!.arc(0, 0, asteroid.radius, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.stroke();

      // Craters
      ctx!.fillStyle = "rgba(15, 23, 42, 0.35)";

      ctx!.beginPath();
      ctx!.arc(-13, -12, 7, 0, Math.PI * 2);
      ctx!.arc(14, 13, 9, 0, Math.PI * 2);
      ctx!.fill();

      // Token text
      ctx!.fillStyle = "#ffffff";
      ctx!.font = "bold 17px Arial";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";

      ctx!.fillText(asteroid.token, 0, 0);

      // Health indicator
      for (let i = 0; i < asteroid.health; i++) {
        ctx!.fillStyle = "#facc15";

        ctx!.fillRect(
          -15 + i * 11,
          asteroid.radius + 6,
          8,
          4
        );
      }

      ctx!.restore();
    }

    // Draw laser projectile
    function drawBullet(bullet: Bullet) {
      ctx!.save();

      ctx!.fillStyle = "#67e8f9";
      ctx!.shadowColor = "#22d3ee";
      ctx!.shadowBlur = 15;

      ctx!.beginPath();
      ctx!.arc(
        bullet.x,
        bullet.y,
        bullet.radius,
        0,
        Math.PI * 2
      );

      ctx!.fill();
      ctx!.restore();
    }

    // Draw game arena
    function draw() {
      if (!initialized) return;

      // Background
      const background = ctx!.createLinearGradient(
        0, 0, 0, height
      );

      background.addColorStop(0, "#050816");
      background.addColorStop(1, "#101b3d");

      ctx!.fillStyle = background;
      ctx!.fillRect(0, 0, width, height);

      // Stars
      ctx!.fillStyle = "rgba(255,255,255,0.65)";

      for (let i = 0; i < 90; i++) {
        const x = (i * 173.7) % width;
        const y = (i * 97.3) % height;

        ctx!.fillRect(x, y, 2, 2);
      }

      // Asteroids
      for (const asteroid of asteroids) {
        drawAsteroid(asteroid);
      }

      // Projectiles
      for (const bullet of bullets) {
        drawBullet(bullet);
      }

      // Spaceship
      drawShip();

      // Crosshair
      ctx!.save();

      ctx!.strokeStyle = "#67e8f9";
      ctx!.lineWidth = 1.5;

      ctx!.beginPath();
      ctx!.arc(mouse.x, mouse.y, 10, 0, Math.PI * 2);

      ctx!.moveTo(mouse.x - 16, mouse.y);
      ctx!.lineTo(mouse.x - 5, mouse.y);

      ctx!.moveTo(mouse.x + 5, mouse.y);
      ctx!.lineTo(mouse.x + 16, mouse.y);

      ctx!.moveTo(mouse.x, mouse.y - 16);
      ctx!.lineTo(mouse.x, mouse.y - 5);

      ctx!.moveTo(mouse.x, mouse.y + 5);
      ctx!.lineTo(mouse.x, mouse.y + 16);

      ctx!.stroke();
      ctx!.restore();
    }

    // Main game loop
    let animationFrame = 0;
    let lastTime = performance.now();

    function gameLoop(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.033);

      lastTime = now;

      if (initialized && status === "playing") {

        // Update timer
        elapsed += dt;

        if (elapsed >= 1) {
          const seconds = Math.floor(elapsed);

          elapsed -= seconds;

          timeLeft = Math.max(0, timeLeft - seconds);

          if (timeLeft === 0) {
            status = "lost";
            feedback = "Time's up!";
          }

          updateHUD();
        }

        shotCooldown = Math.max(0, shotCooldown - dt);

        // WASD movement
        let dx = 0;
        let dy = 0;

        if (keys.has("w")) dy -= 1;
        if (keys.has("s")) dy += 1;
        if (keys.has("a")) dx -= 1;
        if (keys.has("d")) dx += 1;

        // Normalize diagonal movement
        const magnitude = Math.hypot(dx, dy);

        if (magnitude > 0) {
          dx /= magnitude;
          dy /= magnitude;
        }

        ship.x += dx * SHIP_SPEED * dt;
        ship.y += dy * SHIP_SPEED * dt;

        // Keep spaceship inside the arena
        ship.x = Math.max(20, Math.min(width - 20, ship.x));
        ship.y = Math.max(20, Math.min(height - 20, ship.y));

        // Rotate spaceship toward mouse
        ship.angle = Math.atan2(
          mouse.y - ship.y,
          mouse.x - ship.x
        );

        // Move asteroids
        for (const asteroid of asteroids) {
          asteroid.x += asteroid.vx * dt;
          asteroid.y += asteroid.vy * dt;

          asteroid.flash = Math.max(
            0,
            asteroid.flash - dt
          );

          // Bounce off walls
          if (
            asteroid.x - asteroid.radius < 0 ||
            asteroid.x + asteroid.radius > width
          ) {
            asteroid.vx *= -1;

            asteroid.x = Math.max(
              asteroid.radius,
              Math.min(width - asteroid.radius, asteroid.x)
            );
          }

          if (
            asteroid.y - asteroid.radius < 0 ||
            asteroid.y + asteroid.radius > height
          ) {
            asteroid.vy *= -1;

            asteroid.y = Math.max(
              asteroid.radius,
              Math.min(height - asteroid.radius, asteroid.y)
            );
          }
        }

        // Move bullets and check collisions
        let resetAsteroids = false;

        for (let i = bullets.length - 1; i >= 0; i--) {
          const bullet = bullets[i];

          bullet.x += bullet.vx * dt;
          bullet.y += bullet.vy * dt;

          // Remove bullets outside the arena
          if (
            bullet.x < 0 ||
            bullet.x > width ||
            bullet.y < 0 ||
            bullet.y > height
          ) {
            bullets.splice(i, 1);
            continue;
          }

          for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];

            const distance = Math.hypot(
              bullet.x - asteroid.x,
              bullet.y - asteroid.y
            );

            if (distance < bullet.radius + asteroid.radius) {

              // Projectile hits asteroid
              bullets.splice(i, 1);

              asteroid.health -= 1;
              asteroid.flash = 0.15;

              if (asteroid.health <= 0) {

                // Asteroid breaks
                asteroids.splice(j, 1);

                const expected =
                  CORRECT_TOKENS[selected.length];

                if (asteroid.token === expected) {

                  selected.push(asteroid.token);

                  score += 50;

                  feedback = "Correct token! Nice shot!";

                  if (
                    selected.length ===
                    CORRECT_TOKENS.length
                  ) {
                    status = "won";

                    score += 100;

                    feedback =
                      "Mission complete! You built the word!";
                  }

                } else {

                  // Wrong token
                  lives = Math.max(0, lives - 1);

                  selected = [];

                  feedback =
                    "Incorrect token! Try again.";

                  if (lives === 0) {
                    status = "lost";
                    feedback = "Game over!";
                  } else {
                    resetAsteroids = true;
                  }
                }

                updateHUD();
              }

              break;
            }
          }

          if (resetAsteroids) {
            asteroids = createAsteroids(width, height);
            bullets = [];
            break;
          }
        }
      }

      draw();

      animationFrame = requestAnimationFrame(gameLoop);
    }

    // Event listeners
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", clearKeys);

    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerdown", shoot);

    const observer = new ResizeObserver(resizeCanvas);

    observer.observe(canvas);
    resizeCanvas();

    animationFrame = requestAnimationFrame(gameLoop);

    // Cleanup when leaving the game screen
    return () => {
      cancelAnimationFrame(animationFrame);

      observer.disconnect();

      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clearKeys);

      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerdown", shoot);
    };

  }, [round]);

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-5 text-white">

      <div className="mx-auto max-w-6xl">

        {/* Scoreboard */}
        <header className="mb-4 grid grid-cols-3 items-center rounded-xl border border-cyan-500/40 bg-slate-900 p-4 text-center">

          <div>
            <p className="text-xs text-slate-400">SCORE</p>
            <p className="text-2xl font-black text-yellow-300">
              ★ {hud.score}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">LIVES</p>
            <p className="text-xl text-red-400">
              {"♥".repeat(hud.lives)}
              <span className="text-slate-600">
                {"♥".repeat(3 - hud.lives)}
              </span>
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">TIME</p>
            <p className="text-2xl font-black text-cyan-400">
              {hud.time}s
            </p>
          </div>

        </header>

        {/* Target word */}
        <section className="mb-4 text-center">

          <p className="text-xs tracking-widest text-slate-400">
            TARGET WORD
          </p>

          <h1 className="text-4xl font-black text-yellow-300">
            {TARGET_WORD}
          </h1>

        </section>

        {/* Game arena */}
        <div className="overflow-hidden rounded-xl border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(34,211,238,0.12)]">

          <canvas
            ref={canvasRef}
            className="block h-[60vh] min-h-[420px] max-h-[650px] w-full cursor-crosshair touch-none"
            aria-label="Token Blast game arena"
          />

        </div>

        {/* Selected tokens */}
        <section className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-center">

          <p className="text-xs tracking-widest text-slate-400">
            SELECTED TOKENS
          </p>

          <p className="mt-2 text-xl font-bold text-yellow-300">
            {hud.selected.length > 0
              ? hud.selected.join(" + ")
              : "—"}
          </p>

          <p
            aria-live="polite"
            className="mt-2 text-sm text-cyan-300"
          >
            {hud.feedback}
          </p>

        </section>

        {/* Result */}
        {hud.status !== "playing" && (
          <section className="mt-4 rounded-xl border-2 border-yellow-400 bg-slate-900 p-6 text-center">

            <h2 className="text-3xl font-black text-yellow-300">
              {hud.status === "won"
                ? "MISSION COMPLETE!"
                : "GAME OVER"}
            </h2>

            <p className="my-4">
              Final Score: {hud.score}
            </p>

            <button
              onClick={restartGame}
              className="rounded-lg bg-green-500 px-8 py-3 font-bold hover:bg-green-400"
            >
              PLAY AGAIN
            </button>

          </section>
        )}

        {/* Navigation */}
        <footer className="mt-5 flex justify-between gap-4">

          <button
            onClick={onBack}
            className="rounded-lg bg-slate-700 px-6 py-3 font-bold hover:bg-slate-600"
          >
            ← BACK
          </button>

          <button
            onClick={restartGame}
            className="rounded-lg bg-cyan-600 px-6 py-3 font-bold hover:bg-cyan-500"
          >
            RESTART
          </button>

        </footer>

      </div>

    </main>
  );
}

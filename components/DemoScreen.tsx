"use client";

import { useEffect, useRef, useState } from "react";

type LLM = "chatgpt" | "gemini" | "claude";

type DemoScreenProps = {
  selectedLLM: LLM;
  onComplete: () => void;
  onBack: () => void;
};

type TutorialStage =
  | "move"
  | "aim"
  | "shootPlay"
  | "shootIng"
  | "complete";

type Asteroid = {
  id: number;
  token: string;
  x: number;
  y: number;
  radius: number;
  alive: boolean;
  flash: number;
};

type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

const SHIP_SPEED = 250;
const BULLET_SPEED = 650;

export default function DemoScreen({
  selectedLLM,
  onComplete,
  onBack,
}: DemoScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stage, setStage] =
    useState<TutorialStage>("move");

  const [message, setMessage] = useState(
    "Welcome, Space Cadet! Use W, A, S, and D to move your ship."
  );

  const [selectedTokens, setSelectedTokens] =
    useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const keys = new Set<string>();
    const bullets: Bullet[] = [];

    let currentStage: TutorialStage = "move";

    let movementDistance = 0;
    let mouseMovement = 0;

    let previousMouseX = 0;
    let previousMouseY = 0;

    const mouse = {
      x: 0,
      y: 0,
    };

    const ship = {
      x: 0,
      y: 0,
      angle: -Math.PI / 2,
    };

    let asteroids: Asteroid[] = [];

    function changeStage(
      newStage: TutorialStage,
      newMessage: string
    ) {
      currentStage = newStage;
      setStage(newStage);
      setMessage(newMessage);
    }

    function createAsteroids() {
      asteroids = [
        {
          id: 1,
          token: "play",
          x: width * 0.35,
          y: height * 0.3,
          radius: 48,
          alive: true,
          flash: 0,
        },
        {
          id: 2,
          token: "ing",
          x: width * 0.65,
          y: height * 0.38,
          radius: 48,
          alive: true,
          flash: 0,
        },
      ];
    }

    function resizeCanvas() {
      const rect = canvas!.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      const dpr = window.devicePixelRatio || 1;

      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (ship.x === 0) {
        ship.x = width / 2;
        ship.y = height * 0.78;

        mouse.x = width / 2;
        mouse.y = height / 2;

        previousMouseX = mouse.x;
        previousMouseY = mouse.y;

        createAsteroids();
      }
    }

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

    function pointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();

      const newX = event.clientX - rect.left;
      const newY = event.clientY - rect.top;

      mouseMovement += Math.hypot(
        newX - previousMouseX,
        newY - previousMouseY
      );

      mouse.x = newX;
      mouse.y = newY;

      previousMouseX = newX;
      previousMouseY = newY;

      if (
        currentStage === "aim" &&
        mouseMovement > 100
      ) {
        changeStage(
          "shootPlay",
          'Great! Now aim at the asteroid labeled "play" and click to fire.'
        );
      }
    }

    function shoot(event: PointerEvent) {
      if (
        currentStage !== "shootPlay" &&
        currentStage !== "shootIng"
      ) {
        return;
      }

      pointerMove(event);

      const angle = Math.atan2(
        mouse.y - ship.y,
        mouse.x - ship.x
      );

      bullets.push({
        x: ship.x + Math.cos(angle) * 28,
        y: ship.y + Math.sin(angle) * 28,

        vx: Math.cos(angle) * BULLET_SPEED,
        vy: Math.sin(angle) * BULLET_SPEED,

        radius: 5,
      });
    }

    function drawShip() {
      ctx!.save();

      ctx!.translate(ship.x, ship.y);
      ctx!.rotate(ship.angle);

      // Engine flame
      ctx!.fillStyle = "#fb923c";

      ctx!.beginPath();
      ctx!.moveTo(-14, -7);
      ctx!.lineTo(-31, 0);
      ctx!.lineTo(-14, 7);
      ctx!.closePath();
      ctx!.fill();

      // Ship
      ctx!.fillStyle = "#22d3ee";
      ctx!.strokeStyle = "white";
      ctx!.lineWidth = 2;

      ctx!.beginPath();
      ctx!.moveTo(26, 0);
      ctx!.lineTo(-17, -15);
      ctx!.lineTo(-9, 0);
      ctx!.lineTo(-17, 15);
      ctx!.closePath();

      ctx!.fill();
      ctx!.stroke();

      // Cockpit
      ctx!.fillStyle = "#1e3a8a";

      ctx!.beginPath();
      ctx!.ellipse(
        3,
        0,
        10,
        6,
        0,
        0,
        Math.PI * 2
      );

      ctx!.fill();

      ctx!.restore();
    }

    function drawAsteroid(asteroid: Asteroid) {
      if (!asteroid.alive) return;

      ctx!.save();

      ctx!.translate(
        asteroid.x,
        asteroid.y
      );

      const gradient =
        ctx!.createRadialGradient(
          -15,
          -15,
          5,
          0,
          0,
          asteroid.radius
        );

      gradient.addColorStop(
        0,
        asteroid.flash > 0
          ? "#fde68a"
          : "#94a3b8"
      );

      gradient.addColorStop(
        1,
        "#334155"
      );

      ctx!.fillStyle = gradient;
      ctx!.strokeStyle = "#cbd5e1";
      ctx!.lineWidth = 3;

      ctx!.beginPath();

      ctx!.arc(
        0,
        0,
        asteroid.radius,
        0,
        Math.PI * 2
      );

      ctx!.fill();
      ctx!.stroke();

      // Craters
      ctx!.fillStyle =
        "rgba(15, 23, 42, .35)";

      ctx!.beginPath();

      ctx!.arc(
        -14,
        -15,
        8,
        0,
        Math.PI * 2
      );

      ctx!.arc(
        16,
        12,
        10,
        0,
        Math.PI * 2
      );

      ctx!.fill();

      // Token
      ctx!.fillStyle = "white";
      ctx!.font = "bold 19px Arial";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";

      ctx!.fillText(
        asteroid.token,
        0,
        0
      );

      ctx!.restore();
    }

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

    function drawCrosshair() {
      ctx!.save();

      ctx!.strokeStyle = "#67e8f9";
      ctx!.lineWidth = 1.5;

      ctx!.beginPath();

      ctx!.arc(
        mouse.x,
        mouse.y,
        10,
        0,
        Math.PI * 2
      );

      ctx!.moveTo(
        mouse.x - 16,
        mouse.y
      );

      ctx!.lineTo(
        mouse.x - 5,
        mouse.y
      );

      ctx!.moveTo(
        mouse.x + 5,
        mouse.y
      );

      ctx!.lineTo(
        mouse.x + 16,
        mouse.y
      );

      ctx!.moveTo(
        mouse.x,
        mouse.y - 16
      );

      ctx!.lineTo(
        mouse.x,
        mouse.y - 5
      );

      ctx!.moveTo(
        mouse.x,
        mouse.y + 5
      );

      ctx!.lineTo(
        mouse.x,
        mouse.y + 16
      );

      ctx!.stroke();

      ctx!.restore();
    }

    function drawBackground() {
      const gradient =
        ctx!.createLinearGradient(
          0,
          0,
          0,
          height
        );

      gradient.addColorStop(
        0,
        "#050816"
      );

      gradient.addColorStop(
        1,
        "#101b3d"
      );

      ctx!.fillStyle = gradient;

      ctx!.fillRect(
        0,
        0,
        width,
        height
      );

      ctx!.fillStyle =
        "rgba(255,255,255,.7)";

      for (let i = 0; i < 90; i++) {
        const x =
          (i * 173.7) % width;

        const y =
          (i * 97.3) % height;

        ctx!.fillRect(
          x,
          y,
          2,
          2
        );
      }
    }

    function handleDestroyedAsteroid(
      asteroid: Asteroid
    ) {
      const expectedToken =
        currentStage === "shootPlay"
          ? "play"
          : "ing";

      if (asteroid.token !== expectedToken) {
        asteroid.flash = 0.4;

        setMessage(
          `That asteroid says "${asteroid.token}". Try the "${expectedToken}" asteroid instead!`
        );

        return;
      }

      asteroid.alive = false;

      if (asteroid.token === "play") {
        setSelectedTokens(["play"]);

        changeStage(
          "shootIng",
          'Excellent! "play" is our first token. Now destroy the asteroid labeled "ing".'
        );
      } else {
        setSelectedTokens([
          "play",
          "ing",
        ]);

        changeStage(
          "complete",
          'Great job! "play" + "ing" rebuilds the word "playing". Training complete!'
        );
      }
    }

    let animationFrame = 0;
    let lastTime =
      performance.now();

    function gameLoop(now: number) {
      const dt = Math.min(
        (now - lastTime) / 1000,
        0.033
      );

      lastTime = now;

      // Player movement
      let dx = 0;
      let dy = 0;

      if (keys.has("w")) dy -= 1;
      if (keys.has("s")) dy += 1;
      if (keys.has("a")) dx -= 1;
      if (keys.has("d")) dx += 1;

      const magnitude =
        Math.hypot(dx, dy);

      if (
        magnitude > 0 &&
        currentStage !== "complete"
      ) {
        dx /= magnitude;
        dy /= magnitude;

        const moveAmount =
          SHIP_SPEED * dt;

        ship.x +=
          dx * moveAmount;

        ship.y +=
          dy * moveAmount;

        movementDistance +=
          moveAmount;

        if (
          currentStage === "move" &&
          movementDistance > 60
        ) {
          changeStage(
            "aim",
            "Nice flying! Now move your mouse around the arena to aim your ship."
          );
        }
      }

      ship.x = Math.max(
        25,
        Math.min(
          width - 25,
          ship.x
        )
      );

      ship.y = Math.max(
        25,
        Math.min(
          height - 25,
          ship.y
        )
      );

      ship.angle = Math.atan2(
        mouse.y - ship.y,
        mouse.x - ship.x
      );

      // Move bullets
      for (
        let i = bullets.length - 1;
        i >= 0;
        i--
      ) {
        const bullet = bullets[i];

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;

        if (
          bullet.x < 0 ||
          bullet.x > width ||
          bullet.y < 0 ||
          bullet.y > height
        ) {
          bullets.splice(i, 1);
          continue;
        }

        for (
          const asteroid of asteroids
        ) {
          if (!asteroid.alive) continue;

          const distance =
            Math.hypot(
              bullet.x -
                asteroid.x,
              bullet.y -
                asteroid.y
            );

          if (
            distance <
            bullet.radius +
              asteroid.radius
          ) {
            bullets.splice(i, 1);

            handleDestroyedAsteroid(
              asteroid
            );

            break;
          }
        }
      }

      for (const asteroid of asteroids) {
        asteroid.flash =
          Math.max(
            0,
            asteroid.flash - dt
          );
      }

      drawBackground();

      for (const asteroid of asteroids) {
        drawAsteroid(asteroid);
      }

      for (const bullet of bullets) {
        drawBullet(bullet);
      }

      drawShip();
      drawCrosshair();

      animationFrame =
        requestAnimationFrame(
          gameLoop
        );
    }

    window.addEventListener(
      "keydown",
      keyDown
    );

    window.addEventListener(
      "keyup",
      keyUp
    );

    window.addEventListener(
      "blur",
      clearKeys
    );

    canvas.addEventListener(
      "pointermove",
      pointerMove
    );

    canvas.addEventListener(
      "pointerdown",
      shoot
    );

    const observer =
      new ResizeObserver(
        resizeCanvas
      );

    observer.observe(canvas);

    resizeCanvas();

    animationFrame =
      requestAnimationFrame(
        gameLoop
      );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      observer.disconnect();

      window.removeEventListener(
        "keydown",
        keyDown
      );

      window.removeEventListener(
        "keyup",
        keyUp
      );

      window.removeEventListener(
        "blur",
        clearKeys
      );

      canvas.removeEventListener(
        "pointermove",
        pointerMove
      );

      canvas.removeEventListener(
        "pointerdown",
        shoot
      );
    };
  }, []);

  const modelName =
    selectedLLM === "chatgpt"
      ? "ChatGPT"
      : selectedLLM === "gemini"
      ? "Gemini"
      : "Claude";

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-5 text-white">

      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-4 flex items-center justify-between rounded-xl border border-cyan-500/40 bg-slate-900 px-5 py-4">

          <div>
            <p className="text-xs tracking-widest text-slate-400">
              TRAINING MISSION
            </p>

            <h1 className="text-2xl font-black text-yellow-300">
              TOKEN BLAST
            </h1>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">
              SELECTED AI
            </p>

            <p className="font-bold text-cyan-300">
              {modelName}
            </p>
          </div>

        </header>

        {/* Word */}
        <section className="mb-4 text-center">

          <p className="text-xs tracking-[0.3em] text-slate-400">
            TRAINING WORD
          </p>

          <h2 className="text-4xl font-black text-yellow-300">
            PLAYING
          </h2>

        </section>

        {/* Arena */}
        <div className="relative overflow-hidden rounded-xl border-2 border-cyan-500/40">

          <canvas
            ref={canvasRef}
            className="block h-[60vh] min-h-[440px] w-full cursor-crosshair"
          />

          {/* Tutorial speech bubble */}
          <div className="pointer-events-none absolute left-5 top-5 max-w-sm rounded-2xl border-2 border-cyan-300 bg-slate-950/95 p-5 shadow-[0_0_25px_rgba(34,211,238,.25)]">

            <p className="mb-2 text-xs font-bold tracking-widest text-cyan-300">
              FLIGHT COMPUTER
            </p>

            <p className="text-lg font-bold">
              {message}
            </p>

          </div>

          {/* Completion overlay */}
          {stage === "complete" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6">

              <div className="max-w-lg rounded-2xl border-2 border-yellow-300 bg-slate-900 p-8 text-center">

                <p className="text-sm font-bold tracking-[0.3em] text-cyan-300">
                  TRAINING COMPLETE
                </p>

                <h2 className="mt-3 text-4xl font-black text-yellow-300">
                  PLAY + ING
                </h2>

                <p className="mt-3 text-2xl font-black">
                  = PLAYING
                </p>

                <p className="mt-6 text-slate-300">
                  You now know how to move,
                  aim, shoot, and collect token
                  pieces.
                </p>

                <p className="mt-3 text-sm text-slate-400">
                  The real levels will use
                  tokenization data associated
                  with {modelName}.
                </p>

                <button
                  type="button"
                  onClick={onComplete}
                  className="mt-7 rounded-xl bg-green-500 px-10 py-4 text-xl font-black tracking-wider hover:bg-green-400"
                >
                  BEGIN MISSION →
                </button>

              </div>

            </div>
          )}

        </div>

        {/* Progress */}
        <section className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-center">

          <p className="text-xs tracking-widest text-slate-400">
            TOKEN SEQUENCE
          </p>

          <p className="mt-2 text-xl font-black text-yellow-300">
            {selectedTokens.length
              ? selectedTokens.join(" + ")
              : "—"}
          </p>

        </section>

        <button
          type="button"
          onClick={onBack}
          className="mt-5 rounded-lg bg-slate-700 px-6 py-3 font-bold hover:bg-slate-600"
        >
          ← CHANGE AI
        </button>

      </div>

    </main>
  );
}
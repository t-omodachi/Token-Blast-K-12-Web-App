"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import FeedbackModal from "./FeedbackModal";

import {
  getLevelsForModel,
  getModelName,
  type LLM,
} from "@/lib/gameLevels";

import { audioManager } from "@/lib/audioManager";

type GameScreenProps = {
  selectedLLM: LLM;

  onBack: () => void;

  onGameComplete: (
    finalScore: number
  ) => void;
};

type Asteroid = {
  id: number;

  token: string;

  x: number;
  y: number;

  vx: number;
  vy: number;

  radius: number;

  health: number;

  flash: number;
};

type Bullet = {
  x: number;
  y: number;

  vx: number;
  vy: number;

  radius: number;
};

type LevelFeedback = {
  success: boolean;

  word: string;

  correctTokens: string[];

  selectedTokens: string[];

  explanation: string;

  verified: boolean;
};

const SHIP_SPEED = 260;

const BULLET_SPEED = 650;

const ASTEROID_HEALTH = 2;

const LEVEL_TIME = 45;

export default function GameScreen({
  selectedLLM,
  onBack,
  onGameComplete,
}: GameScreenProps) {
  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const scoreRef = useRef(0);

  const [levels, setLevels] = useState(() => getLevelsForModel(selectedLLM));


  const [currentLevelIndex, setCurrentLevelIndex] =
    useState(0);

  const [score, setScore] =
    useState(0);

  const [lives, setLives] =
    useState(3);

  const [timeLeft, setTimeLeft] =
    useState(LEVEL_TIME);

  const [
    selectedTokens,
    setSelectedTokens,
  ] = useState<string[]>([]);

  const [message, setMessage] =
    useState(
      "Destroy the correct token asteroids in order!"
    );

  const [
    levelFeedback,
    setLevelFeedback,
  ] =
    useState<LevelFeedback | null>(
      null
    );

  const [round, setRound] =
    useState(0);

  useEffect(() => {
    setLevels(getLevelsForModel(selectedLLM));
  }, [selectedLLM, round]);

  const level =
    levels[currentLevelIndex];

  const modelName =
    getModelName(selectedLLM);

  function continueGame() {
    setLevelFeedback(null);

    // Last level
    if (
      currentLevelIndex ===
      levels.length - 1
    ) {
      onGameComplete(
        scoreRef.current
      );

      return;
    }

    setCurrentLevelIndex(
      (previous) => previous + 1
    );
  }

  function restartGame() {
    scoreRef.current = 0;

    setScore(0);

    setCurrentLevelIndex(0);

    setLevelFeedback(null);

    setRound(
      (previous) => previous + 1
    );
  }

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    const levelData =
      levels[currentLevelIndex];

    let width = 0;
    let height = 0;

    let initialized = false;

    let levelStatus:
      | "playing"
      | "finished" =
      "playing";

    let livesRemaining = 3;

    let secondsRemaining =
      LEVEL_TIME;

    let timerAccumulator = 0;

    let selected: string[] = [];

    let asteroids: Asteroid[] =
      [];

    let bullets: Bullet[] = [];

    const keys =
      new Set<string>();

    const mouse = {
      x: 0,
      y: 0,
    };

    const ship = {
      x: 0,
      y: 0,
      angle: -Math.PI / 2,
    };

    setLives(3);

    setTimeLeft(
      LEVEL_TIME
    );

    setSelectedTokens([]);

    setMessage(
      "Destroy the correct token asteroids in order!"
    );

    function makeAsteroids() {
      const tokens = [
        ...levelData.correctTokens,
        ...levelData.distractors,
      ];

      const radius = Math.min(
        45,
        Math.max(
          32,
          width / 15
        )
      );

      return tokens.map(
        (token, index) => {
          const columns = 3;

          const column =
            index % columns;

          const row =
            Math.floor(
              index / columns
            );

            const speedMult = 1 + ((levelData.difficulty || 1) - 1) * 0.4;

            return {
              id: index,

              token,

              x:
                width *
                (0.2 +
                  column * 0.3),

              y:
                height *
                (0.2 +
                  row * 0.25),

              vx:
                (index % 2 === 0
                  ? 45
                  : -40) * speedMult,

              vy:
                (index % 3 === 0
                  ? 35
                  : -30) * speedMult,

              radius,

              health:
                ASTEROID_HEALTH + Math.floor((levelData.difficulty || 1) / 2),

            flash: 0,
          };
        }
      );
    }

    function resizeCanvas() {
      const rect =
        canvas!.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      if (!width || !height)
        return;

      const dpr =
        window.devicePixelRatio ||
        1;

      canvas!.width =
        Math.round(
          width * dpr
        );

      canvas!.height =
        Math.round(
          height * dpr
        );

      ctx!.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

      if (!initialized) {
        ship.x =
          width / 2;

        ship.y =
          height * 0.82;

        mouse.x =
          width / 2;

        mouse.y =
          height / 2;

        asteroids =
          makeAsteroids();

        initialized = true;
      }
    }

    function keyDown(
      event: KeyboardEvent
    ) {
      const key =
        event.key.toLowerCase();

      if (
        ["w", "a", "s", "d"].includes(
          key
        )
      ) {
        keys.add(key);
      }
    }

    function keyUp(
      event: KeyboardEvent
    ) {
      keys.delete(
        event.key.toLowerCase()
      );
    }

    function clearKeys() {
      keys.clear();
    }

    function pointerMove(
      event: PointerEvent
    ) {
      const rect =
        canvas!.getBoundingClientRect();

      mouse.x =
        event.clientX -
        rect.left;

      mouse.y =
        event.clientY -
        rect.top;
    }

    function shoot(
      event: PointerEvent
    ) {
      if (
        levelStatus !==
        "playing"
      ) {
        return;
      }

      pointerMove(event);

      const angle =
        Math.atan2(
          mouse.y - ship.y,
          mouse.x - ship.x
        );

      bullets.push({
        x:
          ship.x +
          Math.cos(angle) *
            27,

        y:
          ship.y +
          Math.sin(angle) *
            27,

        vx:
          Math.cos(angle) *
          BULLET_SPEED,

        vy:
          Math.sin(angle) *
          BULLET_SPEED,

        radius: 5,
      });

      audioManager.play("shoot");
    }

    function finishLevel(
      success: boolean
    ) {
      if (
        levelStatus !==
        "playing"
      ) {
        return;
      }

      levelStatus =
        "finished";

      if (success) {
        const completionBonus =
          250;

        const timeBonus =
          secondsRemaining * 5;

        scoreRef.current +=
          completionBonus +
          timeBonus;

        setScore(
          scoreRef.current
        );
      }

      setLevelFeedback({
        success,

        word:
          levelData.word,

        correctTokens: [
          ...levelData.correctTokens,
        ],

        selectedTokens: [
          ...selected,
        ],

        explanation:
          levelData.explanation,

        verified:
          levelData.verified,
      });
    }

    function asteroidDestroyed(
      asteroid: Asteroid
    ) {
      const requiredCount = levelData.correctTokens.filter(t => t === asteroid.token).length;
      const collectedCount = selected.filter(t => t === asteroid.token).length;

      // Correct token
      if (requiredCount > collectedCount) {
        selected.push(
          asteroid.token
        );

        setSelectedTokens([
          ...selected,
        ]);

        scoreRef.current +=
          100;

        setScore(
          scoreRef.current
        );

        setMessage(
          "Correct token! Keep going!"
        );

        if (
          selected.length ===
          levelData.correctTokens
            .length
        ) {
          setMessage(
            "Word complete!"
          );

          audioManager.play("levelComplete");
          finishLevel(true);
        } else {
          audioManager.play("correct");
        }

        return "correct";
      }

      // Wrong token
      livesRemaining =
        Math.max(
          0,
          livesRemaining - 1
        );

      setLives(
        livesRemaining
      );

      scoreRef.current =
        Math.max(
          0,
          scoreRef.current -
            50
        );

      setScore(
        scoreRef.current
      );

      setMessage(
        `Incorrect token! Lives remaining: ${livesRemaining}`
      );

      if (
        livesRemaining === 0
      ) {
        audioManager.play("gameOver");
        finishLevel(false);
      } else {
        audioManager.play("wrong");
      }

      return "distractor";
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

      ctx!.fillStyle =
        gradient;

      ctx!.fillRect(
        0,
        0,
        width,
        height
      );

      ctx!.fillStyle =
        "rgba(255,255,255,.65)";

      for (
        let i = 0;
        i < 90;
        i++
      ) {
        const x =
          (i * 173.7) %
          width;

        const y =
          (i * 97.3) %
          height;

        ctx!.fillRect(
          x,
          y,
          2,
          2
        );
      }
    }

    function drawShip() {
      ctx!.save();

      ctx!.translate(
        ship.x,
        ship.y
      );

      ctx!.rotate(
        ship.angle
      );

      // Engine
      ctx!.fillStyle =
        "#fb923c";

      ctx!.beginPath();

      ctx!.moveTo(
        -14,
        -7
      );

      ctx!.lineTo(
        -30,
        0
      );

      ctx!.lineTo(
        -14,
        7
      );

      ctx!.closePath();

      ctx!.fill();

      // Ship
      ctx!.fillStyle =
        "#22d3ee";

      ctx!.strokeStyle =
        "#ffffff";

      ctx!.lineWidth = 2;

      ctx!.beginPath();

      ctx!.moveTo(
        25,
        0
      );

      ctx!.lineTo(
        -16,
        -14
      );

      ctx!.lineTo(
        -9,
        0
      );

      ctx!.lineTo(
        -16,
        14
      );

      ctx!.closePath();

      ctx!.fill();
      ctx!.stroke();

      ctx!.restore();
    }

    function drawAsteroid(
      asteroid: Asteroid
    ) {
      ctx!.save();

      ctx!.translate(
        asteroid.x,
        asteroid.y
      );

      const gradient =
        ctx!.createRadialGradient(
          -10,
          -10,
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

      ctx!.fillStyle =
        gradient;

      ctx!.strokeStyle =
        "#cbd5e1";

      ctx!.lineWidth = 2;

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

      ctx!.fillStyle =
        "rgba(15,23,42,.4)";

      ctx!.beginPath();

      ctx!.arc(
        -12,
        -12,
        7,
        0,
        Math.PI * 2
      );

      ctx!.arc(
        14,
        13,
        9,
        0,
        Math.PI * 2
      );

      ctx!.fill();

      ctx!.fillStyle =
        "#ffffff";

      ctx!.font =
        "bold 17px Arial";

      ctx!.textAlign =
        "center";

      ctx!.textBaseline =
        "middle";

      ctx!.fillText(
        asteroid.token,
        0,
        0
      );

      // Health
      for (
        let i = 0;
        i <
        asteroid.health;
        i++
      ) {
        ctx!.fillStyle =
          "#facc15";

        ctx!.fillRect(
          -12 +
            i * 14,
          asteroid.radius +
            6,
          10,
          4
        );
      }

      ctx!.restore();
    }

    function drawBullet(
      bullet: Bullet
    ) {
      ctx!.save();

      ctx!.fillStyle =
        "#67e8f9";

      ctx!.shadowColor =
        "#22d3ee";

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

      ctx!.strokeStyle =
        "#67e8f9";

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

      ctx!.stroke();

      ctx!.restore();
    }

    let animationFrame = 0;

    let previousTime =
      performance.now();

    function gameLoop(
      now: number
    ) {
      const dt = Math.min(
        (now -
          previousTime) /
          1000,
        0.033
      );

      previousTime = now;

      if (
        initialized &&
        levelStatus ===
          "playing"
      ) {
        // Timer
        timerAccumulator +=
          dt;

        if (
          timerAccumulator >= 1
        ) {
          const seconds =
            Math.floor(
              timerAccumulator
            );

          timerAccumulator -=
            seconds;

          secondsRemaining =
            Math.max(
              0,
              secondsRemaining -
                seconds
            );

          setTimeLeft(
            secondsRemaining
          );

          if (
            secondsRemaining ===
            0
          ) {
            setMessage(
              "Time's up!"
            );

            finishLevel(false);
          }
        }

        // WASD
        let dx = 0;
        let dy = 0;

        if (keys.has("w"))
          dy -= 1;

        if (keys.has("s"))
          dy += 1;

        if (keys.has("a"))
          dx -= 1;

        if (keys.has("d"))
          dx += 1;

        const magnitude =
          Math.hypot(
            dx,
            dy
          );

        if (
          magnitude > 0
        ) {
          dx /= magnitude;

          dy /= magnitude;
        }

        ship.x +=
          dx *
          SHIP_SPEED *
          dt;

        ship.y +=
          dy *
          SHIP_SPEED *
          dt;

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

        ship.angle =
          Math.atan2(
            mouse.y -
              ship.y,
            mouse.x -
              ship.x
          );

        // Asteroids
        for (
          const asteroid
          of asteroids
        ) {
          asteroid.x +=
            asteroid.vx *
            dt;

          asteroid.y +=
            asteroid.vy *
            dt;

          asteroid.flash =
            Math.max(
              0,
              asteroid.flash -
                dt
            );

          if (
            asteroid.x -
                asteroid.radius <
              0 ||
            asteroid.x +
                asteroid.radius >
              width
          ) {
            asteroid.vx *=
              -1;
          }

          if (
            asteroid.y -
                asteroid.radius <
              0 ||
            asteroid.y +
                asteroid.radius >
              height
          ) {
            asteroid.vy *=
              -1;
          }
        }

        // Bullets
        for (
          let i =
            bullets.length -
            1;
          i >= 0;
          i--
        ) {
          const bullet =
            bullets[i];

          bullet.x +=
            bullet.vx *
            dt;

          bullet.y +=
            bullet.vy *
            dt;

          if (
            bullet.x < 0 ||
            bullet.x >
              width ||
            bullet.y < 0 ||
            bullet.y >
              height
          ) {
            bullets.splice(
              i,
              1
            );

            continue;
          }

          for (
            let j =
              asteroids.length -
              1;
            j >= 0;
            j--
          ) {
            const asteroid =
              asteroids[j];

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
              bullets.splice(
                i,
                1
              );

              asteroid.health -=
                1;

              asteroid.flash =
                0.15;

              if (
                asteroid.health <=
                0
              ) {
                const outcome = asteroidDestroyed(
                  asteroid
                );

                asteroids.splice(
                  j,
                  1
                );
              }

              break;
            }
          }
        }
      }

      drawBackground();

      for (
        const asteroid
        of asteroids
      ) {
        drawAsteroid(
          asteroid
        );
      }

      for (
        const bullet
        of bullets
      ) {
        drawBullet(
          bullet
        );
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

    observer.observe(
      canvas
    );

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
  }, [
    currentLevelIndex,
    round,
    selectedLLM,
    levels,
  ]);

  return (
  <main className="h-screen w-screen overflow-hidden bg-[#050816] p-3 text-white">

    <div className="flex h-full w-full flex-col">

      {/* HUD */}
      <header className="grid shrink-0 grid-cols-4 items-center rounded-xl border border-cyan-500/40 bg-slate-900 px-4 py-2 text-center">

        <div>
          <p className="text-[10px] text-slate-400">
            LEVEL
          </p>

          <p className="text-lg font-black">
            {currentLevelIndex + 1}/{levels.length}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400">
            SCORE
          </p>

          <p className="text-lg font-black text-yellow-300">
            ★ {score}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400">
            LIVES
          </p>

          <p className="text-lg text-red-400">
            {"♥".repeat(lives)}

            <span className="text-slate-600">
              {"♥".repeat(3 - lives)}
            </span>
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400">
            TIME
          </p>

          <p className="text-lg font-black text-cyan-300">
            {timeLeft}s
          </p>
        </div>

      </header>

      {/* TARGET WORD */}
      <section className="shrink-0 py-2 text-center">

        <p className="text-[10px] tracking-[0.25em] text-slate-400">
          TOKENIZING WITH{" "}
          <span className="font-bold text-cyan-300">
            {modelName}
          </span>
        </p>

        <p className="mt-1 text-[10px] tracking-[0.3em] text-slate-400">
          TARGET WORD
        </p>

        <h1 className="text-3xl font-black text-yellow-300">
          {level.word}
        </h1>

      </section>

      {/* GAME ARENA */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border-2 border-cyan-500/40">

        <canvas
          ref={canvasRef}
          className="block h-full w-full cursor-crosshair"
        />

        {levelFeedback && (
          <FeedbackModal
            success={levelFeedback.success}
            modelName={modelName}
            word={levelFeedback.word}
            correctTokens={levelFeedback.correctTokens}
            selectedTokens={levelFeedback.selectedTokens}
            explanation={levelFeedback.explanation}
            score={score}
            verified={levelFeedback.verified}
            levelNumber={currentLevelIndex + 1}
            totalLevels={levels.length}
            onContinue={continueGame}
          />
        )}

      </div>

      {/* BOTTOM HUD */}
      <section className="mt-2 grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2">

        {/* Exit */}
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold hover:bg-slate-600"
        >
          ← EXIT
        </button>

        {/* Token sequence */}
        <div className="text-center">

          <p className="text-[10px] tracking-widest text-slate-400">
            TOKEN SEQUENCE
          </p>

          <p className="font-black text-yellow-300">
            {selectedTokens.length
              ? selectedTokens.join(" + ")
              : "—"}
          </p>

          <p className="text-xs text-cyan-300">
            {message}
          </p>

        </div>

        {/* Restart */}
        <button
          type="button"
          onClick={restartGame}
          className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold hover:bg-cyan-600"
        >
          RESTART
        </button>

      </section>

    </div>

  </main>
);
    
}
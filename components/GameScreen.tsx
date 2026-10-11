"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import FeedbackModal from "./FeedbackModal";

import {
  getLevelsForModel,
  getModelName,
  type LevelData,
  type LLM,
} from "@/lib/gameLevels";

import { audioManager } from "@/lib/audioManager";
import { STARS } from "@/lib/starfield";

import {
  logEvent,
  msSinceRunStart,
  startRun,
} from "@/lib/researchLog";

/*
 * Level context attached to every research log row.
 */
function levelLogFields(
  model: LLM,
  level: LevelData | undefined,
  index: number
) {
  return {
    model,
    level: index + 1,
    word: level?.word,
    difficulty: level?.difficulty,
    correct_split: level?.correctTokens.join(" + "),
  };
}

// Ratio rounded to 3 decimals, blank when nothing to divide by
function ratio(part: number, total: number) {
  return total > 0
    ? Math.round((part / total) * 1000) / 1000
    : undefined;
}

type GameScreenProps = {
  selectedLLM: LLM;
  onBack: () => void;
  onGameComplete: (finalScore: number) => void;
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

type AsteroidOutcome =
  | "correct"
  | "wrong-order"
  | "distractor";

const SHIP_SPEED = 260;
const BULLET_SPEED = 650;
const ASTEROID_HEALTH = 2;
const LEVEL_TIME = 45;

// Ship collision circle, roughly the size of the drawn ship
const SHIP_RADIUS = 18;

// Damage feedback timings (seconds)
const INVULNERABLE_TIME = 1.5;
const DAMAGE_FLASH_TIME = 0.45;
const SHAKE_TIME = 0.35;
const POPUP_TIME = 1;

export default function GameScreen({
  selectedLLM,
  onBack,
  onGameComplete,
}: GameScreenProps) {
  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const scoreRef = useRef(0);

  // When the current feedback popup opened (research timing)
  const feedbackOpenedAt =
    useRef<number | null>(null);

  const [currentLevelIndex, setCurrentLevelIndex] =
    useState(0);

  const [score, setScore] =
    useState(0);

  const [lives, setLives] =
    useState(3);

  // Bumped on every lost life to replay the HUD heart animation
  const [damageCount, setDamageCount] =
    useState(0);

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
  ] = useState<LevelFeedback | null>(
    null
  );

  /*
   * Generate the five-level campaign.
   * It is re-rolled when the player restarts.
   */
  const [levels, setLevels] =
    useState(() =>
      getLevelsForModel(
        selectedLLM
      )
    );

  const level =
    levels[currentLevelIndex];

  const modelName =
    getModelName(selectedLLM);

  /*
   * Reset the HUD for a fresh level.
   */
  function resetLevelState() {
    setLives(3);

    setTimeLeft(
      LEVEL_TIME
    );

    setSelectedTokens([]);

    setMessage(
      "Destroy the correct token asteroids in order!"
    );
  }

  function continueGame() {
    logEvent("feedback_close", {
      ...levelLogFields(
        selectedLLM,
        levels[currentLevelIndex],
        currentLevelIndex
      ),
      result: levelFeedback?.success
        ? "completed"
        : "failed",
      duration_ms:
        feedbackOpenedAt.current === null
          ? undefined
          : Date.now() -
            feedbackOpenedAt.current,
    });

    feedbackOpenedAt.current = null;

    setLevelFeedback(null);

    if (
      currentLevelIndex ===
      levels.length - 1
    ) {
      logEvent("game_complete", {
        model: selectedLLM,
        score: scoreRef.current,
        duration_ms: msSinceRunStart(),
      });

      onGameComplete(
        scoreRef.current
      );

      return;
    }

    resetLevelState();

    setCurrentLevelIndex(
      (previous) =>
        previous + 1
    );
  }

  function restartGame() {
    logEvent("restart", {
      ...levelLogFields(
        selectedLLM,
        levels[currentLevelIndex],
        currentLevelIndex
      ),
      score: scoreRef.current,
    });

    startRun("restart");

    scoreRef.current = 0;

    setScore(0);

    setCurrentLevelIndex(0);

    setLevelFeedback(null);

    resetLevelState();

    setLevels(
      getLevelsForModel(
        selectedLLM
      )
    );
  }

  function exitGame() {
    logEvent("exit", {
      ...levelLogFields(
        selectedLLM,
        levels[currentLevelIndex],
        currentLevelIndex
      ),
      score: scoreRef.current,
    });

    onBack();
  }

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    const levelData =
      levels[
        currentLevelIndex
      ];

    if (!levelData) return;

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

    const selected: string[] = [];

    let asteroids: Asteroid[] =
      [];

    const bullets: Bullet[] =
      [];

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

    /*
     * Research stats for this level.
     * level_start is logged on the first game-loop
     * frame so dev Strict Mode can't double-log it.
     */
    const logFields = levelLogFields(
      selectedLLM,
      levelData,
      currentLevelIndex
    );

    const scoreAtLevelStart =
      scoreRef.current;

    let levelStartedAt: number | null =
      null;

    const stats = {
      shotsFired: 0,
      shotsHit: 0,
      correct: 0,
      wrongOrder: 0,
      distractor: 0,
      crashes: 0,
      wrongTokens: [] as string[],
      wrongOrderTokens: [] as string[],
    };

    function timeInLevel() {
      return levelStartedAt === null
        ? 0
        : Date.now() - levelStartedAt;
    }

    /*
     * Damage feedback timers (seconds left).
     */
    let invulnerableTime = 0;
    let damageFlashTime = 0;
    let shakeTime = 0;

    // Floating "-1 ♥" labels
    const damagePopups: {
      x: number;
      y: number;
      age: number;
    }[] = [];

    const reduceMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    /*
     * Returns the amount of health an
     * asteroid should have for this level.
     */
    function getAsteroidHealth() {
      const difficulty =
        levelData.difficulty ||
        1;

      return (
        ASTEROID_HEALTH +
        Math.floor(
          difficulty / 2
        )
      );
    }

    /*
     * Create asteroids.
     */
    function makeAsteroids() {
      const tokens = [
        ...levelData.correctTokens,
        ...levelData.distractors,
      ];

      const radius =
        Math.min(
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

          const difficulty =
            levelData.difficulty ||
            1;

          const speedMult =
            1 +
            (difficulty - 1) *
              0.4;

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
              (index % 2 ===
              0
                ? 45
                : -40) *
              speedMult,

            vy:
              (index % 3 ===
              0
                ? 35
                : -30) *
              speedMult,

            radius,

            health:
              getAsteroidHealth(),

            flash: 0,
          };
        }
      );
    }

    /*
     * Resize canvas.
     */
    function resizeCanvas() {
      const rect =
        canvas!.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      if (
        !width ||
        !height
      ) {
        return;
      }

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

        initialized =
          true;
      }
    }

    /*
     * Keyboard movement.
     */
    function keyDown(
      event: KeyboardEvent
    ) {
      const key =
        event.key.toLowerCase();

      if (
        [
          "w",
          "a",
          "s",
          "d",
        ].includes(key)
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

    /*
     * Mouse aiming.
     */
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

    /*
     * Fire projectile.
     */
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
          mouse.y -
            ship.y,
          mouse.x -
            ship.x
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

      stats.shotsFired += 1;

      audioManager.play(
        "shoot"
      );
    }

    /*
     * Finish level.
     */
    function finishLevel(
      success: boolean,
      reason:
        | "completed"
        | "time_up"
        | "out_of_lives"
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
          secondsRemaining *
          5;

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

      const destroyed =
        stats.correct +
        stats.wrongOrder +
        stats.distractor;

      logEvent("level_end", {
        ...logFields,
        result: reason,
        time_in_level_ms: timeInLevel(),
        time_left_s: secondsRemaining,
        lives_left: livesRemaining,
        score: scoreRef.current,
        level_points:
          scoreRef.current -
          scoreAtLevelStart,
        shots_fired: stats.shotsFired,
        shots_hit: stats.shotsHit,
        aim_accuracy: ratio(
          stats.shotsHit,
          stats.shotsFired
        ),
        tokens_correct: stats.correct,
        tokens_wrong_order:
          stats.wrongOrder,
        tokens_distractor:
          stats.distractor,
        concept_accuracy: ratio(
          stats.correct,
          destroyed
        ),
        crashes: stats.crashes,
        wrong_tokens_shot:
          stats.wrongTokens.join(" | "),
        wrong_order_tokens:
          stats.wrongOrderTokens.join(" | "),
      });

      feedbackOpenedAt.current =
        Date.now();
    }

    /*
     * Lose a life (wrong shot or crash):
     * update the HUD, start the damage
     * effects, and end the level at 0 lives.
     */
    function loseLife() {
      livesRemaining =
        Math.max(
          0,
          livesRemaining - 1
        );

      setLives(
        livesRemaining
      );

      setDamageCount(
        (previous) =>
          previous + 1
      );

      invulnerableTime =
        INVULNERABLE_TIME;

      damageFlashTime =
        DAMAGE_FLASH_TIME;

      shakeTime = reduceMotion
        ? 0
        : SHAKE_TIME;

      damagePopups.push({
        x: ship.x,
        y: ship.y - 30,
        age: 0,
      });

      if (
        livesRemaining === 0
      ) {
        audioManager.play(
          "gameOver"
        );

        finishLevel(
          false,
          "out_of_lives"
        );
      } else {
        audioManager.play(
          "wrong"
        );
      }
    }

    /*
     * Ship crashes into an asteroid.
     * Knock them apart so they don't
     * keep overlapping.
     */
    function checkShipCollision() {
      for (
        const asteroid
        of asteroids
      ) {
        const dx =
          ship.x - asteroid.x;

        const dy =
          ship.y - asteroid.y;

        const distance =
          Math.hypot(dx, dy);

        const minDistance =
          SHIP_RADIUS +
          asteroid.radius;

        if (
          distance >= minDistance
        ) {
          continue;
        }

        // Direction from asteroid to ship
        const nx =
          distance > 0
            ? dx / distance
            : 0;

        const ny =
          distance > 0
            ? dy / distance
            : 1;

        ship.x =
          asteroid.x +
          nx * (minDistance + 6);

        ship.y =
          asteroid.y +
          ny * (minDistance + 6);

        ship.x = Math.max(
          25,
          Math.min(width - 25, ship.x)
        );

        ship.y = Math.max(
          25,
          Math.min(height - 25, ship.y)
        );

        // Send the asteroid off the other way
        const speed =
          Math.hypot(
            asteroid.vx,
            asteroid.vy
          );

        asteroid.vx =
          -nx * speed;

        asteroid.vy =
          -ny * speed;

        asteroid.flash = 0.3;

        setMessage(
          "Ouch! Your ship crashed into an asteroid. Steer clear!"
        );

        stats.crashes += 1;

        logEvent("crash", {
          ...logFields,
          token: asteroid.token,
          time_in_level_ms: timeInLevel(),
          lives_left: livesRemaining - 1,
        });

        loseLife();

        return;
      }
    }

    /*
     * Handles an asteroid after
     * its health reaches zero.
     */
    function asteroidDestroyed(
      asteroid: Asteroid
    ): AsteroidOutcome {
      /*
       * The next token the player
       * is supposed to collect.
       */
      const expectedToken =
        levelData.correctTokens[
          selected.length
        ];

      /*
       * Correct token AND correct order.
       */
      if (
        asteroid.token ===
        expectedToken
      ) {
        selected.push(
          asteroid.token
        );

        setSelectedTokens([
          ...selected,
        ]);

        stats.correct += 1;

        logEvent("token_destroyed", {
          ...logFields,
          token: asteroid.token,
          result: "correct",
          time_in_level_ms: timeInLevel(),
        });

        scoreRef.current +=
          100;

        setScore(
          scoreRef.current
        );

        setMessage(
          "Correct token! Keep going!"
        );

        /*
         * Entire word completed.
         */
        if (
          selected.length ===
          levelData.correctTokens
            .length
        ) {
          setMessage(
            "Word complete!"
          );

          audioManager.play(
            "levelComplete"
          );

          finishLevel(
            true,
            "completed"
          );
        } else {
          audioManager.play(
            "correct"
          );
        }

        return "correct";
      }

      /*
       * Determine if this token
       * belongs later in the sequence.
       *
       * Example:
       *
       * correct = un + happ + y
       *
       * Current expected = un
       *
       * Shooting "y" means it is
       * correct, but too early.
       */
      const futureTokens =
        levelData.correctTokens.slice(
          selected.length + 1
        );

      const isCorrectButTooEarly =
        futureTokens.includes(
          asteroid.token
        );

      if (isCorrectButTooEarly) {
        stats.wrongOrder += 1;
        stats.wrongOrderTokens.push(
          asteroid.token
        );
      } else {
        stats.distractor += 1;
        stats.wrongTokens.push(
          asteroid.token
        );
      }

      logEvent("token_destroyed", {
        ...logFields,
        token: asteroid.token,
        result: isCorrectButTooEarly
          ? "wrong_order"
          : "distractor",
        time_in_level_ms: timeInLevel(),
        lives_left: livesRemaining - 1,
      });

      /*
       * All incorrect actions lose
       * a life and 50 points.
       */
      scoreRef.current =
        Math.max(
          0,
          scoreRef.current -
            50
        );

      setScore(
        scoreRef.current
      );

      /*
       * Correct token, wrong order.
       */
      if (
        isCorrectButTooEarly
      ) {
        setMessage(
          `"${asteroid.token}" is a correct token, but you shot it too early! Follow the token order.`
        );
      }

      /*
       * Actual distractor.
       */
      else {
        setMessage(
          `"${asteroid.token}" is not part of the correct token sequence!`
        );
      }

      loseLife();

      if (
        isCorrectButTooEarly
      ) {
        return "wrong-order";
      }

      return "distractor";
    }

    /*
     * Background.
     */
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

      for (const star of STARS) {
        ctx!.fillRect(
          star.x * width,
          star.y * height,
          star.size,
          star.size
        );
      }
    }

    /*
     * Ship.
     */
    function drawShip() {
      ctx!.save();

      ctx!.translate(
        ship.x,
        ship.y
      );

      ctx!.rotate(
        ship.angle
      );

      /*
       * Engine.
       */
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

      /*
       * Ship body.
       */
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

    /*
     * Asteroid.
     */
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
        asteroid.flash >
          0
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

      /*
       * Craters.
       */
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

      /*
       * Token label.
       */
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

      /*
       * Health indicators.
       */
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

    /*
     * Bullet.
     */
    function drawBullet(
      bullet: Bullet
    ) {
      ctx!.save();

      ctx!.fillStyle =
        "#67e8f9";

      ctx!.shadowColor =
        "#22d3ee";

      ctx!.shadowBlur =
        15;

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

    /*
     * Crosshair.
     */
    function drawCrosshair() {
      ctx!.save();

      ctx!.strokeStyle =
        "#67e8f9";

      ctx!.lineWidth =
        1.5;

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

    let animationFrame =
      0;

    let previousTime =
      performance.now();

    /*
     * Red flash around the edges
     * after losing a life.
     */
    function drawDamageFlash() {
      if (damageFlashTime <= 0) return;

      const strength =
        damageFlashTime /
        DAMAGE_FLASH_TIME;

      const gradient =
        ctx!.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.25,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.7
        );

      gradient.addColorStop(
        0,
        `rgba(239, 68, 68, ${0.08 * strength})`
      );

      gradient.addColorStop(
        1,
        `rgba(239, 68, 68, ${0.6 * strength})`
      );

      ctx!.fillStyle = gradient;

      ctx!.fillRect(0, 0, width, height);
    }

    /*
     * Floating "-1 ♥" that rises and fades.
     */
    function drawDamagePopups() {
      ctx!.save();

      ctx!.font =
        "bold 22px Arial, sans-serif";

      ctx!.textAlign = "center";

      for (const popup of damagePopups) {
        const progress =
          popup.age / POPUP_TIME;

        ctx!.globalAlpha =
          1 - progress;

        ctx!.fillStyle = "#f87171";

        ctx!.fillText(
          "-1 ♥",
          popup.x,
          popup.y - progress * 40
        );
      }

      ctx!.restore();
    }

    /*
     * Main game loop.
     */
    function gameLoop(
      now: number
    ) {
      const dt =
        Math.min(
          (now -
            previousTime) /
            1000,
          0.033
        );

      previousTime =
        now;

      if (
        initialized &&
        levelStartedAt === null
      ) {
        levelStartedAt = Date.now();

        logEvent(
          "level_start",
          logFields
        );
      }

      if (
        initialized &&
        levelStatus ===
          "playing"
      ) {
        /*
         * Timer.
         */
        timerAccumulator +=
          dt;

        if (
          timerAccumulator >=
          1
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

            audioManager.play(
              "gameOver"
            );

            finishLevel(
              false,
              "time_up"
            );
          }
        }

        /*
         * WASD movement.
         */
        let dx = 0;
        let dy = 0;

        if (keys.has("w")) {
          dy -= 1;
        }

        if (keys.has("s")) {
          dy += 1;
        }

        if (keys.has("a")) {
          dx -= 1;
        }

        if (keys.has("d")) {
          dx += 1;
        }

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

        ship.x =
          Math.max(
            25,
            Math.min(
              width - 25,
              ship.x
            )
          );

        ship.y =
          Math.max(
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

        /*
         * Move asteroids.
         */
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

          /*
           * Horizontal bounce.
           */
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

            asteroid.x =
              Math.max(
                asteroid.radius,
                Math.min(
                  width -
                    asteroid.radius,
                  asteroid.x
                )
              );
          }

          /*
           * Vertical bounce.
           */
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

            asteroid.y =
              Math.max(
                asteroid.radius,
                Math.min(
                  height -
                    asteroid.radius,
                  asteroid.y
                )
              );
          }
        }

        /*
         * Ship vs asteroid crashes
         * (skipped while recovering from a hit).
         */
        if (invulnerableTime <= 0) {
          checkShipCollision();
        }

        /*
         * Bullets.
         */
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

          /*
           * Remove bullet if it
           * leaves the arena.
           */
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

          /*
           * Collision detection.
           */
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
              /*
               * Bullet disappears.
               */
              bullets.splice(
                i,
                1
              );

              stats.shotsHit += 1;

              /*
               * Damage asteroid.
               */
              asteroid.health -=
                1;

              asteroid.flash =
                0.15;

              /*
               * Asteroid reaches zero health.
               */
              if (
                asteroid.health <=
                0
              ) {
                const outcome =
                  asteroidDestroyed(
                    asteroid
                  );

                /*
                 * Correct token:
                 * break and disappear.
                 */
                if (
                  outcome ===
                  "correct"
                ) {
                  asteroids.splice(
                    j,
                    1
                  );
                }

                /*
                 * Real distractor:
                 * break and disappear.
                 */
                else if (
                  outcome ===
                  "distractor"
                ) {
                  asteroids.splice(
                    j,
                    1
                  );
                }

                /*
                 * Correct token shot
                 * in the WRONG order.
                 *
                 * Do NOT remove it.
                 * Restore its health so
                 * the student can shoot
                 * it later.
                 */
                else {
                  asteroid.health =
                    getAsteroidHealth();

                  asteroid.flash =
                    0.4;

                  /*
                   * Bounce it away so
                   * the player can see
                   * that it survived.
                   */
                  asteroid.vx *=
                    -1;

                  asteroid.vy *=
                    -1;
                }
              }

              break;
            }
          }
        }
      }

      /*
       * Damage effect timers keep running
       * after the level ends so they fade out.
       */
      invulnerableTime =
        Math.max(0, invulnerableTime - dt);

      damageFlashTime =
        Math.max(0, damageFlashTime - dt);

      shakeTime =
        Math.max(0, shakeTime - dt);

      for (
        let i = damagePopups.length - 1;
        i >= 0;
        i--
      ) {
        damagePopups[i].age += dt;

        if (
          damagePopups[i].age >=
          POPUP_TIME
        ) {
          damagePopups.splice(i, 1);
        }
      }

      /*
       * Draw everything.
       */
      drawBackground();

      ctx!.save();

      // Screen shake after a hit
      if (shakeTime > 0) {
        const amount =
          8 * (shakeTime / SHAKE_TIME);

        ctx!.translate(
          (Math.random() * 2 - 1) * amount,
          (Math.random() * 2 - 1) * amount
        );
      }

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

      // Ship blinks while invulnerable
      const shipHidden =
        invulnerableTime > 0 &&
        Math.floor(invulnerableTime * 10) % 2 === 0;

      if (!shipHidden) {
        drawShip();
      }

      drawDamagePopups();

      ctx!.restore();

      drawDamageFlash();
      drawCrosshair();

      animationFrame =
        requestAnimationFrame(
          gameLoop
        );
    }

    /*
     * Event listeners.
     */
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

    /*
     * Cleanup.
     */
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
              {currentLevelIndex +
                1}
              /{levels.length}
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

            <p
              key={damageCount}
              className={`text-lg text-red-400 ${
                damageCount > 0
                  ? "hud-heart-hit"
                  : ""
              }`}
            >
              {"♥".repeat(
                lives
              )}

              <span className="text-slate-600">
                {"♥".repeat(
                  3 - lives
                )}
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

        {/* Target Word */}
        <section className="shrink-0 py-2 text-center">

          <p className="text-xs tracking-[0.25em] text-slate-300">
            TOKENIZING WITH{" "}
            <span className="font-bold text-cyan-300">
              {modelName}
            </span>

            <span className="mx-3 text-slate-600">
              |
            </span>

            DIFFICULTY{" "}
            <span className="text-base font-bold tracking-normal text-yellow-300">
              {"★".repeat(
                level.difficulty
              )}

              {"☆".repeat(
                3 -
                  level.difficulty
              )}
            </span>
          </p>

          <p className="mt-1 text-xs tracking-[0.3em] text-slate-300">
            TARGET WORD
          </p>

          <h1 className="text-3xl font-black uppercase text-yellow-300">
            {level.word}
          </h1>

        </section>

        {/* Game Arena */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border-2 border-cyan-500/40">

          <canvas
            ref={canvasRef}
            className="block h-full w-full cursor-crosshair"
          />

          {levelFeedback && (
            <FeedbackModal
              success={
                levelFeedback.success
              }
              modelName={
                modelName
              }
              word={
                levelFeedback.word
              }
              correctTokens={
                levelFeedback.correctTokens
              }
              selectedTokens={
                levelFeedback.selectedTokens
              }
              explanation={
                levelFeedback.explanation
              }
              score={score}
              verified={
                levelFeedback.verified
              }
              levelNumber={
                currentLevelIndex +
                1
              }
              totalLevels={
                levels.length
              }
              onContinue={
                continueGame
              }
            />
          )}

        </div>

        {/* Bottom HUD */}
        <section className="mt-2 grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2">

          <button
            type="button"
            onClick={exitGame}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-bold hover:bg-slate-600"
          >
            ← EXIT
          </button>

          <div className="text-center">

            <p className="text-[10px] tracking-widest text-slate-400">
              TOKEN SEQUENCE
            </p>

            <p className="font-black text-yellow-300">
              {selectedTokens.length
                ? selectedTokens.join(
                    " + "
                  )
                : "—"}
            </p>

            <p className="text-xs text-cyan-300">
              {message}
            </p>

          </div>

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
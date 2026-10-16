import { Howl, Howler } from "howler";

// Define our sound effects and music tracks
type SoundEffect =
  | "shoot"
  | "title"
  | "crawl"
  | "battle"
  | "explosion"
  | "damage"
  | "correct"
  | "wrong"
  | "levelComplete"
  | "gameOver";

class AudioManager {
  private sounds: Map<SoundEffect, Howl> = new Map();
  private stopTimeouts: Map<SoundEffect, ReturnType<typeof setTimeout>> =
    new Map();
  private activeMusic: Set<SoundEffect> = new Set();
  private isMuted: boolean = false;

  constructor() {
    // Initialize empty or with placeholder paths.
    // Replace these paths with actual sound files in the public/sounds/ directory
    this.sounds.set(
      "shoot",
      new Howl({
        src: ["/sounds/blast.wav"],
        volume: 0.3,
        preload: true,
      })
    );

    this.sounds.set(
      "title",
      new Howl({
        src: ["/sounds/title_reveal.wav"],
        volume: 0.5,
        loop: false,
        preload: true,
        onend: () => this.activeMusic.delete("title"),
      })
    );

    this.sounds.set(
      "crawl",
      new Howl({
        src: ["/sounds/text_crawl.mp3"],
        volume: 0.4,
        loop: false,
        preload: true,
        onend: () => this.activeMusic.delete("crawl"),
      })
    );

    this.sounds.set(
      "battle",
      new Howl({
        src: ["/sounds/battle_music.mp3"],
        volume: 0.4,
        loop: true,
        preload: true,
        onend: () => this.activeMusic.delete("battle"),
      })
    );

    this.sounds.set(
      "explosion",
      new Howl({
        src: ["/sounds/explosion.wav"],
        volume: 0.5,
        preload: true,
      })
    );

    this.sounds.set(
      "damage",
      new Howl({
        src: ["/sounds/damage.wav"],
        volume: 0.5,
        preload: true,
      })
    );

    // Commenting these out until the actual files are ready to avoid 404 errors
    /*
    this.sounds.set(
      "correct",
      new Howl({
        src: ["/sounds/correct.mp3"],
        volume: 0.5,
        preload: true,
      })
    );

    this.sounds.set(
      "wrong",
      new Howl({
        src: ["/sounds/wrong.mp3"],
        volume: 0.5,
        preload: true,
      })
    );

    this.sounds.set(
      "levelComplete",
      new Howl({
        src: ["/sounds/levelComplete.mp3"],
        volume: 0.6,
        preload: true,
      })
    );

    this.sounds.set(
      "gameOver",
      new Howl({
        src: ["/sounds/gameOver.mp3"],
        volume: 0.6,
        preload: true,
      })
    );
    */
  }

  public play(effect: SoundEffect) {
    const isMusic =
      effect === "title" || effect === "crawl" || effect === "battle";

    // If React StrictMode just called stop() and immediately remounted in the same tick,
    // cancel the pending stop so Howler doesn't kill the track as soon as AudioContext unlocks.
    const pendingStop = this.stopTimeouts.get(effect);
    if (pendingStop !== undefined) {
      clearTimeout(pendingStop);
      this.stopTimeouts.delete(effect);
      if (isMusic && this.activeMusic.has(effect)) {
        return;
      }
    }

    if (this.isMuted) return;

    const sound = this.sounds.get(effect);
    if (sound) {
      // Prevent music tracks from stacking on top of themselves
      if (isMusic && (sound.playing() || this.activeMusic.has(effect))) {
        return;
      }
      if (isMusic) {
        this.activeMusic.add(effect);
      }
      sound.play();
    }
    // Silently ignore missing sounds so the console stays clean
  }

  public stop(effect: SoundEffect) {
    const sound = this.sounds.get(effect);
    if (!sound) return;

    if (!this.activeMusic.has(effect) && !sound.playing()) return;

    if (this.stopTimeouts.has(effect)) return;

    const timeout = setTimeout(() => {
      this.stopTimeouts.delete(effect);
      this.activeMusic.delete(effect);
      sound.stop();
    }, 0);

    this.stopTimeouts.set(effect, timeout);
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    Howler.mute(this.isMuted);
    return this.isMuted;
  }

  public setVolume(volume: number) {
    Howler.volume(volume);
  }

  public getMutedState() {
    return this.isMuted;
  }
}

// Export a singleton instance
export const audioManager = new AudioManager();


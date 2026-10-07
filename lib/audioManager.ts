import { Howl, Howler } from "howler";

// Define our sound effects
type SoundEffect = "shoot" | "correct" | "wrong" | "levelComplete" | "gameOver";

class AudioManager {
  private sounds: Map<SoundEffect, Howl> = new Map();
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
    if (this.isMuted) return;

    const sound = this.sounds.get(effect);
    if (sound) {
      sound.play();
    }
    // Silently ignore missing sounds so the console stays clean
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


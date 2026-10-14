import { assets } from "@/game/data/assets";
export class GameAudio {
  private context: AudioContext | null = null;
  private last = 0;
  constructor(
    private enabled: boolean,
    private volume: number,
  ) {}
  unlock() {
    if (!this.enabled || typeof window === "undefined") return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {});
    } catch {
      /* Audio is optional. */
    }
  }
  play(kind: keyof typeof assets.sounds) {
    if (!this.enabled || !this.context || this.context.state !== "running") return;
    const now = this.context.currentTime;
    if (kind === "correct" && now - this.last < 0.07) return;
    this.last = now;
    try {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = kind === "error" || kind === "hit" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(assets.sounds[kind], now);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(60, assets.sounds[kind] * (kind === "boost" ? 2 : 0.6)),
        now + 0.16,
      );
      gain.gain.setValueAtTime(this.volume * (kind === "correct" ? 0.035 : 0.15), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.21);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    } catch {
      /* Unsupported devices remain playable. */
    }
  }
  dispose() {
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
  }
}

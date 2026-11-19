import type { SeededRng } from "./rng";

export type SoundCue =
  | "pedra"
  | "surto"
  | "engrossar_voz"
  | "professor_maconha"
  | "chuva_tempero"
  | "esculacho"
  | "hit"
  | "kill"
  | "xp"
  | "redbull"
  | "powerup"
  | "levelup"
  | "player_hit"
  | "boss_warn"
  | "boss_dash"
  | "boss_down"
  | "gameover";

/**
 * Motor de SFX 100% procedural (Web Audio API) — zero DMCA, unlock no primeiro gesto,
 * controle de volume/mute, variação de pitch determinística e limite de vozes simultâneas.
 */
export class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private volume = 0.5;
  private activeVoices = 0;
  private readonly maxVoices = 16;
  private xpComboStep = 0;
  private lastXpTime = 0;
  private lastCueTime = new Map<SoundCue, number>();

  unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.02
      );
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  play(cue: SoundCue, rng: SeededRng): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    if (this.ctx.state !== "running") return;

    const now = this.ctx.currentTime;
    const minInterval = cue === "hit" || cue === "xp" || cue === "kill" ? 0.045 : 0.07;
    const prev = this.lastCueTime.get(cue) ?? -1;
    if (now - prev < minInterval) return;
    this.lastCueTime.set(cue, now);

    if (this.activeVoices >= this.maxVoices && cue !== "levelup" && cue !== "boss_warn" && cue !== "boss_down") {
      return;
    }

    const jitter = 1 + (rng.next() - 0.5) * 0.12;

    switch (cue) {
      case "pedra":
        this.playTone(230 * jitter, 110 * jitter, 0.09, "triangle", 0.22);
        break;
      case "surto":
        this.playTone(170 * jitter, 58, 0.24, "sawtooth", 0.26);
        this.playNoise(0.18, 0.14, 900);
        break;
      case "engrossar_voz":
        // Bass drop grave marcante
        this.playTone(135 * jitter, 42, 0.34, "sawtooth", 0.32);
        this.playTone(68 * jitter, 34, 0.36, "sine", 0.34);
        break;
      case "professor_maconha":
        this.playNoise(0.22, 0.12, 1600);
        this.playTone(280 * jitter, 360 * jitter, 0.16, "sine", 0.11);
        break;
      case "chuva_tempero":
        this.playTone(540 * jitter, 140, 0.2, "triangle", 0.2);
        this.playNoise(0.14, 0.13, 2200);
        break;
      case "esculacho":
        this.playTone(620 * jitter, 980 * jitter, 0.1, "square", 0.13);
        break;
      case "hit":
        this.playTone(190 * jitter, 95, 0.055, "square", 0.1);
        break;
      case "kill":
        this.playTone(320 * jitter, 120, 0.09, "triangle", 0.16);
        break;
      case "xp": {
        if (now - this.lastXpTime > 0.65) {
          this.xpComboStep = 0;
        } else {
          this.xpComboStep = Math.min(this.xpComboStep + 1, 9);
        }
        this.lastXpTime = now;
        const pentatonic = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1567.98, 1760];
        const freq = pentatonic[this.xpComboStep] ?? 523.25;
        this.playTone(freq, freq * 1.12, 0.08, "sine", 0.16);
        break;
      }
      case "redbull":
        // Lata abrindo + chime energético
        this.playNoise(0.09, 0.2, 4200);
        this.playTone(523.25, 659.25, 0.11, "triangle", 0.24, 0.05);
        this.playTone(783.99, 1046.5, 0.16, "sine", 0.24, 0.13);
        break;
      case "powerup":
        this.playTone(440, 880, 0.14, "triangle", 0.24);
        this.playTone(660, 1320, 0.2, "sine", 0.22, 0.08);
        break;
      case "levelup":
        this.playTone(523.25, 523.25, 0.12, "triangle", 0.26, 0);
        this.playTone(659.25, 659.25, 0.12, "triangle", 0.26, 0.09);
        this.playTone(783.99, 783.99, 0.14, "triangle", 0.26, 0.18);
        this.playTone(1046.5, 1046.5, 0.28, "sine", 0.3, 0.27);
        break;
      case "player_hit":
        this.playTone(150, 55, 0.18, "sawtooth", 0.32);
        this.playNoise(0.12, 0.18, 700);
        break;
      case "boss_warn":
        this.playTone(220, 180, 0.25, "sawtooth", 0.28, 0);
        this.playTone(220, 165, 0.32, "sawtooth", 0.3, 0.28);
        break;
      case "boss_dash":
        this.playTone(340, 110, 0.22, "sawtooth", 0.22);
        break;
      case "boss_down":
        this.playTone(392, 392, 0.13, "triangle", 0.28, 0);
        this.playTone(523.25, 523.25, 0.13, "triangle", 0.28, 0.1);
        this.playTone(659.25, 659.25, 0.15, "triangle", 0.28, 0.2);
        this.playTone(783.99, 1046.5, 0.36, "sine", 0.32, 0.32);
        break;
      case "gameover":
        this.playTone(330, 260, 0.2, "triangle", 0.26, 0);
        this.playTone(247, 196, 0.24, "triangle", 0.26, 0.18);
        this.playTone(174, 110, 0.42, "sawtooth", 0.24, 0.38);
        break;
    }
  }

  private playTone(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    peakGain: number,
    delay = 0
  ): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(25, startFreq), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25, endFreq), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + Math.min(0.015, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.activeVoices += 1;
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playNoise(duration: number, peakGain: number, filterFreq: number): void {
    if (!this.ctx || !this.masterGain) return;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      // Pseudo-ruído rápido determinístico por índice
      const x = Math.sin(i * 12.9898 + filterFreq) * 43758.5453;
      channel[i] = (x - Math.floor(x)) * 2 - 1;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = 1.1;

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(peakGain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    this.activeVoices += 1;
    src.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    src.start(now);
  }

  dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Iconic Kerala Private Bus Air Horn ("SREELAKAM" musical double horn!)
   */
  public playBusHorn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Classic two-stage air horn: F4 (349Hz) + A4 (440Hz) then C5 (523Hz)
    const tones = [
      { f1: 349, f2: 440, start: 0, dur: 0.22 },
      { f1: 392, f2: 523, start: 0.25, dur: 0.35 },
    ];

    tones.forEach(({ f1, f2, start, dur }) => {
      [f1, f2].forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t + start);

        gain.gain.setValueAtTime(0.001, t + start);
        gain.gain.linearRampToValueAtTime(0.12, t + start + 0.02);
        gain.gain.linearRampToValueAtTime(0.1, t + start + dur - 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);

        // Lowpass filter to give realistic air-horn body
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t + start);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t + start);
        osc.stop(t + start + dur + 0.05);
      });
    });
  }

  /**
   * Cow "Moo" sound (Appunni's cow Gomathi)
   */
  public playCowMoo() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Pitch bends down from 140Hz to 110Hz
    osc.frequency.setValueAtTime(135, t);
    osc.frequency.linearRampToValueAtTime(150, t + 0.3);
    osc.frequency.exponentialRampToValueAtTime(105, t + 1.2);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.2);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.setValueAtTime(2.5, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 1.25);
  }

  /**
   * Camel Grunt / Groan (Middle Eastern Camels in Vishnu's Kingdom)
   */
  public playCamelGrunt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Guttural low vibrato
    osc.frequency.setValueAtTime(85, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.2);
    osc.frequency.linearRampToValueAtTime(75, t + 0.6);
    osc.frequency.exponentialRampToValueAtTime(60, t + 1.1);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.1);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 1.15);
  }

  /**
   * Tea Glass Clink & Kettle Hiss at Chayakkada
   */
  public playTeaClink() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // High glass clink
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1950, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.2);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  /**
   * Construction Hammer / Tile placement
   */
  public playBuild() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  /**
   * Coins / Revenue collected
   */
  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0.12, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.26);
    });
  }

  /**
   * Event or festival celebration jingle
   */
  public playFestiveChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C

    notes.forEach((freq, idx) => {
      const startTime = t + idx * 0.1;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.65);
    });
  }
  /**
   * Cat Meow Sound Effect (synthesized smooth kitten inflection)
   */
  public playMeow() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Natural cat meow pitch contour: rise, peak, gentle fall
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.35);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.55);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.08);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.58);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.6);
  }
}

export const villageAudio = new AudioService();

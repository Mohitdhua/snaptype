
// High-fidelity Web Audio API synthesizer for mechanical switches & UI cues
// Zero-latency, 100% offline, realistic acoustic modeling

export type SoundProfile = 'off' | 'cherry-blue' | 'cherry-brown' | 'topre' | 'typewriter' | 'soft';

const SOUND_PROFILE_KEY = 'snaptype_sound_profile_v1';

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Generate 0.05s of white noise for realistic mechanical switch key contact
const getNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = Math.floor(ctx.sampleRate * 0.05);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
};

// Pre-warms Web Audio hardware output to prevent first-keystroke lag
export const warmupAudio = () => {
  try {
    const ctx = initAudio();
    getNoiseBuffer(ctx);
    // Silent inaudible pulse to wake up audio hardware thread without delay
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.00001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(0.001);
  } catch {
    // Ignore autoplay restrictions prior to user gesture
  }
};

if (typeof window !== 'undefined') {
  const triggerEarlyWarmup = () => {
    warmupAudio();
    window.removeEventListener('pointerdown', triggerEarlyWarmup);
    window.removeEventListener('keydown', triggerEarlyWarmup);
    window.removeEventListener('touchstart', triggerEarlyWarmup);
  };
  window.addEventListener('pointerdown', triggerEarlyWarmup, { once: true, passive: true });
  window.addEventListener('keydown', triggerEarlyWarmup, { once: true, passive: true });
  window.addEventListener('touchstart', triggerEarlyWarmup, { once: true, passive: true });
}

export const getSoundProfile = (): SoundProfile => {
  try {
    const saved = localStorage.getItem(SOUND_PROFILE_KEY);
    if (saved && ['off', 'cherry-blue', 'cherry-brown', 'topre', 'typewriter', 'soft'].includes(saved)) {
      return saved as SoundProfile;
    }
  } catch {
    // fallback
  }
  return 'cherry-blue';
};

export const setSoundProfile = (profile: SoundProfile) => {
  try {
    localStorage.setItem(SOUND_PROFILE_KEY, profile);
  } catch {
    // ignore
  }
};

export const playKeystrokeSound = (profile?: SoundProfile, isEnter = false) => {
  const currentProfile = profile || getSoundProfile();
  if (currentProfile === 'off') return;

  try {
    const ctx = initAudio();
    const now = ctx.currentTime;

    // Slight micro-pitch randomization (+/- 4%) so every keystroke sounds organic
    const pitchJitter = 1 + (Math.random() * 0.08 - 0.04);

    if (currentProfile === 'cherry-blue') {
      // Crisp clicky switch: sharp high-frequency snap + release transient
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);

      // Add contact noise tick
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3500;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.02);
    } else if (currentProfile === 'topre') {
      // Deep acoustic "Thock" (capacitive dome bottoming out into plate)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      // Low pass resonance
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 450;
      filter.Q.value = 3;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (currentProfile === 'cherry-brown') {
      // Tactile dampened bump: mid-low warm punch
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.045);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } else if (currentProfile === 'typewriter') {
      // Heavy metal hammer strike
      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.04);

      // Carriage bell on Enter!
      if (isEnter) {
        const bell = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(1800, now + 0.02);
        bellGain.gain.setValueAtTime(0.15, now + 0.02);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        bell.connect(bellGain);
        bellGain.connect(ctx.destination);
        bell.start(now + 0.02);
        bell.stop(now + 0.35);
      }
    } else if (currentProfile === 'soft') {
      // Minimal soft bubble pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  } catch {
    // Ignore audio policy issues
  }
};

export const playSound = (type: 'click' | 'error' | 'success') => {
  if (type === 'click') {
    playKeystrokeSound();
    return;
  }

  try {
    const ctx = initAudio();
    const now = ctx.currentTime;

    if (type === 'error') {
      // Soft dull thud for mistake
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.08);

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.linearRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'success') {
      // Harmonious two-tone major chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc2.frequency.setValueAtTime(783.99, now + 0.1); // G5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.1);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    }
  } catch {
    // Ignore
  }
};

// ================= Audio Metronome Engine =================

let metronomeTimer: ReturnType<typeof setInterval> | null = null;
let currentMetronomeBpm: number = 0;

export const playMetronomeTick = (isDownbeat = false) => {
  try {
    const ctx = initAudio();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1200 : 800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.02);

    gain.gain.setValueAtTime(isDownbeat ? 0.09 : 0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  } catch {
    // Ignore audio policy
  }
};

export const startMetronome = (wpmTarget: number) => {
  stopMetronome();
  if (wpmTarget <= 0) return;
  // 1 WPM = 5 key depressions per minute (BPM = WPM * 5)
  const bpm = Math.max(30, Math.min(300, wpmTarget * 5));
  currentMetronomeBpm = bpm;
  const intervalMs = (60 / bpm) * 1000;

  let beatCount = 0;
  playMetronomeTick(true);
  metronomeTimer = setInterval(() => {
    beatCount++;
    playMetronomeTick(beatCount % 5 === 0);
  }, intervalMs);
};

export const stopMetronome = () => {
  if (metronomeTimer) {
    clearInterval(metronomeTimer);
    metronomeTimer = null;
  }
  currentMetronomeBpm = 0;
};

export const getMetronomeBpm = () => currentMetronomeBpm;


let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playTone = (freq: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
  initAudio();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

export const sounds = {
  click: () => playTone(800, 'sine', 0.1, 0.2),
  hover: () => playTone(400, 'sine', 0.05, 0.05),
  correct: () => {
    playTone(523.25, 'triangle', 0.5, 0.2); // C5
    setTimeout(() => playTone(659.25, 'triangle', 0.5, 0.2), 100); // E5
    setTimeout(() => playTone(783.99, 'triangle', 0.5, 0.2), 200); // G5
    setTimeout(() => playTone(1046.50, 'triangle', 0.5, 0.2), 300); // C6
  },
  wrong: () => {
    playTone(220, 'sawtooth', 0.3, 0.1); // A3
    setTimeout(() => playTone(196, 'sawtooth', 0.4, 0.1), 150); // G3
  },
  hint: () => playTone(600, 'sine', 0.2, 0.1),
};

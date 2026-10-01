/**
 * Notification blip synthesised with the Web Audio API — no audio file to ship,
 * and nothing to 404 on a bad deploy.
 */
let audioContext = null;

const getContext = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioContext) {
    try {
      audioContext = new AudioContextClass();
    } catch {
      return null;
    }
  }

  return audioContext;
};

/**
 * Browsers start an AudioContext suspended until a user gesture. Call this from
 * a click handler so the first real notification is not silently swallowed.
 */
export const primeSound = () => {
  const context = getContext();
  if (context && context.state === 'suspended') context.resume().catch(() => {});
};

/** Two short descending tones — audible but not alarming. */
export const playNotificationSound = () => {
  const context = getContext();
  if (!context) return;

  if (context.state === 'suspended') context.resume().catch(() => {});

  const now = context.currentTime;

  const master = context.createGain();
  master.gain.value = 0.12;
  master.connect(context.destination);

  [
    { frequency: 880, at: 0 },
    { frequency: 660, at: 0.13 },
  ].forEach(({ frequency, at }) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    // Quick attack, smooth decay — a raw gate would click.
    envelope.gain.setValueAtTime(0, now + at);
    envelope.gain.linearRampToValueAtTime(1, now + at + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + at + 0.18);

    oscillator.connect(envelope);
    envelope.connect(master);

    oscillator.start(now + at);
    oscillator.stop(now + at + 0.2);
  });
};

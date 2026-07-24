let audioCtx: AudioContext | null = null;
let isAudioActivated = false;

export function isAudioEnabled(): boolean {
  return isAudioActivated && audioCtx !== null && audioCtx.state === 'running';
}

export async function activateAudio(): Promise<boolean> {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    // Play a tiny silent chime to confirm activation
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0.01;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);

    isAudioActivated = true;
    return true;
  } catch (error) {
    console.error('Audio Activation failed:', error);
    return false;
  }
}

/**
 * Plays a pleasant double chime for new order notifications.
 */
export function playNewOrderChime() {
  if (!audioCtx || audioCtx.state !== 'running') return;

  try {
    const now = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.2); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.4); // D6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.5);
  } catch (e) {
    console.warn('Could not play audio chime:', e);
  }
}

/**
 * Plays an urgent repeating alert for waiter calls or late orders.
 */
export function playWaiterCallAlert() {
  if (!audioCtx || audioCtx.state !== 'running') return;

  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(783.99, now); // G5
    osc.frequency.setValueAtTime(1046.5, now + 0.1); // C6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn('Could not play waiter call sound:', e);
  }
}

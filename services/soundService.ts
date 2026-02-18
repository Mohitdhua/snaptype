
// A simple synth service to avoid loading external mp3s
// Uses the Web Audio API

let audioCtx: AudioContext | null = null;

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export const playSound = (type: 'click' | 'error' | 'success') => {
    try {
        const ctx = initAudio();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'click') {
            // Mechanical switch sound simulation
            // High pitched, very short sine/square mix
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
            
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'error') {
            // Low thud
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0.01, now + 0.1);
            
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'success') {
            // Level up/Badge unlock chime
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.setValueAtTime(800, now + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
            
            osc.start(now);
            osc.stop(now + 0.4);
        }
    } catch (e) {
        // Audio playback failed (likely browser policy or muted)
    }
};

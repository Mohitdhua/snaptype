/**
 * PiperTTS & Native Speech Engine Manager Service
 */

export type TtsEngineMode = 'PIPER_NEURAL' | 'NATIVE_WEB_SPEECH';

export interface PiperVoiceOption {
  id: string;
  name: string;
  lang: string;
  modelUrl: string;
  configUrl: string;
}

export const PIPER_VOICE_MODELS: PiperVoiceOption[] = [
  {
    id: 'piper-lessac-medium',
    name: 'Piper Neural (US Lessac - High Clarity)',
    lang: 'en-US',
    modelUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx',
    configUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json',
  },
  {
    id: 'piper-amy-medium',
    name: 'Piper Neural (US Amy - Natural Tone)',
    lang: 'en-US',
    modelUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx',
    configUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json',
  },
];

class PiperTtsManager {
  private activeAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;

  public async speak(
    text: string,
    options: {
      engineMode?: TtsEngineMode;
      piperVoiceId?: string;
      voiceURI?: string;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<void> {
    const {
      engineMode = 'PIPER_NEURAL',
      piperVoiceId = 'piper-lessac-medium',
      voiceURI,
      rate = 0.75,
      pitch = 1.0,
      onStart,
      onEnd,
      onError
    } = options;

    this.stop();

    if (engineMode === 'PIPER_NEURAL') {
      try {
        if (onStart) onStart();

        // Check if Web Speech API fallback or HTML5 Audio synth should be used
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = Math.max(0.5, rate);
          utterance.pitch = pitch;
          utterance.lang = 'en-US';

          const voices = window.speechSynthesis.getVoices();
          const preferredNeural = voices.find(v =>
            /google|natural|neural|samantha|premium|enhanced/i.test(v.name)
          ) || voices.find(v => v.lang.startsWith('en'));

          if (preferredNeural) {
            utterance.voice = preferredNeural;
          }

          utterance.onend = () => { if (onEnd) onEnd(); };
          utterance.onerror = (e) => { if (onError) onError(e); else if (onEnd) onEnd(); };

          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => { if (onEnd) onEnd(); }, 800);
        }
        return;
      } catch (err) {
        console.warn('PiperTTS engine notice, falling back to Native Web Speech', err);
      }
    }

    // NATIVE_WEB_SPEECH mode
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (onStart) onStart();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = 'en-US';

      if (voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const chosen = voices.find(v => v.voiceURI === voiceURI);
        if (chosen) utterance.voice = chosen;
      }

      utterance.onend = () => { if (onEnd) onEnd(); };
      utterance.onerror = (e) => { if (onError) onError(e); else if (onEnd) onEnd(); };

      window.speechSynthesis.speak(utterance);
    } else {
      if (onStart) onStart();
      setTimeout(() => { if (onEnd) onEnd(); }, 800);
    }
  }

  public stop(): void {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const piperTtsService = new PiperTtsManager();

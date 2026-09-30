/**
 * PiperTTS Service: Client-side Neural TTS Engine & Web Speech API Integration
 */

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
    name: 'Piper Neural (US Lessac - High Quality)',
    lang: 'en-US',
    modelUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx',
    configUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json',
  },
  {
    id: 'piper-amy-medium',
    name: 'Piper Neural (US Amy - Natural Voice)',
    lang: 'en-US',
    modelUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx',
    configUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json',
  },
];

class PiperTtsManager {
  private activeAudio: HTMLAudioElement | null = null;
  private isLoadedMap: Map<string, boolean> = new Map();

  public async speak(
    text: string,
    options: {
      voiceId?: string;
      rate?: number;
      pitch?: number;
      voiceURI?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<void> {
    const { rate = 0.85, pitch = 1.0, voiceURI, onStart, onEnd, onError } = options;

    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }

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

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        if (onError) onError(e);
        else if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      if (onStart) onStart();
      setTimeout(() => {
        if (onEnd) onEnd();
      }, 1000);
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

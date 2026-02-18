/**
 * Voice commands for AR (SpeechRecognition API).
 * @module ar/accessibility/VoiceControl
 */

import { logger } from '@/lib/logger';

type CommandCallback = () => void;

/** Minimal type for Speech Recognition (browser API). */
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: { length: number; [i: number]: { 0: { transcript: string }; length: number } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

/**
 * Voice control: register phrases and callbacks (e.g. "place", "remove", "screenshot").
 */
export class VoiceControl {
  private recognition: SpeechRecognitionInstance | null = null;
  private readonly commands = new Map<string, CommandCallback>();
  private started = false;

  /**
   * Start listening for voice commands.
   */
  start(): void {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition ?? window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      logger.warn('VoiceControl: SpeechRecognition not available');
      return;
    }
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const transcript = (last[0] && last[0].transcript) ? last[0].transcript.trim().toLowerCase() : '';
      for (const [phrase, cb] of this.commands) {
        if (transcript.includes(phrase.toLowerCase())) {
          cb();
          break;
        }
      }
    };
    this.recognition.onerror = (e) => {
      logger.debug('VoiceControl: recognition error', { error: e.error });
    };
    this.recognition.start();
    this.started = true;
    logger.debug('VoiceControl: started');
  }

  /**
   * Register a phrase and callback (e.g. "place", "remove", "screenshot", "bigger", "smaller").
   */
  registerCommand(phrase: string, callback: CommandCallback): void {
    this.commands.set(phrase.toLowerCase(), callback);
  }

  /**
   * Stop listening.
   */
  stop(): void {
    if (this.recognition && this.started) {
      this.recognition.stop();
      this.started = false;
    }
    this.recognition = null;
    logger.debug('VoiceControl: stopped');
  }

  dispose(): void {
    this.stop();
    this.commands.clear();
  }
}

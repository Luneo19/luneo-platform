/**
 * Record AR session via MediaRecorder + canvas capture.
 * @module ar/export/ARVideoRecorder
 */

import { logger } from '@/lib/logger';

export type RecordingState = 'inactive' | 'recording' | 'paused';

/**
 * Records AR session from canvas using MediaRecorder.
 */
export class ARVideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];

  /**
   * Start recording from canvas (captureStream).
   */
  startRecording(canvas: HTMLCanvasElement): boolean {
    try {
      const stream = canvas.captureStream?.(30) ?? (canvas as HTMLCanvasElement & { captureStream?(fps?: number): MediaStream }).captureStream?.(30);
      if (!stream) {
        logger.warn('ARVideoRecorder: captureStream not available');
        return false;
      }
      this.stream = stream;
      this.chunks = [];
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000 });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size) this.chunks.push(e.data);
      };
      this.mediaRecorder.start(100);
      logger.debug('ARVideoRecorder: started');
      return true;
    } catch (err) {
      logger.warn('ARVideoRecorder: startRecording failed', { error: String(err) });
      return false;
    }
  }

  /**
   * Stop recording. Returns Promise that resolves with video Blob.
   */
  async stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return null;
    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const blob = this.chunks.length
          ? new Blob(this.chunks, { type: this.mediaRecorder?.mimeType ?? 'video/webm' })
          : null;
        this.mediaRecorder = null;
        this.stream = null;
        this.chunks = [];
        resolve(blob);
      };
      this.mediaRecorder!.stop();
    });
  }

  getRecordingState(): RecordingState {
    return (this.mediaRecorder?.state as RecordingState) ?? 'inactive';
  }
}

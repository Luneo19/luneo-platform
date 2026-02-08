/**
 * Minimal type declarations for @mediapipe/pose (optional dependency).
 * Library may not be installed at build time; used at runtime in AR/BodyTracker.
 */
declare module '@mediapipe/pose' {
  export interface PoseLandmark {
    x: number;
    y: number;
    z?: number;
    visibility?: number;
  }

  export interface PoseResults {
    poseLandmarks?: PoseLandmark[];
  }

  export interface PoseOptions {
    locateFile?: (file: string) => string;
  }

  export interface PoseConstructorOptions {
    locateFile?: (file: string) => string;
  }

  export interface PoseConfig {
    modelComplexity?: 0 | 1 | 2;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
    selfieMode?: boolean;
  }

  export class Pose {
    constructor(options?: PoseConstructorOptions);
    setOptions(options: PoseConfig): void;
    onResults(callback: (results: PoseResults) => void): void;
    send(input: { image: HTMLVideoElement | HTMLImageElement }): Promise<void>;
  }
}

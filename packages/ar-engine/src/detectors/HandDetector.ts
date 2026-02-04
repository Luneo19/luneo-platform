/**
 * Détection main - MediaPipe Hands
 * Implémentation complète avec détection en temps réel
 */

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandLandmarks {
  wrist: HandLandmark;
  thumb: HandLandmark;
  thumbCmc: HandLandmark;
  thumbMcp: HandLandmark;
  thumbIp: HandLandmark;
  thumbTip: HandLandmark;
  index: HandLandmark;
  indexMcp: HandLandmark;
  indexPip: HandLandmark;
  indexDip: HandLandmark;
  indexTip: HandLandmark;
  middle: HandLandmark;
  middleMcp: HandLandmark;
  middlePip: HandLandmark;
  middleDip: HandLandmark;
  middleTip: HandLandmark;
  ring: HandLandmark;
  ringMcp: HandLandmark;
  ringPip: HandLandmark;
  ringDip: HandLandmark;
  ringTip: HandLandmark;
  pinky: HandLandmark;
  pinkyMcp: HandLandmark;
  pinkyPip: HandLandmark;
  pinkyDip: HandLandmark;
  pinkyTip: HandLandmark;
  handedness: 'Left' | 'Right';
  confidence: number;
}

interface HandDetectorConfig {
  maxHands?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

// MediaPipe landmark indices
const LANDMARK_INDICES = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
};

export class HandDetector {
  private hands: any = null;
  private camera: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private isInitialized = false;
  private isRunning = false;
  private lastResults: HandLandmarks[] = [];
  private config: HandDetectorConfig;
  private onResultsCallback: ((results: HandLandmarks[]) => void) | null = null;

  constructor(config: HandDetectorConfig = {}) {
    this.config = {
      maxHands: config.maxHands ?? 2,
      minDetectionConfidence: config.minDetectionConfidence ?? 0.7,
      minTrackingConfidence: config.minTrackingConfidence ?? 0.5,
    };
  }

  async initialize(videoElement?: HTMLVideoElement): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Dynamic import of MediaPipe Hands
      const { Hands } = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');

      this.hands = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      this.hands.setOptions({
        maxNumHands: this.config.maxHands,
        modelComplexity: 1,
        minDetectionConfidence: this.config.minDetectionConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence,
      });

      this.hands.onResults((results: any) => {
        this.processResults(results);
      });

      // Create or use video element
      if (videoElement) {
        this.videoElement = videoElement;
      } else {
        this.videoElement = document.createElement('video');
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);
      }

      // Initialize camera
      this.camera = new Camera(this.videoElement, {
        onFrame: async () => {
          if (this.hands && this.isRunning) {
            await this.hands.send({ image: this.videoElement! });
          }
        },
        width: 640,
        height: 480,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize HandDetector:', error);
      throw new Error('MediaPipe Hands initialization failed. Make sure @mediapipe/hands is installed.');
    }
  }

  private processResults(results: any): void {
    this.lastResults = [];

    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i];

        const handLandmarks: HandLandmarks = {
          wrist: this.toLandmark(landmarks[LANDMARK_INDICES.WRIST]),
          thumb: this.toLandmark(landmarks[LANDMARK_INDICES.THUMB_TIP]),
          thumbCmc: this.toLandmark(landmarks[LANDMARK_INDICES.THUMB_CMC]),
          thumbMcp: this.toLandmark(landmarks[LANDMARK_INDICES.THUMB_MCP]),
          thumbIp: this.toLandmark(landmarks[LANDMARK_INDICES.THUMB_IP]),
          thumbTip: this.toLandmark(landmarks[LANDMARK_INDICES.THUMB_TIP]),
          index: this.toLandmark(landmarks[LANDMARK_INDICES.INDEX_TIP]),
          indexMcp: this.toLandmark(landmarks[LANDMARK_INDICES.INDEX_MCP]),
          indexPip: this.toLandmark(landmarks[LANDMARK_INDICES.INDEX_PIP]),
          indexDip: this.toLandmark(landmarks[LANDMARK_INDICES.INDEX_DIP]),
          indexTip: this.toLandmark(landmarks[LANDMARK_INDICES.INDEX_TIP]),
          middle: this.toLandmark(landmarks[LANDMARK_INDICES.MIDDLE_TIP]),
          middleMcp: this.toLandmark(landmarks[LANDMARK_INDICES.MIDDLE_MCP]),
          middlePip: this.toLandmark(landmarks[LANDMARK_INDICES.MIDDLE_PIP]),
          middleDip: this.toLandmark(landmarks[LANDMARK_INDICES.MIDDLE_DIP]),
          middleTip: this.toLandmark(landmarks[LANDMARK_INDICES.MIDDLE_TIP]),
          ring: this.toLandmark(landmarks[LANDMARK_INDICES.RING_TIP]),
          ringMcp: this.toLandmark(landmarks[LANDMARK_INDICES.RING_MCP]),
          ringPip: this.toLandmark(landmarks[LANDMARK_INDICES.RING_PIP]),
          ringDip: this.toLandmark(landmarks[LANDMARK_INDICES.RING_DIP]),
          ringTip: this.toLandmark(landmarks[LANDMARK_INDICES.RING_TIP]),
          pinky: this.toLandmark(landmarks[LANDMARK_INDICES.PINKY_TIP]),
          pinkyMcp: this.toLandmark(landmarks[LANDMARK_INDICES.PINKY_MCP]),
          pinkyPip: this.toLandmark(landmarks[LANDMARK_INDICES.PINKY_PIP]),
          pinkyDip: this.toLandmark(landmarks[LANDMARK_INDICES.PINKY_DIP]),
          pinkyTip: this.toLandmark(landmarks[LANDMARK_INDICES.PINKY_TIP]),
          handedness: handedness.label as 'Left' | 'Right',
          confidence: handedness.score,
        };

        this.lastResults.push(handLandmarks);
      }
    }

    if (this.onResultsCallback) {
      this.onResultsCallback(this.lastResults);
    }
  }

  private toLandmark(point: { x: number; y: number; z: number }): HandLandmark {
    return {
      x: point.x,
      y: point.y,
      z: point.z || 0,
    };
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.camera && !this.isRunning) {
      this.isRunning = true;
      await this.camera.start();
    }
  }

  detect(): HandLandmarks | null {
    return this.lastResults.length > 0 ? this.lastResults[0] : null;
  }

  detectAll(): HandLandmarks[] {
    return this.lastResults;
  }

  onResults(callback: (results: HandLandmarks[]) => void): void {
    this.onResultsCallback = callback;
  }

  stop(): void {
    this.isRunning = false;
    if (this.camera) {
      this.camera.stop();
    }
  }

  dispose(): void {
    this.stop();
    if (this.hands) {
      this.hands.close();
      this.hands = null;
    }
    if (this.videoElement && !this.videoElement.parentElement) {
      this.videoElement.remove();
    }
    this.videoElement = null;
    this.isInitialized = false;
  }
}


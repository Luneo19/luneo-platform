import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { logger } from '@/lib/logger';

export interface HandLandmarks {
  handedness: 'Left' | 'Right';
  landmarks: Array<{ x: number; y: number; z: number }>;
  wristPosition: { x: number; y: number; z: number };
  fingerPositions: {
    thumb: Array<{ x: number; y: number; z: number }>;
    index: Array<{ x: number; y: number; z: number }>;
    middle: Array<{ x: number; y: number; z: number }>;
    ring: Array<{ x: number; y: number; z: number }>;
    pinky: Array<{ x: number; y: number; z: number }>;
  };
  handRotation: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  handSize: number;
  ringFingerPosition: { x: number; y: number; z: number };
}

export class HandTracker {
  private hands: Hands;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isInitialized = false;
  private onResultsCallback: ((results: HandLandmarks[]) => void) | null = null;

  constructor() {
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults(this.handleResults.bind(this));
  }

  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.videoElement = videoElement;

      // Get user camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      videoElement.srcObject = stream;
      
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          resolve();
        };
      });

      await videoElement.play();

      // Initialize camera
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.videoElement) {
            await this.hands.send({ image: this.videoElement });
          }
        },
        width: 1280,
        height: 720,
      });

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize HandTracker', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  start(): void {
    if (this.camera && this.isInitialized) {
      this.camera.start();
    }
  }

  stop(): void {
    if (this.camera) {
      this.camera.stop();
    }
    
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  onResults(callback: (results: HandLandmarks[]) => void): void {
    this.onResultsCallback = callback;
  }

  private handleResults(results: Results): void {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.onResultsCallback?.([]);
      return;
    }

    const handsData: HandLandmarks[] = [];

    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const handedness = results.multiHandedness[i].label as 'Left' | 'Right';

      // Extract finger positions
      const fingerPositions = {
        thumb: landmarks.slice(1, 5),
        index: landmarks.slice(5, 9),
        middle: landmarks.slice(9, 13),
        ring: landmarks.slice(13, 17),
        pinky: landmarks.slice(17, 21),
      };

      // Wrist position (landmark 0)
      const wrist = landmarks[0];

      // Ring finger base (landmark 13) - where rings are typically worn
      const ringFinger = landmarks[13];

      // Calculate hand size (distance from wrist to middle finger tip)
      const middleFingerTip = landmarks[12];
      const handSize = Math.sqrt(
        Math.pow(middleFingerTip.x - wrist.x, 2) +
        Math.pow(middleFingerTip.y - wrist.y, 2) +
        Math.pow(middleFingerTip.z - wrist.z, 2)
      );

      // Estimate hand rotation
      const rotation = this.estimateHandRotation(landmarks);

      const handData: HandLandmarks = {
        handedness,
        landmarks,
        wristPosition: wrist,
        fingerPositions,
        handRotation: rotation,
        handSize,
        ringFingerPosition: ringFinger,
      };

      handsData.push(handData);
    }

    this.onResultsCallback?.(handsData);
  }

  private estimateHandRotation(landmarks: Array<{ x: number; y: number; z: number }>): {
    pitch: number;
    yaw: number;
    roll: number;
  } {
    // Calculate rotation based on wrist and middle finger
    const wrist = landmarks[0];
    const middleFinger = landmarks[9];
    const indexFinger = landmarks[5];

    // Roll (rotation around z-axis)
    const deltaY = middleFinger.y - wrist.y;
    const deltaX = middleFinger.x - wrist.x;
    const roll = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Pitch (rotation around x-axis)
    const deltaZ = middleFinger.z - wrist.z;
    const pitch = Math.atan2(deltaZ, deltaY) * (180 / Math.PI);

    // Yaw (rotation around y-axis)
    const indexDelta = indexFinger.x - middleFinger.x;
    const yaw = indexDelta * 180;

    return { pitch, yaw, roll };
  }

  destroy(): void {
    this.stop();
    this.hands.close();
  }
}


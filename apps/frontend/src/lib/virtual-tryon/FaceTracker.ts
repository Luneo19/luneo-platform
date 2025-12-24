import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { logger } from '@/lib/logger';

export interface FaceLandmarks {
  landmarks: Array<{ x: number; y: number; z: number }>;
  boundingBox: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
    width: number;
    height: number;
  };
  rotation: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  eyePositions: {
    left: { x: number; y: number };
    right: { x: number; y: number };
    distance: number;
  };
  nosePosition: { x: number; y: number; z: number };
  faceWidth: number;
  faceHeight: number;
}

export class FaceTracker {
  private faceMesh: FaceMesh;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isInitialized = false;
  private onResultsCallback: ((results: FaceLandmarks | null) => void) | null = null;

  constructor() {
    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.faceMesh.onResults(this.handleResults.bind(this));
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
            await this.faceMesh.send({ image: this.videoElement });
          }
        },
        width: 1280,
        height: 720,
      });

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize FaceTracker', {
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

  onResults(callback: (results: FaceLandmarks | null) => void): void {
    this.onResultsCallback = callback;
  }

  private handleResults(results: Results): void {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      this.onResultsCallback?.(null);
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    
    // Calculate bounding box
    const xs = landmarks.map((l) => l.x);
    const ys = landmarks.map((l) => l.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);

    // Eye positions (landmarks 33 = left eye, 263 = right eye)
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const eyeDistance = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
    );

    // Nose position (landmark 1 = nose tip)
    const nose = landmarks[1];

    // Estimate rotation (simplified)
    const rotation = this.estimateRotation(landmarks);

    const faceLandmarks: FaceLandmarks = {
      landmarks: landmarks,
      boundingBox: {
        xMin,
        yMin,
        xMax,
        yMax,
        width: xMax - xMin,
        height: yMax - yMin,
      },
      rotation,
      eyePositions: {
        left: { x: leftEye.x, y: leftEye.y },
        right: { x: rightEye.x, y: rightEye.y },
        distance: eyeDistance,
      },
      nosePosition: { x: nose.x, y: nose.y, z: nose.z },
      faceWidth: xMax - xMin,
      faceHeight: yMax - yMin,
    };

    this.onResultsCallback?.(faceLandmarks);
  }

  private estimateRotation(landmarks: Array<{ x: number; y: number; z: number }>): {
    pitch: number;
    yaw: number;
    roll: number;
  } {
    // Simplified rotation estimation based on key facial landmarks
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1];
    const chin = landmarks[152];

    // Calculate roll (head tilt left/right)
    const eyeDeltaY = rightEye.y - leftEye.y;
    const eyeDeltaX = rightEye.x - leftEye.x;
    const roll = Math.atan2(eyeDeltaY, eyeDeltaX) * (180 / Math.PI);

    // Calculate pitch (head tilt up/down)
    const noseToChin = chin.y - nose.y;
    const pitch = (noseToChin - 0.1) * 180; // Normalized approximation

    // Calculate yaw (head turn left/right)
    const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
    const noseOffset = nose.x - eyeCenter.x;
    const yaw = noseOffset * 180; // Normalized approximation

    return { pitch, yaw, roll };
  }

  destroy(): void {
    this.stop();
    this.faceMesh.close();
  }
}


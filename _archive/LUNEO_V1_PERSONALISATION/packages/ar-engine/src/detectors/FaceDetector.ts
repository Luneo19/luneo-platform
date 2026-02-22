/**
 * ★ DETECTION VISAGE - MEDIAPIPE ★
 */

import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface FaceLandmarks {
  noseBridge: { x: number; y: number; z: number };
  leftEar: { x: number; y: number; z: number };
  rightEar: { x: number; y: number; z: number };
  chin: { x: number; y: number; z: number };
  forehead: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
}

export class FaceDetector {
  private faceLandmarker: FaceLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private lastVideoTime: number = -1;
  
  async initialize(): Promise<void> {
    // Init MediaPipe
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );
    
    this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numFaces: 1
    });
    
    // Init camera
    await this.startCamera();
  }
  
  private async startCamera(): Promise<void> {
    this.video = document.createElement("video");
    this.video.style.display = "none";
    document.body.appendChild(this.video);
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    
    this.video.srcObject = stream;
    await this.video.play();
  }
  
  detect(): FaceLandmarks | null {
    if (!this.faceLandmarker || !this.video) return null;
    
    const videoTime = this.video.currentTime;
    if (videoTime === this.lastVideoTime) return null;
    
    this.lastVideoTime = videoTime;
    
    // Détection
    const results = this.faceLandmarker.detectForVideo(this.video, Date.now());
    
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return null;
    }
    
    const landmarks = results.faceLandmarks[0];
    
    // Extract points clefs
    const noseBridge = landmarks[168]; // Pont du nez
    const leftEar = landmarks[234];    // Oreille gauche
    const rightEar = landmarks[454];   // Oreille droite
    const chin = landmarks[152];       // Menton
    const forehead = landmarks[10];     // Front
    
    // Calcule rotation tête
    const rotation = this.calculateHeadRotation(landmarks);
    
    return {
      noseBridge: { x: noseBridge.x, y: noseBridge.y, z: noseBridge.z || 0 },
      leftEar: { x: leftEar.x, y: leftEar.y, z: leftEar.z || 0 },
      rightEar: { x: rightEar.x, y: rightEar.y, z: rightEar.z || 0 },
      chin: { x: chin.x, y: chin.y, z: chin.z || 0 },
      forehead: { x: forehead.x, y: forehead.y, z: forehead.z || 0 },
      rotation
    };
  }
  
  private calculateHeadRotation(landmarks: any[]): { pitch: number; yaw: number; roll: number } {
    // Calcul simplifié de rotation
    const nose = landmarks[1];
    const chin = landmarks[152];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    
    // Pitch (vertical)
    const pitch = Math.atan2(chin.y - nose.y, chin.z - nose.z) * (180 / Math.PI);
    
    // Yaw (horizontal)
    const yaw = Math.atan2(nose.x - (leftEye.x + rightEye.x) / 2, nose.z) * (180 / Math.PI);
    
    // Roll (inclinaison)
    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
    
    return { pitch, yaw, roll };
  }
  
  stop(): void {
    if (this.video && this.video.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.video.remove();
    }
  }
}


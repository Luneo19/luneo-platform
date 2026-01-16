/**
 * Placement bijoux - Bracelets, bagues, colliers, boucles d'oreilles
 * Conforme au plan PHASE 3 - AR avancée - Harmoniser mapping landmarks ↔ produits
 */

import * as THREE from "three";
import { HAND_LANDMARKS_INDICES } from "@luneo/virtual-try-on/src/tracking/HandTracker";
import { FACE_LANDMARKS_INDICES } from "@luneo/virtual-try-on/src/tracking/FaceTracker";

/**
 * Interface pour landmarks de main (depuis HandTracker)
 */
interface HandLandmarks {
  landmarks: Array<{ x: number; y: number; z: number }>;
  handedness?: 'Left' | 'Right';
}

/**
 * Interface pour landmarks de visage (depuis FaceTracker)
 */
interface FaceLandmarks {
  landmarks: Array<{ x: number; y: number; z: number }>;
  leftEar?: { x: number; y: number; z: number };
  rightEar?: { x: number; y: number; z: number };
  chin?: { x: number; y: number; z: number };
}

export class JewelryPlacement {
  /**
   * Place un bracelet ou une montre sur le poignet
   * Utilise HAND_LANDMARKS_INDICES.WRIST (index 0)
   */
  static updateWrist(jewelryGroup: THREE.Group, landmarks: HandLandmarks): void {
    if (!landmarks.landmarks || landmarks.landmarks.length === 0) return;

    // ✅ Utiliser landmark WRIST (index 0) - Harmonisé avec HandTracker
    const wrist = landmarks.landmarks[HAND_LANDMARKS_INDICES.WRIST];
    if (!wrist) return;

    // Convertir coordonnées normalized [0,1] → world space
    const worldX = (wrist.x - 0.5) * 2;
    const worldY = -(wrist.y - 0.5) * 2;
    const worldZ = wrist.z * -5;

    jewelryGroup.position.set(worldX, worldY, worldZ);

    // ✅ Calculer orientation depuis poignet + index finger MCP
    const wristLandmark = landmarks.landmarks[HAND_LANDMARKS_INDICES.WRIST];
    const indexMCP = landmarks.landmarks[HAND_LANDMARKS_INDICES.INDEX_FINGER_MCP];

    if (wristLandmark && indexMCP) {
      const dx = indexMCP.x - wristLandmark.x;
      const dy = indexMCP.y - wristLandmark.y;
      const angle = Math.atan2(dy, dx);
      jewelryGroup.rotation.z = angle;
    }

    // ✅ Scale selon largeur du poignet (distance entre WRIST et INDEX_FINGER_MCP)
    if (wristLandmark && indexMCP) {
      const distance = Math.sqrt(
        Math.pow(indexMCP.x - wristLandmark.x, 2) +
        Math.pow(indexMCP.y - wristLandmark.y, 2)
      );
      const baseScale = 0.12; // Pour bracelet/watch
      const scaleFactor = distance / 0.15; // 0.15 = distance "normale"
      jewelryGroup.scale.setScalar(baseScale * scaleFactor);
    }
  }

  /**
   * Place une bague sur un doigt
   * Utilise HAND_LANDMARKS_INDICES pour les doigts
   */
  static updateRing(ringGroup: THREE.Group, landmarks: HandLandmarks): void {
    if (!landmarks.landmarks || landmarks.landmarks.length === 0) return;

    // ✅ Par défaut, utiliser RING_FINGER_PIP (index 15) - Harmonisé avec HandTracker
    const ringFingerPIP = landmarks.landmarks[HAND_LANDMARKS_INDICES.RING_FINGER_PIP];
    if (!ringFingerPIP) return;

    const worldX = (ringFingerPIP.x - 0.5) * 2;
    const worldY = -(ringFingerPIP.y - 0.5) * 2;
    const worldZ = ringFingerPIP.z * -5;

    ringGroup.position.set(worldX, worldY, worldZ);

    // ✅ Rotation selon orientation du doigt
    const ringPIP = landmarks.landmarks[HAND_LANDMARKS_INDICES.RING_FINGER_PIP];
    const ringDIP = landmarks.landmarks[HAND_LANDMARKS_INDICES.RING_FINGER_DIP];

    if (ringPIP && ringDIP) {
      const dx = ringDIP.x - ringPIP.x;
      const dy = ringDIP.y - ringPIP.y;
      const angle = Math.atan2(dy, dx);
      ringGroup.rotation.z = angle;
    }

    // ✅ Scale selon largeur du doigt
    const baseScale = 0.05;
    ringGroup.scale.setScalar(baseScale);
  }

  /**
   * Place des boucles d'oreilles
   * Utilise FACE_LANDMARKS_INDICES pour les oreilles
   */
  static updateEarrings(earringsGroup: THREE.Group, landmarks: FaceLandmarks): void {
    if (!landmarks.landmarks || landmarks.landmarks.length === 0) return;

    // ✅ Utiliser landmarks d'oreilles - Harmonisé avec FaceTracker
    const leftEar = landmarks.leftEar || landmarks.landmarks[FACE_LANDMARKS_INDICES.LEFT_EAR];
    const rightEar = landmarks.rightEar || landmarks.landmarks[FACE_LANDMARKS_INDICES.RIGHT_EAR];

    if (!leftEar || !rightEar) return;

    // Position moyenne des deux oreilles (pour groupe contenant les deux boucles)
    const centerX = (leftEar.x + rightEar.x) / 2;
    const centerY = (leftEar.y + rightEar.y) / 2;
    const centerZ = (leftEar.z + rightEar.z) / 2;

    const worldX = (centerX - 0.5) * 2;
    const worldY = -(centerY - 0.5) * 2;
    const worldZ = centerZ * -5;

    earringsGroup.position.set(worldX, worldY, worldZ);

    // ✅ Scale selon distance entre oreilles
    const earDistance = Math.sqrt(
      Math.pow(rightEar.x - leftEar.x, 2) +
      Math.pow(rightEar.y - leftEar.y, 2)
    );
    const baseScale = 0.08;
    const scaleFactor = earDistance / 0.25;
    earringsGroup.scale.setScalar(baseScale * scaleFactor);
  }

  /**
   * Place un collier autour du cou
   * Utilise FACE_LANDMARKS_INDICES pour le cou/menton
   */
  static updateNecklace(necklaceGroup: THREE.Group, landmarks: FaceLandmarks): void {
    if (!landmarks.landmarks || landmarks.landmarks.length === 0) return;

    // ✅ Utiliser CHIN (index 152) comme point d'ancrage - Harmonisé avec FaceTracker
    const chin = landmarks.chin || landmarks.landmarks[FACE_LANDMARKS_INDICES.CHIN];
    if (!chin) return;

    // Position légèrement au-dessus du menton
    const worldX = (chin.x - 0.5) * 2;
    const worldY = -(chin.y - 0.5) * 2 + 0.1; // Légèrement au-dessus
    const worldZ = chin.z * -5;

    necklaceGroup.position.set(worldX, worldY, worldZ);

    // ✅ Scale selon largeur du cou (distance entre oreilles)
    const leftEar = landmarks.leftEar || landmarks.landmarks[FACE_LANDMARKS_INDICES.LEFT_EAR];
    const rightEar = landmarks.rightEar || landmarks.landmarks[FACE_LANDMARKS_INDICES.RIGHT_EAR];

    if (leftEar && rightEar) {
      const earDistance = Math.sqrt(
        Math.pow(rightEar.x - leftEar.x, 2) +
        Math.pow(rightEar.y - leftEar.y, 2)
      );
      const baseScale = 0.2;
      const scaleFactor = earDistance / 0.25;
      necklaceGroup.scale.setScalar(baseScale * scaleFactor);
    }
  }
}


/**
 * ★ PLACEMENT INTELLIGENT - LUNETTES ★
 * Positionne les lunettes sur le visage
 * Prend en compte la rotation de la tête
 */

import * as THREE from "three";
import { FaceLandmarks } from "../detectors/FaceDetector";

export class GlassesPlacement {
  /**
   * Positionne les lunettes sur le visage
   * Prend en compte la rotation de la tête
   */
  static update(glassesGroup: THREE.Group, faceLandmarks: FaceLandmarks): void {
    const { noseBridge, leftEar, rightEar, rotation } = faceLandmarks;
    
    // Position : centre entre les oreilles, ajusté au nez
    const centerX = (leftEar.x + rightEar.x) / 2;
    const centerY = noseBridge.y;
    const centerZ = noseBridge.z;
    
    // Convertit coordonnées normalized [0,1] → world space
    const worldX = (centerX - 0.5) * 2;
    const worldY = -(centerY - 0.5) * 2;
    const worldZ = centerZ * -5;
    
    glassesGroup.position.set(worldX, worldY, worldZ);
    
    // Rotation selon tête
    glassesGroup.rotation.x = rotation.pitch * (Math.PI / 180);
    glassesGroup.rotation.y = rotation.yaw * (Math.PI / 180);
    glassesGroup.rotation.z = rotation.roll * (Math.PI / 180);
    
    // Scale dynamique selon distance entre oreilles
    const earDistance = Math.sqrt(
      Math.pow(rightEar.x - leftEar.x, 2) +
      Math.pow(rightEar.y - leftEar.y, 2)
    );
    
    const baseScale = 0.15;
    const scaleFactor = earDistance / 0.25; // 0.25 = distance "normale"
    glassesGroup.scale.setScalar(baseScale * scaleFactor);
  }
}


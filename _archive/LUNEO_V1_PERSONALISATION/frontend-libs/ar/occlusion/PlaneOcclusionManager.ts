/**
 * Occlusion by detected surfaces (planes) as fallback when depth/people occlusion unavailable.
 * Builds invisible occlusion meshes from WebXR detected planes.
 * @module ar/occlusion/PlaneOcclusionManager
 */

import * as THREE from 'three';
import { logger } from '@/lib/logger';

export interface DetectedPlane {
  orientation: 'horizontal' | 'vertical';
  polygon: DOMPointReadOnly[];
  lastChangedTime: number;
  mesh?: THREE.Mesh;
}

/**
 * Manages occlusion using detected planes: builds occlusion meshes from plane polygons.
 */
export class PlaneOcclusionManager {
  private session: XRSession | null = null;
  private referenceSpace: XRReferenceSpace | null = null;
  private readonly occlusionMeshes: THREE.Group;
  private readonly planeMap = new Map<number, DetectedPlane & { mesh: THREE.Mesh }>();
  private planeIdCounter = 0;

  constructor() {
    this.occlusionMeshes = new THREE.Group();
    this.occlusionMeshes.name = 'PlaneOcclusionMeshes';
  }

  /**
   * Initialize plane occlusion: request plane-detection and store reference space.
   */
  async initialize(session: XRSession): Promise<boolean> {
    try {
      this.referenceSpace = await session.requestReferenceSpace('local-floor');
      this.session = session;
      return true;
    } catch (err) {
      logger.warn('PlaneOcclusionManager: initialize failed', { error: String(err) });
      return false;
    }
  }

  /**
   * Update occlusion meshes from current frame (uses session.getDetectedPlanes when available).
   * Can also call updateFromPlanes(planes) with planes from PlaneDetector.
   */
  update(frame: XRFrame): void {
    const session = frame.session as XRSession & { getDetectedPlanes?: () => Set<XRPlane> };
    if (typeof session.getDetectedPlanes !== 'function') return;
    const set = session.getDetectedPlanes();
    if (!set) return;
    for (const xrPlane of set) {
      const key = (xrPlane as XRPlane & { _occlusionId?: number })._occlusionId;
      const id = key ?? ++this.planeIdCounter;
      if (key === undefined) (xrPlane as XRPlane & { _occlusionId?: number })._occlusionId = id;
      if (this.planeMap.has(id)) continue;
      const plane: DetectedPlane = {
        orientation: xrPlane.orientation,
        polygon: xrPlane.polygon ?? [],
        lastChangedTime: xrPlane.lastChangedTime,
      };
      const mesh = this.createOcclusionMesh(plane);
      if (mesh) {
        this.occlusionMeshes.add(mesh);
        this.planeMap.set(id, { ...plane, mesh });
      }
    }
  }

  /**
   * Update from an external list of planes (e.g. from PlaneDetector.getPlanes()).
   */
  updateFromPlanes(planes: DetectedPlane[]): void {
    for (let i = 0; i < planes.length; i++) {
      const id = i + 1000;
      if (this.planeMap.has(id)) continue;
      const mesh = this.createOcclusionMesh(planes[i]);
      if (mesh) {
        this.occlusionMeshes.add(mesh);
        this.planeMap.set(id, { ...planes[i], mesh });
      }
    }
  }

  /**
   * Create an invisible occlusion mesh from a plane's polygon.
   */
  createOcclusionMesh(plane: DetectedPlane): THREE.Mesh | null {
    const polygon = plane.polygon;
    if (!polygon?.length) return null;
    const points = polygon.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();
    const geom = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      visible: false,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = plane.orientation === 'vertical' ? -Math.PI / 2 : 0;
    mesh.name = 'PlaneOcclusion';
    return mesh;
  }

  /**
   * Get the group containing all occlusion meshes. Add to scene to enable occlusion.
   */
  getOcclusionGroup(): THREE.Group {
    return this.occlusionMeshes;
  }

  dispose(): void {
    this.occlusionMeshes.clear();
    this.planeMap.clear();
    this.session = null;
    this.referenceSpace = null;
  }
}

declare module 'gltf-pipeline' {
  export function processGlb(
    glb: Buffer,
    options?: Record<string, unknown>
  ): Promise<{ glb: Buffer } & Record<string, unknown>>;

  export function processGltf(
    gltf: any,
    options?: Record<string, unknown>
  ): Promise<{ gltf: any } & Record<string, unknown>>;

  export function glbToGltf(
    glb: Buffer,
    options?: Record<string, unknown>
  ): Promise<{ gltf: any } & Record<string, unknown>>;

  export function gltfToGlb(
    gltf: any,
    options?: Record<string, unknown>
  ): Promise<{ glb: Buffer } & Record<string, unknown>>;
}


#!/usr/bin/env tsx

/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║  🎬 RENDER WORKER - LUNEO ENTERPRISE                             ║
 * ║     Worker pour le rendu 3D et la génération AR                  ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

// Types
interface RenderJob {
  designId: string;
  productId: string;
  brandId: string;
  userId?: string;
  renderType: 'gltf' | 'stl' | 'obj' | 'usdz';
  options: {
    quality: 'low' | 'medium' | 'high';
    includeAnimations?: boolean;
    includePhysics?: boolean;
    customMaterials?: any;
  };
}

interface RenderResult {
  modelUrl: string;
  previewUrl?: string;
  metadata: {
    format: string;
    size: number;
    vertices: number;
    faces: number;
    processingTimeMs: number;
    blenderVersion: string;
  };
}

// Configuration
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();
const eventEmitter = new EventEmitter();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration Blender
const BLENDER_PATH = process.env.BLENDER_PATH || '/usr/bin/blender';
const TEMP_DIR = process.env.TEMP_DIR || '/tmp/luneo-render';

// Configuration du Worker
const worker = new Worker(
  'render-3d',
  async (job: Job<RenderJob>) => {
    const startTime = Date.now();
    const { designId, productId, brandId, userId, renderType, options } = job.data;

    console.log(`🎬 Processing 3D render ${designId} - ${renderType}`);

    try {
      // 1. Récupérer les données du design
      const design = await prisma.design.findUnique({
        where: { id: designId },
        include: {
          product: true,
          brand: true,
        },
      });

      if (!design) {
        throw new Error(`Design ${designId} not found`);
      }

      if (design.status !== 'COMPLETED') {
        throw new Error(`Design ${designId} not completed yet`);
      }

      // 2. Créer le répertoire temporaire
      const workDir = path.join(TEMP_DIR, `render-${designId}`);
      await fs.mkdir(workDir, { recursive: true });

      try {
        // 3. Télécharger et préparer les assets
        const assets = await prepareAssets(design, workDir);

        // 4. Générer le script Blender
        const blenderScript = await generateBlenderScript({
          design,
          renderType,
          options,
          assets,
          workDir,
        });

        // 5. Exécuter le rendu Blender
        const renderResult = await executeBlenderRender(blenderScript, workDir, renderType);

        // 6. Post-traitement et optimisation
        const processedResult = await postProcessRender(renderResult, workDir, renderType, options);

        // 7. Upload vers Cloudinary
        const uploadResult = await uploadRenderResults(processedResult, designId, renderType);

        // 8. Mettre à jour la base de données
        await updateDesignWithRender(designId, uploadResult, renderType);

        // 9. Émettre l'événement de completion
        eventEmitter.emit('render.completed', {
          designId,
          brandId,
          userId,
          renderType,
          modelUrl: uploadResult.modelUrl,
          previewUrl: uploadResult.previewUrl,
        });

        const processingTime = Date.now() - startTime;
        console.log(`✅ 3D render ${designId} completed in ${processingTime}ms`);

        return {
          success: true,
          designId,
          renderType,
          modelUrl: uploadResult.modelUrl,
          previewUrl: uploadResult.previewUrl,
          processingTimeMs: processingTime,
        };

      } finally {
        // Nettoyer le répertoire temporaire
        await fs.rm(workDir, { recursive: true, force: true });
      }

    } catch (error) {
      console.error(`❌ Error processing 3D render ${designId}:`, error);

      // Émettre l'événement d'erreur
      eventEmitter.emit('render.failed', {
        designId,
        brandId,
        userId,
        renderType,
        error: error.message,
      });

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 2, // Traiter 2 rendus en parallèle (Blender est gourmand)
    removeOnComplete: 50,
    removeOnFail: 25,
  }
);

/**
 * Préparation des assets pour le rendu
 */
async function prepareAssets(design: any, workDir: string): Promise<any> {
  const assets: any = {
    productModel: null,
    designImage: null,
    materials: {},
  };

  try {
    // Télécharger le modèle 3D du produit
    if (design.product.model3dUrl) {
      const modelPath = path.join(workDir, 'product_model.glb');
      await downloadFile(design.product.model3dUrl, modelPath);
      assets.productModel = modelPath;
    }

    // Télécharger l'image du design généré
    if (design.highResUrl) {
      const imagePath = path.join(workDir, 'design_image.png');
      await downloadFile(design.highResUrl, imagePath);
      assets.designImage = imagePath;
    }

    // Préparer les matériaux personnalisés
    if (design.options?.material) {
      assets.materials = await generateMaterialTextures(design.options.material, workDir);
    }

    return assets;

  } catch (error) {
    console.error('Error preparing assets:', error);
    throw new Error(`Asset preparation failed: ${error.message}`);
  }
}

/**
 * Génération du script Blender
 */
async function generateBlenderScript(params: {
  design: any;
  renderType: string;
  options: any;
  assets: any;
  workDir: string;
}): Promise<string> {
  const { design, renderType, options, assets, workDir } = params;

  const script = `
import bpy
import bmesh
import os
import sys
from mathutils import Vector

# Configuration
work_dir = "${workDir}"
output_format = "${renderType}"
quality = "${options.quality}"

# Nettoyer la scène
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Importer le modèle du produit
if os.path.exists("${assets.productModel}"):
    bpy.ops.import_scene.gltf(filepath="${assets.productModel}")
    product_obj = bpy.context.selected_objects[0]
    product_obj.name = "Product"
else:
    # Créer un objet par défaut si pas de modèle
    bpy.ops.mesh.primitive_cube_add()
    product_obj = bpy.context.active_object
    product_obj.name = "Product"
    product_obj.scale = (2, 1, 0.5)

# Configuration des matériaux
material = bpy.data.materials.new(name="ProductMaterial")
material.use_nodes = True
material.node_tree.nodes.clear()

# Shader principled
principled = material.node_tree.nodes.new(type='ShaderNodeBsdfPrincipled')
output = material.node_tree.nodes.new(type='ShaderNodeOutputMaterial')
material.node_tree.links.new(principled.outputs['BSDF'], output.inputs['Surface'])

# Configuration selon le matériau
material_type = "${design.options?.material || 'default'}"
if material_type == "gold":
    principled.inputs['Base Color'].default_value = (1.0, 0.8, 0.2, 1.0)
    principled.inputs['Metallic'].default_value = 1.0
    principled.inputs['Roughness'].default_value = 0.1
elif material_type == "silver":
    principled.inputs['Base Color'].default_value = (0.9, 0.9, 0.9, 1.0)
    principled.inputs['Metallic'].default_value = 1.0
    principled.inputs['Roughness'].default_value = 0.2
elif material_type == "steel":
    principled.inputs['Base Color'].default_value = (0.7, 0.7, 0.7, 1.0)
    principled.inputs['Metallic'].default_value = 1.0
    principled.inputs['Roughness'].default_value = 0.3

# Appliquer le matériau
product_obj.data.materials.append(material)

# Ajouter l'image du design comme texture
if os.path.exists("${assets.designImage}"):
    # Charger l'image
    design_image = bpy.data.images.load("${assets.designImage}")
    
    # Créer un nœud de texture
    texture_node = material.node_tree.nodes.new(type='ShaderNodeTexImage')
    texture_node.image = design_image
    
    # Mixer avec le matériau de base
    mix_node = material.node_tree.nodes.new(type='ShaderNodeMixShader')
    material.node_tree.links.new(principled.outputs['BSDF'], mix_node.inputs[1])
    material.node_tree.links.new(texture_node.outputs['Color'], mix_node.inputs[0])
    material.node_tree.links.new(mix_node.outputs['Shader'], output.inputs['Surface'])

# Configuration de l'éclairage
bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
sun = bpy.context.active_object
sun.data.energy = 3

# Ajouter un éclairage d'ambiance
bpy.ops.object.light_add(type='AREA', location=(-5, -5, 8))
area_light = bpy.context.active_object
area_light.data.energy = 2
area_light.data.size = 10

# Configuration de la caméra
bpy.ops.object.camera_add(location=(7, -7, 5))
camera = bpy.context.active_object
camera.rotation_euler = (1.1, 0, 0.785)

# Sélectionner la caméra comme caméra active
bpy.context.scene.camera = camera

# Configuration du rendu selon la qualité
if quality == "high":
    bpy.context.scene.render.resolution_x = 2048
    bpy.context.scene.render.resolution_y = 2048
    bpy.context.scene.cycles.samples = 256
elif quality == "medium":
    bpy.context.scene.render.resolution_x = 1024
    bpy.context.scene.render.resolution_y = 1024
    bpy.context.scene.cycles.samples = 128
else:  # low
    bpy.context.scene.render.resolution_x = 512
    bpy.context.scene.render.resolution_y = 512
    bpy.context.scene.cycles.samples = 64

# Configuration du moteur de rendu
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.device = 'GPU' if bpy.context.preferences.addons['cycles'].preferences.has_active_device() else 'CPU'

# Export selon le format
output_path = os.path.join(work_dir, f"rendered_model.{output_format}")

if output_format == "gltf":
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLTF_SEPARATE',
        export_materials='EXPORT',
        export_textures=True,
        export_colors=True,
        use_mesh_edges=False,
        use_mesh_vertices=False,
        export_cameras=False,
        export_lights=False,
        export_yup=True,
        export_apply=True
    )
elif output_format == "stl":
    bpy.ops.export_mesh.stl(filepath=output_path)
elif output_format == "obj":
    bpy.ops.export_scene.obj(filepath=output_path)
elif output_format == "usdz":
    # USDZ nécessite une configuration spéciale
    bpy.ops.export_scene.gltf(
        filepath=output_path.replace('.usdz', '.glb'),
        export_format='GLB'
    )

print(f"Render completed: {output_path}")
`;

  const scriptPath = path.join(workDir, 'render_script.py');
  await fs.writeFile(scriptPath, script);
  return scriptPath;
}

/**
 * Exécution du rendu Blender
 */
async function executeBlenderRender(scriptPath: string, workDir: string, renderType: string): Promise<any> {
  try {
    console.log(`🎬 Executing Blender render: ${scriptPath}`);

    // Commande Blender
    const command = `${BLENDER_PATH} --background --python ${scriptPath}`;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: workDir,
      timeout: 300000, // 5 minutes timeout
    });

    console.log('Blender stdout:', stdout);
    if (stderr) {
      console.log('Blender stderr:', stderr);
    }

    // Vérifier que le fichier de sortie existe
    const outputFile = path.join(workDir, `rendered_model.${renderType}`);
    const stats = await fs.stat(outputFile);
    
    if (!stats.isFile()) {
      throw new Error(`Output file not created: ${outputFile}`);
    }

    return {
      outputPath: outputFile,
      size: stats.size,
    };

  } catch (error) {
    console.error('Blender execution error:', error);
    throw new Error(`Blender render failed: ${error.message}`);
  }
}

/**
 * Post-traitement du rendu
 */
async function postProcessRender(
  renderResult: any,
  workDir: string,
  renderType: string,
  options: any
): Promise<any> {
  const { outputPath, size } = renderResult;

  try {
    // Créer une preview image
    const previewPath = await generatePreviewImage(outputPath, workDir);

    // Optimiser le modèle selon la qualité
    const optimizedPath = await optimizeModel(outputPath, workDir, options.quality);

    return {
      modelPath: optimizedPath,
      previewPath: previewPath,
      originalSize: size,
    };

  } catch (error) {
    console.error('Post-processing error:', error);
    // Retourner le résultat original si le post-traitement échoue
    return {
      modelPath: outputPath,
      previewPath: null,
      originalSize: size,
    };
  }
}

/**
 * Génération d'une image de preview
 */
async function generatePreviewImage(modelPath: string, workDir: string): Promise<string | null> {
  try {
    // Script Blender pour générer une preview
    const previewScript = `
import bpy
import os

# Charger le modèle
if "${modelPath}".endswith('.glb') or "${modelPath}".endswith('.gltf'):
    bpy.ops.import_scene.gltf(filepath="${modelPath}")
elif "${modelPath}".endswith('.obj'):
    bpy.ops.import_scene.obj(filepath="${modelPath}")

# Configuration de la caméra pour preview
bpy.ops.object.camera_add(location=(5, -5, 3))
camera = bpy.context.active_object
camera.rotation_euler = (1.2, 0, 0.785)
bpy.context.scene.camera = camera

# Configuration du rendu preview
bpy.context.scene.render.resolution_x = 512
bpy.context.scene.render.resolution_y = 512
bpy.context.scene.render.engine = 'BLENDER_EEVEE'
bpy.context.scene.eevee.samples = 32

# Rendu
preview_path = os.path.join("${workDir}", "preview.png")
bpy.context.scene.render.filepath = preview_path
bpy.ops.render.render(write_still=True)

print(f"Preview generated: {preview_path}")
`;

    const previewScriptPath = path.join(workDir, 'preview_script.py');
    await fs.writeFile(previewScriptPath, previewScript);

    const command = `${BLENDER_PATH} --background --python ${previewScriptPath}`;
    await execAsync(command, { cwd: workDir });

    const previewPath = path.join(workDir, 'preview.png');
    const stats = await fs.stat(previewPath);
    
    return stats.isFile() ? previewPath : null;

  } catch (error) {
    console.error('Preview generation error:', error);
    return null;
  }
}

/**
 * Optimisation du modèle
 */
async function optimizeModel(modelPath: string, workDir: string, quality: string): Promise<string> {
  try {
    // Pour l'instant, on retourne le modèle original
    // Dans une version future, on pourrait utiliser des outils comme gltf-pipeline
    return modelPath;

  } catch (error) {
    console.error('Model optimization error:', error);
    return modelPath; // Retourner l'original si l'optimisation échoue
  }
}

/**
 * Upload des résultats vers Cloudinary
 */
async function uploadRenderResults(
  processedResult: any,
  designId: string,
  renderType: string
): Promise<{ modelUrl: string; previewUrl?: string }> {
  try {
    const results: { modelUrl: string; previewUrl?: string } = {
      modelUrl: '',
    };

    // Upload du modèle 3D
    const modelUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: `models/${designId}`,
          public_id: `model.${renderType}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(await fs.readFile(processedResult.modelPath));
    });

    results.modelUrl = modelUpload.secure_url;

    // Upload de la preview si disponible
    if (processedResult.previewPath) {
      const previewUpload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: `models/${designId}`,
            public_id: 'preview',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(await fs.readFile(processedResult.previewPath));
      });

      results.previewUrl = previewUpload.secure_url;
    }

    return results;

  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

/**
 * Mise à jour de la base de données avec les résultats du rendu
 */
async function updateDesignWithRender(
  designId: string,
  uploadResult: any,
  renderType: string
): Promise<void> {
  try {
    const updateData: any = {
      metadata: {
        render: {
          type: renderType,
          modelUrl: uploadResult.modelUrl,
          previewUrl: uploadResult.previewUrl,
          timestamp: new Date().toISOString(),
        },
      },
    };

    // Ajouter le champ spécifique selon le type de rendu
    switch (renderType) {
      case 'gltf':
        updateData.gltfUrl = uploadResult.modelUrl;
        break;
      case 'stl':
        updateData.stlUrl = uploadResult.modelUrl;
        break;
      case 'obj':
        updateData.objUrl = uploadResult.modelUrl;
        break;
      case 'usdz':
        updateData.usdzUrl = uploadResult.modelUrl;
        break;
    }

    await prisma.design.update({
      where: { id: designId },
      data: updateData,
    });

  } catch (error) {
    console.error('Database update error:', error);
    throw new Error(`Database update failed: ${error.message}`);
  }
}

/**
 * Utilitaires
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
}

async function generateMaterialTextures(materialType: string, workDir: string): Promise<any> {
  // Génération de textures de matériaux personnalisées
  // Pour l'instant, on retourne un objet vide
  return {};
}

/**
 * Gestion des événements
 */
eventEmitter.on('render.completed', async (data) => {
  console.log('🎉 3D render completed:', data);
});

eventEmitter.on('render.failed', async (data) => {
  console.log('💥 3D render failed:', data);
});

/**
 * Gestion des signaux
 */
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down Render worker...');
  await worker.close();
  await redis.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down Render worker...');
  await worker.close();
  await redis.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('🎬 Render Worker started successfully');
console.log(`📊 Processing jobs with concurrency: ${worker.opts.concurrency}`);
console.log(`🔗 Connected to Redis: ${process.env.REDIS_URL}`);
console.log(`🎬 Blender path: ${BLENDER_PATH}`);
console.log(`☁️ Cloudinary configured: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Yes' : 'No'}`);
console.log(`📁 Temp directory: ${TEMP_DIR}`);

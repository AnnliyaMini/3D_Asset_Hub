import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { AssetMetadata } from '../types/types.js';

export type LoadedModel = {
  object: THREE.Object3D;
  animations: THREE.AnimationClip[];
};

/** derive the lowercase file extension of a filename. */
export function extensionOf(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * parse a 3D model from an ArrayBuffer into a three.js object graph.
 *
 * @param buffer the raw file bytes.
 * @param fileName used to detect the format.
 * @returns the loaded object and any animation clips it contains.
 */
export async function parseModel(
  buffer: ArrayBuffer,
  fileName: string
): Promise<LoadedModel> {
  const ext = extensionOf(fileName);

  if (ext !== 'glb') {
    throw new Error(
      'Only GLB (.glb) files are supported.'
    );
  }

  const loader = new GLTFLoader();

  const gltf = await loader.parseAsync(buffer, '');

  return {
    object: gltf.scene,
    animations: gltf.animations || [],
  };
}

/**
 * walk an object graph and extract geometry, material and texture statistics.
 *
 * @param model the parsed model.
 * @param fileSize size of the source file in bytes.
 * @param fileName used to record the format.
 * @returns full metadata describing the asset.
 */
export function extractMetadata(model: LoadedModel, fileSize: number, fileName: string): AssetMetadata {
  let triangles = 0;
  let vertices = 0;
  let meshes = 0;
  let hasSkinnedMesh = false;
  let maxTextureSize = 0;
  const materials = new Set<string>();
  const textures = new Set<string>();

  model.object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!(mesh as THREE.Mesh).isMesh) return;
    meshes += 1;
    if ((child as THREE.SkinnedMesh).isSkinnedMesh) hasSkinnedMesh = true;

    const geometry = mesh.geometry as THREE.BufferGeometry;
    const position = geometry?.getAttribute('position');
    if (position) {
      vertices += position.count;
      triangles += geometry.index ? geometry.index.count / 3 : position.count / 3;
    }

    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    list.filter(Boolean).forEach((mat) => {
      materials.add(mat.uuid);
      Object.values(mat as unknown as Record<string, unknown>).forEach((value) => {
        const tex = value as THREE.Texture;
        if (tex && (tex as THREE.Texture).isTexture) {
          textures.add(tex.uuid);
          const img = tex.image as { width?: number; height?: number } | undefined;
          if (img?.width) maxTextureSize = Math.max(maxTextureSize, img.width, img.height || 0);
        }
      });
    });
  });

  const box = new THREE.Box3().setFromObject(model.object);
  const size = box.getSize(new THREE.Vector3());
  const round = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 1000) / 1000;

  return {
    triangles: Math.round(triangles),
    vertices,
    meshes,
    materials: materials.size,
    textures: textures.size,
    maxTextureSize,
    animations: model.animations.length,
    boundingBox: { x: round(size.x), y: round(size.y), z: round(size.z) },
    fileSize,
    format: extensionOf(fileName),
    hasSkinnedMesh,
  };
}

/**
 * frame an object inside a camera so it fills the viewport nicely.
 */
export function frameObject(object: THREE.Object3D, camera: THREE.PerspectiveCamera, controlsTarget?: THREE.Vector3) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const distance = (maxDim / (2 * Math.tan((camera.fov * Math.PI) / 360))) * 1.9;

  object.position.sub(center);
  camera.position.set(distance * 0.8, distance * 0.6, distance);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);
  controlsTarget?.set(0, 0, 0);
}

/**
 * render an offscreen PNG preview of a parsed model.
 *
 * @param model the parsed model to render.
 * @param size square output resolution in pixels.
 * @returns a base64 data URL, or undefined when WebGL is unavailable.
 */
export function renderThumbnail(model: LoadedModel, size = 320): string | undefined {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(size, size, false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x161b26);

    const clone = model.object.clone(true);
    scene.add(clone);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x30364a, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7aa2ff, 1.1);
    rim.position.set(-5, 2, -4);
    scene.add(rim);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    frameObject(clone, camera);

    renderer.render(scene, camera);
    const dataUrl = canvas.toDataURL('image/png');

    renderer.dispose();
    return dataUrl;
  } catch {
    return undefined;
  }
}

/**
 * read a browser File into an ArrayBuffer.
 */
export function readFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

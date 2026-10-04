import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { parseModel, frameObject } from '../services/three-loader.js';
import styles from '../pages/viewer.module.css';

type Props = {
  url: string;
  fileName: string;
};

/**
 * interactive WebGL viewer for inspecting a 3D asset.
 * supports orbit/zoom/pan, wireframe, grid and auto-rotate.
 */
export function ModelViewer({ url, fileName }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    grid: THREE.GridHelper;
    root?: THREE.Object3D;
    mixer?: THREE.AnimationMixer;
    frame: number;
  } | null>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x11151f);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
    camera.position.set(3, 2, 4);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setStatus('error');
      setError('WebGL is not available in this browser.');
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.className = styles.canvas;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x2b3348, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(5, 8, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x7aa2ff, 1.0);
    fill.position.set(-6, 2, -5);
    scene.add(fill);

    const grid = new THREE.GridHelper(20, 20, 0x3a4459, 0x252c3c);
    scene.add(grid);

    const state= {
  renderer,
  scene,
  camera,
  controls,
  grid,
  mixer: null as THREE.AnimationMixer | null,
  frame: 0,
};
    sceneRef.current = state as typeof sceneRef.current;

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const clock = new THREE.Clock();
    const animate = () => {
      state.frame = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (state.mixer) {
  state.mixer.update(delta);
}
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(state.frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const state = sceneRef.current;
    if (!state || !url) return undefined;

    setStatus('loading');
    setError('');

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Could not download the model (${res.status})`);
        const buffer = await res.arrayBuffer();
        const model = await parseModel(buffer, fileName);
        if (cancelled) return;

        if (state.root) {
          state.scene.remove(state.root);
        }
        state.scene.add(model.object);
        state.root = model.object;

        frameObject(model.object, state.camera, state.controls.target);
        state.controls.update();

        if (model.animations.length) {
          const mixer = new THREE.AnimationMixer(model.object);
          mixer.clipAction(model.animations[0]).play();
          state.mixer = mixer;
        } else {
          state.mixer = undefined;
        }

        const box = new THREE.Box3().setFromObject(model.object);
        const size = box.getSize(new THREE.Vector3());
        const span = Math.max(size.x, size.z, 1);
        state.grid.scale.setScalar(span / 10);
        state.grid.position.y = box.min.y;

        setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError((err as Error).message);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, fileName]);

  useEffect(() => {
    const root = sceneRef.current?.root;
    if (!root) return;
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      list.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (m && 'wireframe' in m) m.wireframe = wireframe;
      });
    });
  }, [wireframe, status]);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    state.controls.autoRotate = autoRotate;
    state.controls.autoRotateSpeed = 1.6;
  }, [autoRotate, status]);

  useEffect(() => {
    const state = sceneRef.current;
    if (state) state.grid.visible = showGrid;
  }, [showGrid, status]);

  const resetView = () => {
    const state = sceneRef.current;
    if (state?.root) {
      frameObject(state.root, state.camera, state.controls.target);
      state.controls.update();
    }
  };

  return (
    <div className={styles.viewer}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {status === 'loading' && (
        <div className={styles.overlay}>
          <div style={{ fontSize: 30 }}>🧊</div>
          <div>Loading model…</div>
        </div>
      )}

      {status === 'error' && (
        <div className={styles.overlay}>
          <div style={{ fontSize: 30 }}>⚠️</div>
          <div className={styles.error}>{error}</div>
        </div>
      )}

      {status === 'ready' && <div className={styles.hint}>Drag to orbit · Scroll to zoom · Right-drag to pan</div>}

      <div className={styles.toolbar}>
        <button
          className={`${styles.toolButton} ${autoRotate ? styles.toolActive : ''}`}
          onClick={() => setAutoRotate((v) => !v)}
        >
          ⟳ Rotate
        </button>
        <button
          className={`${styles.toolButton} ${wireframe ? styles.toolActive : ''}`}
          onClick={() => setWireframe((v) => !v)}
        >
          ▦ Wireframe
        </button>
        <button
          className={`${styles.toolButton} ${showGrid ? styles.toolActive : ''}`}
          onClick={() => setShowGrid((v) => !v)}
        >
          ⊞ Grid
        </button>
        <div className={styles.spacer} />
        <button className={styles.toolButton} onClick={resetView}>⤢ Reset view</button>
      </div>
    </div>
  );
}

/**
 * Centralina 3D (modelo /models/ecu.glb) desenhada com three.js num <canvas>.
 * Carregado à parte (import dinâmico) pelo EcuScanLoader, para não pesar no
 * bundle principal. Só browser.
 *
 * Ciclo de 6 s, igual ao loader CSS:
 *   0–45%  linha vermelha percorre o contorno todo da caixa
 *   45–52% pausa · 52–62% a linha apaga-se
 *   52–100% a centralina dá 360° (arranca devagar, acelera, trava devagar)
 */
import {
  AmbientLight,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
  AdditiveBlending,
  ACESFilmicToneMapping,
  Box3,
  type Texture,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export const ECU_MODEL_URL = "/models/ecu.glb";
const CYCLE = 6000;
const SCAN = new Color("#ff2a1f");

type EcuModel = { geo: BufferGeometry; map: Texture | null };
const cache = new Map<string, Promise<EcuModel>>();

/** Descarrega e prepara o modelo uma única vez (partilhado entre loaders). */
export function loadEcuGeometry(url = ECU_MODEL_URL) {
  let p = cache.get(url);
  if (!p) {
    p = new GLTFLoader()
      .setMeshoptDecoder(MeshoptDecoder)
      .loadAsync(url)
      .then((gltf): EcuModel => {
        let geo: BufferGeometry | null = null;
        let map: Texture | null = null;
        gltf.scene.updateMatrixWorld(true);
        gltf.scene.traverse((o) => {
          if (!geo && (o as Mesh).isMesh) {
            const m = o as Mesh;
            geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
            map = (m.material as MeshStandardMaterial).map ?? null;
          }
        });
        if (!geo) throw new Error("ecu.glb sem malha");
        // geometria e normais tal como o Higgsfield as gerou (só comprimidas)
        const g = geo as BufferGeometry;
        // normaliza: centrada na origem, maior dimensão = 2
        g.computeBoundingBox();
        const box = g.boundingBox as Box3;
        const c = box.getCenter(new Vector3());
        const s = box.getSize(new Vector3());
        g.translate(-c.x, -c.y, -c.z);
        g.scale(
          2 / Math.max(s.x, s.y, s.z),
          2 / Math.max(s.x, s.y, s.z),
          2 / Math.max(s.x, s.y, s.z),
        );
        g.computeBoundingBox();
        return { geo: g, map };
      });
    cache.set(url, p);
  }
  return p;
}

/** Contorno da caixa visto de cima (envolvente convexa em XZ), um pouco para fora. */
function outline(geo: BufferGeometry, y: number) {
  const pos = geo.getAttribute("position");
  const pts: [number, number][] = [];
  for (let i = 0; i < pos.count; i += 3) pts.push([pos.getX(i), pos.getZ(i)]);
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0)
      upper.pop();
    upper.push(p);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  // reamostra para pontos espaçados por igual (a linha avança a velocidade constante)
  const out: Vector3[] = [];
  const per = hull.map((p, i) => {
    const q = hull[(i + 1) % hull.length]!;
    return Math.hypot(q[0] - p[0], q[1] - p[1]);
  });
  const total = per.reduce((a, b) => a + b, 0);
  const step = total / 160;
  hull.forEach((p, i) => {
    const q = hull[(i + 1) % hull.length]!;
    const n = Math.max(1, Math.round(per[i]! / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      out.push(
        new Vector3((p[0] + (q[0] - p[0]) * t) * 1.025, y, (p[1] + (q[1] - p[1]) * t) * 1.025),
      );
    }
  });
  return out;
}

const easeInOutQuint = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export async function mountEcuModel(
  canvas: HTMLCanvasElement,
  opts: {
    reducedMotion: boolean;
    /** só para pré-visualização: congela neste instante (ms) */
    fixedTime?: number;
    url?: string;
    /** só para gerar a imagem estática (poster): mantém o último fotograma legível */
    capture?: boolean;
  },
) {
  const { geo, map } = await loadEcuGeometry(opts.url);
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
    preserveDrawingBuffer: !!opts.capture,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.4;
  scene.environment = env;
  scene.add(new AmbientLight(0xffffff, 0.08));
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(-3, 2.5, 3);
  scene.add(key);

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 1.7, 4.3);
  camera.lookAt(0, -0.05, 0);

  // alumínio fundido: cinzento, metálico, pouco brilhante — sem cor
  // com textura (cores da fotografia) usa-a; sem textura, alumínio cinzento
  const metal = map
    ? new MeshStandardMaterial({ map, metalness: 0.25, roughness: 0.6 })
    : new MeshStandardMaterial({ color: 0xa9adb2, metalness: 0.45, roughness: 0.5 });
  const body = new Mesh(geo, metal);

  const box = geo.boundingBox as Box3;
  const path = new CatmullRomCurve3(
    outline(geo, box.min.y + (box.max.y - box.min.y) * 0.35),
    true,
    "catmullrom",
    0.1,
  );
  const tubeCore = new TubeGeometry(path, 320, 0.012, 6, true);
  const tubeGlow = new TubeGeometry(path, 320, 0.035, 6, true);
  const core = new Mesh(tubeCore, new MeshBasicMaterial({ color: SCAN, transparent: true }));
  const glow = new Mesh(
    tubeGlow,
    new MeshBasicMaterial({
      color: SCAN,
      transparent: true,
      opacity: 0.35,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  const coreCount = tubeCore.index!.count;
  const glowCount = tubeGlow.index!.count;

  const group = new Group();
  group.add(body, core, glow);
  group.rotation.y = -0.6; // vista a 3/4, como na fotografia
  scene.add(group);

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const cycle = opts.reducedMotion ? CYCLE * 1.5 : CYCLE;
  const t0 = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const p = ((opts.fixedTime ?? now - t0) % cycle) / cycle;
    const draw = clamp01(p / 0.45);
    const fade = 1 - clamp01((p - 0.52) / 0.1);
    // indices do tubo vêm por ordem ao longo do caminho: desenhar só o início
    tubeCore.setDrawRange(0, Math.floor((coreCount * draw) / 6) * 6);
    tubeGlow.setDrawRange(0, Math.floor((glowCount * draw) / 6) * 6);
    (core.material as MeshBasicMaterial).opacity = fade;
    (glow.material as MeshBasicMaterial).opacity = 0.35 * fade;
    if (!opts.reducedMotion) {
      group.rotation.y = -0.6 + (p < 0.52 ? 0 : easeInOutQuint((p - 0.52) / 0.48) * Math.PI * 2);
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    tubeCore.dispose();
    tubeGlow.dispose();
    metal.dispose();
    (core.material as MeshBasicMaterial).dispose();
    (glow.material as MeshBasicMaterial).dispose();
    env.dispose();
    pmrem.dispose();
    renderer.dispose();
  };
}

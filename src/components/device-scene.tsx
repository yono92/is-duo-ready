'use client';

import {
  memo,
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type RefObject,
  type ReactNode,
} from 'react';
import { DeviceScreenMaterial } from './device-screen-material';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei/core/Environment';
import { Lightformer } from '@react-three/drei/core/Lightformer';
import { RoundedBox } from '@react-three/drei/core/RoundedBox';
import { useTexture } from '@react-three/drei/core/Texture';
import {
  ExtrudeGeometry,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  MathUtils,
  BackSide,
  Vector3,
  type Group,
  type IUniform,
} from 'three';

export type DeviceSceneProps = {
  pitch: number;
  yaw: number;
  angle: number;
  leftHandle: RefObject<HTMLDivElement | null>;
  rightHandle: RefObject<HTMLDivElement | null>;
  onReady: () => void;
  onUnavailable: () => void;
};

const width = 1.62;
const height = 2.58;

// Different radii on the outside and hinge edge keep the display continuous.
function outline(w: number, h: number, leftRadius: number, rightRadius = leftRadius) {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + leftRadius, y);
  s.lineTo(x + w - rightRadius, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rightRadius);
  s.lineTo(x + w, y + h - rightRadius);
  s.quadraticCurveTo(x + w, y + h, x + w - rightRadius, y + h);
  s.lineTo(x + leftRadius, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - leftRadius);
  s.lineTo(x, y + leftRadius);
  s.quadraticCurveTo(x, y, x + leftRadius, y);
  return s;
}

function displayGeometry(
  w: number,
  h: number,
  left: number,
  right: number,
  half?: 'left' | 'right',
) {
  const geometry = new ShapeGeometry(outline(w, h, left, right), 32);
  const positions = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    const u = (positions.getX(i) + w / 2) / w;
    uv.setXY(i, half ? u / 2 + (half === 'right' ? 0.5 : 0) : u, (positions.getY(i) + h / 2) / h);
  }
  return geometry;
}

function CameraLens({ x }: { x: number }) {
  return (
    <group position={[x, 0.91, 0.075]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.151, 0.155, 0.048, 64]} />
        <meshStandardMaterial color="#929593" metalness={1} roughness={0.19} />
      </mesh>
      <mesh position={[0, 0, 0.026]}>
        <circleGeometry args={[0.13, 64]} />
        <meshPhysicalMaterial color="#04070a" metalness={0.25} roughness={0.08} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0, 0.029]}>
        <torusGeometry args={[0.085, 0.009, 12, 64]} />
        <meshStandardMaterial color="#1f2a37" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <circleGeometry args={[0.061, 48]} />
        <meshPhysicalMaterial
          color="#101e32"
          metalness={0.55}
          roughness={0.1}
          clearcoat={1}
          iridescence={0.45}
        />
      </mesh>
    </group>
  );
}

const Panel = memo(function Panel({
  side,
  blur,
}: {
  side: 'left' | 'right';
  blur: RefObject<IUniform<number>>;
}) {
  const texture = useTexture('/device/duo-wallpaper.webp', (loaded) => {
    loaded.colorSpace = SRGBColorSpace;
    loaded.anisotropy = 8;
  });
  const left = side === 'left';
  const geometry = useMemo(() => {
    const outer = left ? 0.19 : 0.035;
    const inner = left ? 0.035 : 0.19;
    const shell = new ExtrudeGeometry(outline(width - 0.035, height - 0.035, outer, inner), {
      depth: 0.075,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 5,
      steps: 1,
      curveSegments: 32,
    });
    shell.translate(0, 0, -0.09);
    return {
      shell,
      bezel: new ShapeGeometry(outline(width - 0.055, height - 0.055, outer, inner), 32),
      screen: displayGeometry(
        width - 0.083,
        height - 0.105,
        left ? 0.15 : 0.012,
        left ? 0.012 : 0.15,
        side,
      ),
      back: new ShapeGeometry(outline(width - 0.055, height - 0.055, inner, outer), 32),
      cover: displayGeometry(width - 0.12, height - 0.13, 0.145, 0.145),
    };
  }, [left, side]);
  useEffect(() => () => Object.values(geometry).forEach((item) => item.dispose()), [geometry]);

  return (
    <group position={[left ? -width / 2 : width / 2, 0, 0]}>
      <mesh geometry={geometry.shell}>
        <meshStandardMaterial
          color="#bfc1bf"
          metalness={1}
          roughness={0.22}
          envMapIntensity={1.3}
        />
      </mesh>
      <mesh geometry={geometry.bezel} position={[0, 0, 0.006]}>
        <meshPhysicalMaterial color="#080a0c" roughness={0.23} metalness={0.15} clearcoat={1} />
      </mesh>
      <group position={[left ? 0.016 : -0.016, 0, 0.009]}>
        <mesh geometry={geometry.screen}>
          <DeviceScreenMaterial texture={texture} blur={blur} />
        </mesh>
        <mesh geometry={geometry.screen} position={[0, 0, 0.001]}>
          <meshPhysicalMaterial
            color="#dce7f0"
            transparent
            opacity={0.055}
            metalness={0.2}
            roughness={0.12}
            clearcoat={1}
            clearcoatRoughness={0.08}
            depthWrite={false}
          />
        </mesh>
      </group>
      <group position={[0, 0, -0.11]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={geometry.back}>
          <meshPhysicalMaterial
            color="#deded8"
            metalness={0.65}
            roughness={0.31}
            clearcoat={0.35}
          />
        </mesh>
        {left ? (
          <>
            <RoundedBox
              args={[1.37, 0.47, 0.065]}
              radius={0.11}
              smoothness={5}
              position={[0, 0.91, 0.026]}
            >
              <meshStandardMaterial color="#c7c9c6" metalness={0.85} roughness={0.25} />
            </RoundedBox>
            <CameraLens x={-0.4} />
            <CameraLens x={-0.02} />
            <mesh position={[0.43, 0.96, 0.063]}>
              <circleGeometry args={[0.055, 32]} />
              <meshPhysicalMaterial color="#f3eee0" roughness={0.35} />
            </mesh>
            <mesh position={[0.43, 0.81, 0.064]}>
              <circleGeometry args={[0.023, 24]} />
              <meshStandardMaterial color="#242725" roughness={0.5} />
            </mesh>
          </>
        ) : (
          <>
            <mesh geometry={geometry.bezel} position={[0, 0, 0.003]}>
              <meshStandardMaterial color="#090b0d" roughness={0.18} />
            </mesh>
            <mesh geometry={geometry.cover} position={[0, 0, 0.006]}>
              <DeviceScreenMaterial texture={texture} blur={blur} />
            </mesh>
            <mesh position={[0, 1.08, 0.009]}>
              <circleGeometry args={[0.027, 32]} />
              <meshPhysicalMaterial color="#080b10" clearcoat={1} roughness={0.15} />
            </mesh>
          </>
        )}
      </group>
      {/* Physical details stay attached to the appropriate folding half. */}
      <RoundedBox
        args={[0.025, 0.31, 0.045]}
        radius={0.009}
        smoothness={3}
        position={[left ? -width / 2 - 0.006 : width / 2 + 0.006, 0.39, -0.05]}
      >
        <meshStandardMaterial color="#b9bcb9" metalness={1} roughness={0.2} />
      </RoundedBox>
      {[-0.47, -0.4, -0.33, 0.33, 0.4, 0.47].map((x) => (
        <mesh key={x} position={[x, -height / 2 - 0.001, -0.052]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.012, 12]} />
          <meshBasicMaterial color="#242726" />
        </mesh>
      ))}
      <RoundedBox
        args={[0.18, 0.006, 0.038]}
        radius={0.002}
        position={[0, -height / 2 - 0.002, -0.052]}
      >
        <meshStandardMaterial color="#161a1b" roughness={0.4} />
      </RoundedBox>
    </group>
  );
});

function Model({ pitch, yaw, angle, onReady, leftHandle, rightHandle }: DeviceSceneProps) {
  const root = useRef<Group>(null);
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const ready = useRef(false);
  const blur = useRef({ value: 0 });
  const reducedMotion = useRef(false);
  const invalidate = useThree((state) => state.invalidate);
  const points = useRef({
    left: new Vector3(),
    right: new Vector3(),
    origin: new Vector3(),
    axis: new Vector3(),
  });
  useEffect(() => {
    invalidate();
  }, [pitch, yaw, angle, invalidate]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedMotion.current = media.matches;
      invalidate();
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [invalidate]);
  useFrame(({ camera, size }, delta) => {
    if (!root.current || !left.current || !right.current) return;
    const targetPitch = MathUtils.degToRad(pitch);
    const targetYaw = MathUtils.degToRad(yaw);
    const fold = MathUtils.degToRad((180 - angle) / 2);
    const factor =
      reducedMotion.current || !ready.current ? 1 : 1 - Math.exp(-18 * Math.min(delta, 0.05));
    const yawDelta = Math.atan2(
      Math.sin(targetYaw - root.current.rotation.y),
      Math.cos(targetYaw - root.current.rotation.y),
    );
    root.current.rotation.x = MathUtils.lerp(root.current.rotation.x, targetPitch, factor);
    root.current.rotation.y += yawDelta * factor;
    const previousFold = left.current.rotation.y;
    const dt = Math.min(Math.max(delta, 0.001), 0.05);
    const foldFactor = reducedMotion.current || !ready.current ? 1 : 1 - Math.exp(-12 * dt);
    left.current.rotation.y = MathUtils.lerp(previousFold, fold, foldFactor);
    if (reducedMotion.current || !ready.current) {
      blur.current.value = 0;
    } else {
      const speed = Math.abs(left.current.rotation.y - previousFold) / dt;
      const targetBlur = Math.min(speed / 3, 1) * 28;
      blur.current.value = MathUtils.damp(blur.current.value, targetBlur, 14, dt);
      if (targetBlur < 0.01 && blur.current.value < 0.03) blur.current.value = 0;
    }
    right.current.rotation.y = -left.current.rotation.y;
    // Keep a closed device centered as the hinge moves toward the viewer.
    root.current.position.z = (-Math.sin(left.current.rotation.y) * width) / 2;
    // Place the hit areas on the rendered edges, including damping and camera rotation.
    root.current.updateWorldMatrix(true, true);
    const p = points.current;
    p.left.set(-width, 0, 0).applyMatrix4(left.current.matrixWorld).project(camera);
    p.right.set(width, 0, 0).applyMatrix4(right.current.matrixWorld).project(camera);
    const lx = ((p.left.x + 1) * size.width) / 2;
    const ly = ((1 - p.left.y) * size.height) / 2;
    const rx = ((p.right.x + 1) * size.width) / 2;
    const ry = ((1 - p.right.y) * size.height) / 2;
    const span = Math.hypot(rx - lx, ry - ly);
    let dx = rx - lx;
    let dy = ry - ly;
    if (span < 20) {
      // At full closure the two outer edges coincide. Keep both grips reachable,
      // oriented with the model's horizontal axis even when viewed from behind.
      p.origin.set(0, 0, 0).applyMatrix4(root.current.matrixWorld).project(camera);
      p.axis.set(1, 0, 0).applyMatrix4(root.current.matrixWorld).project(camera);
      dx = (p.axis.x - p.origin.x) * size.width;
      dy = (p.origin.y - p.axis.y) * size.height;
    }
    const length = Math.hypot(dx, dy);
    dx = length > 0.001 ? dx / length : 1;
    dy = length > 0.001 ? dy / length : 0;
    const offset = Math.max(0, (48 - span) / 2);
    for (const [element, x, y, direction] of [
      [leftHandle.current, lx - dx * offset, ly - dy * offset, -1],
      [rightHandle.current, rx + dx * offset, ry + dy * offset, 1],
    ] as const) {
      if (!element) continue;
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.dataset['dragX'] = String(dx * direction);
      element.dataset['dragY'] = String(dy * direction);
    }
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
    if (
      Math.abs(targetPitch - root.current.rotation.x) +
        Math.abs(yawDelta) +
        Math.abs(fold - left.current.rotation.y) >
        0.0001 ||
      blur.current.value > 0
    )
      invalidate();
  });
  return (
    <group ref={root}>
      <group ref={left} position={[-0.006, 0, 0]}>
        <Panel side="left" blur={blur} />
      </group>
      <group ref={right} position={[0.006, 0, 0]}>
        <Panel side="right" blur={blur} />
      </group>
      <mesh position={[0, 0, -0.052]}>
        <cylinderGeometry args={[0.043, 0.043, height - 0.15, 32]} />
        <meshStandardMaterial color="#9b9e9c" metalness={1} roughness={0.23} />
      </mesh>
    </group>
  );
}

class RenderBoundary extends Component<
  { children: ReactNode; onUnavailable: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onUnavailable();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const StudioEnvironment = memo(function StudioEnvironment() {
  return (
    <Environment resolution={256} frames={1}>
      <mesh scale={50}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color="#8b9198" side={BackSide} />
      </mesh>
      <Lightformer intensity={3} position={[-4, 3, 4]} scale={[3, 6, 1]} target={[0, 0, 0]} />
      <Lightformer intensity={4} position={[4, 1, 3]} scale={[0.8, 5, 1]} target={[0, 0, 0]} />
      <Lightformer intensity={2} position={[0, 5, -2]} scale={[6, 2, 1]} target={[0, 0, 0]} />
      <Lightformer intensity={1.5} position={[-3, -2, -4]} scale={[5, 4, 1]} target={[0, 0, 0]} />
    </Environment>
  );
});

export default function DeviceScene(props: DeviceSceneProps) {
  return (
    <RenderBoundary onUnavailable={props.onUnavailable}>
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6.1], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.addEventListener('webglcontextlost', props.onUnavailable, { once: true });
        }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 5, 5]} intensity={2.5} />
        <Suspense fallback={null}>
          <StudioEnvironment />
          <Model {...props} />
        </Suspense>
      </Canvas>
    </RenderBoundary>
  );
}

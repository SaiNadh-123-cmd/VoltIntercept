import { Float, PointMaterial, Points } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useMission } from "../context/MissionContext";

function useMouseTarget() {
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      target.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return target;
}

function ParticleField() {
  const { alertMode } = useMission();
  const ref = useRef<THREE.Points>(null);
  const count = 2200;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 22;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const speed = alertMode ? 0.32 : 0.045;
    ref.current.rotation.y += delta * speed;
    ref.current.rotation.x += delta * (alertMode ? 0.09 : 0.012);
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={alertMode ? "#ff3355" : "#67e8f9"}
        size={alertMode ? 0.048 : 0.03}
        sizeAttenuation
        depthWrite={false}
        opacity={0.88}
      />
    </Points>
  );
}

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInQuad = (x: number) => x * x;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const showcaseX = (s: number): number => {
  if (s < 0 || s >= 5) return -30;
  if (s < 1) return THREE.MathUtils.lerp(-15, 0, easeOutCubic(s));
  if (s < 4) return 0;
  return THREE.MathUtils.lerp(0, 15, easeInQuad(s - 4));
};

const gold = { color: "#d4af37", metalness: 1, roughness: 0.3 };
const darkMetal = { color: "#2b3442", metalness: 0.8, roughness: 0.35 };

const CHIP_GRID: Array<[number, number]> = [
  [-0.45, -0.22],
  [0, -0.22],
  [0.45, -0.22],
  [-0.45, 0.22],
  [0, 0.22],
  [0.45, 0.22],
];

const GPIO_PINS = [-0.3, -0.18, -0.06, 0.06, 0.18, 0.3];

const EJ_STRIKE = new THREE.Vector3(-2, 0, 2);
const BATTERY_CENTER = new THREE.Vector3(0, 0.2, 2.6);

function Processor({ isEjecting }: { isEjecting: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(-30, -1, 3), []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    if (!isEjecting) {
      const local = t % 15;
      if (local >= 0 && local < 5) {
        target.set(showcaseX(local), -1, 3);
        if (local >= 1 && local < 4) {
          ref.current.rotation.y += delta * ((Math.PI * 2) / 3);
        }
      } else {
        target.set(-30, -1, 3);
      }
    } else {
      target.set(-30, -1, 3);
    }
    ref.current.position.lerp(target, 1 - Math.exp(-delta * 6));
  });

  return (
    <group ref={ref} position={[-30, -1, 3]} scale={[1.5, 1.5, 1.5]}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1.1}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 0.1, 1.0]} />
          <meshStandardMaterial
            color="#232a35"
            metalness={0.7}
            roughness={0.4}
          />
        </mesh>
        {CHIP_GRID.map(([x, z]) => (
          <mesh key={`${x}-${z}`} position={[x, 0.065, z]}>
            <boxGeometry args={[0.22, 0.03, 0.22]} />
            <meshStandardMaterial {...gold} />
          </mesh>
        ))}
        <mesh position={[0.45, 0.07, 0.28]}>
          <boxGeometry args={[0.3, 0.04, 0.18]} />
          <meshStandardMaterial
            color="#0b1220"
            emissive="#22d3ee"
            emissiveIntensity={1.4}
            metalness={0.6}
            roughness={0.35}
          />
        </mesh>
        {GPIO_PINS.map((x) => (
          <mesh key={x} position={[x, 0.06, -0.44]}>
            <boxGeometry args={[0.05, 0.025, 0.08]} />
            <meshStandardMaterial {...gold} />
          </mesh>
        ))}
      </Float>
    </group>
  );
}

function ThermalSensor({ isEjecting }: { isEjecting: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(-30, 1.5, 3), []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    if (!isEjecting) {
      const local = (t % 15) - 5;
      if (local >= 0 && local < 5) {
        target.set(showcaseX(local), 1.5, 3);
        if (local >= 1 && local < 4) {
          ref.current.rotation.y += delta * ((Math.PI * 2) / 3);
        }
      } else {
        target.set(-30, 1.5, 3);
      }
    } else {
      target.set(-30, 1.5, 3);
    }
    ref.current.position.lerp(target, 1 - Math.exp(-delta * 6));
  });

  return (
    <group ref={ref} position={[-30, 1.5, 3]} scale={[1.5, 1.5, 1.5]}>
      <Float speed={1.7} rotationIntensity={0.45} floatIntensity={1}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.48, 0.7, 24]} />
          <meshStandardMaterial
            color="#9aa5b1"
            metalness={0.95}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0, 0, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 24]} />
          <meshStandardMaterial
            color="#0a0f16"
            emissive="#ef4444"
            emissiveIntensity={1.3}
            metalness={0.9}
            roughness={0.12}
          />
        </mesh>
        <mesh position={[0, -0.55, -0.1]}>
          <boxGeometry args={[0.16, 0.4, 0.16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
      </Float>
    </group>
  );
}

function Ejector({ isEjecting }: { isEjecting: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const startTime = useRef(0);
  const wasEjecting = useRef(false);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    if (isEjecting && !wasEjecting.current) startTime.current = t;
    wasEjecting.current = isEjecting;

    let scaleTarget = 1.5;
    if (!isEjecting) {
      const local = (t % 15) - 10;
      if (local >= 0 && local < 5) {
        target.set(showcaseX(local), 0, 3);
        if (local >= 1 && local < 4) {
          ref.current.rotation.y += delta * ((Math.PI * 2) / 3);
        }
      } else {
        target.set(-30, 0, 3);
      }
    } else {
      const e = t - startTime.current;
      if (e < 0.4) {
        const k = easeOutCubic(clamp01(e / 0.4));
        target.lerpVectors(ref.current.position, EJ_STRIKE, k);
        scaleTarget = 1.5 * (1 + 2 * k);
      } else {
        const k = easeInQuad(clamp01((e - 0.4) / 1.0));
        target.set(EJ_STRIKE.x + k * 8.5, EJ_STRIKE.y, EJ_STRIKE.z);
        scaleTarget = 4.5;
      }
      ref.current.rotation.y = THREE.MathUtils.lerp(
        ref.current.rotation.y,
        0,
        1 - Math.exp(-delta * 6),
      );
    }

    const k = 1 - Math.exp(-delta * (isEjecting ? 8 : 4));
    ref.current.position.lerp(target, k);
    ref.current.scale.setScalar(
      THREE.MathUtils.lerp(ref.current.scale.x, scaleTarget, k),
    );
  });

  return (
    <group ref={ref} position={[-30, 0, 3]} scale={[1.5, 1.5, 1.5]}>
      <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.7}>
        <mesh castShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.9, 0.18, 0.9]} />
          <meshStandardMaterial
            color="#232c3a"
            metalness={0.75}
            roughness={0.4}
          />
        </mesh>
        <mesh castShadow position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.5, 20]} />
          <meshStandardMaterial
            color="#9aa5b1"
            metalness={0.95}
            roughness={0.22}
          />
        </mesh>
        <mesh castShadow position={[0.35, 0.62, 0]}>
          <boxGeometry args={[0.7, 0.12, 0.12]} />
          <meshStandardMaterial
            color="#9aa5b1"
            metalness={0.9}
            roughness={0.25}
          />
        </mesh>
        <mesh castShadow position={[0.72, 0.62, 0]}>
          <boxGeometry args={[0.1, 0.5, 0.5]} />
          <meshStandardMaterial
            color="#475569"
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[-0.3, 0.16, 0.3]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={1.6}
          />
        </mesh>
      </Float>
    </group>
  );
}

function BatteryTarget({ isEjecting }: { isEjecting: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const startTime = useRef(0);
  const wasEjecting = useRef(false);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    if (isEjecting && !wasEjecting.current) startTime.current = t;
    wasEjecting.current = isEjecting;

    let scaleTarget = 0;
    if (isEjecting) {
      const e = t - startTime.current;
      if (e < 0.35) {
        scaleTarget = 3.5 * clamp01(e / 0.35);
        ref.current.position.set(
          BATTERY_CENTER.x,
          BATTERY_CENTER.y,
          BATTERY_CENTER.z,
        );
      } else if (e < 0.5) {
        scaleTarget = 3.5;
      } else if (e < 1.4) {
        const k = clamp01((e - 0.5) / 0.9);
        ref.current.position.set(
          BATTERY_CENTER.x + k * k * 7.5,
          BATTERY_CENTER.y + Math.sin(k * Math.PI) * 0.5,
          BATTERY_CENTER.z,
        );
        scaleTarget = 3.5;
      } else {
        ref.current.position.set(
          BATTERY_CENTER.x + 7.5,
          BATTERY_CENTER.y,
          BATTERY_CENTER.z,
        );
        scaleTarget = 3.5;
      }
    } else {
      ref.current.position.copy(BATTERY_CENTER);
    }

    const ks = 1 - Math.exp(-delta * (scaleTarget < ref.current.scale.x ? 14 : 8));
    ref.current.scale.setScalar(
      THREE.MathUtils.lerp(ref.current.scale.x, scaleTarget, ks),
    );
    if (spin.current) {
      const flying = isEjecting && t - startTime.current >= 0.5;
      spin.current.rotation.z += delta * (flying ? 16 : 1.5);
      spin.current.rotation.x += delta * 1.2;
    }
    if (mat.current) {
      mat.current.emissiveIntensity = 1.6 + Math.sin(t * 6) * 0.7;
    }
  });

  return (
    <group ref={ref} position={[0, 0.2, 2.6]} scale={0}>
      <group ref={spin}>
        <mesh castShadow>
          <boxGeometry args={[0.62, 0.34, 0.4]} />
          <meshStandardMaterial
            ref={mat}
            color="#3f1d1d"
            emissive="#ef4444"
            emissiveIntensity={1.6}
            metalness={0.4}
            roughness={0.45}
          />
        </mesh>
        <mesh position={[0.17, 0.2, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.07, 12]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={1}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0, 0, 0.205]}>
          <boxGeometry args={[0.42, 0.08, 0.012]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={0.9}
          />
        </mesh>
      </group>
    </group>
  );
}

function EjectorRimLight({ isEjecting }: { isEjecting: boolean }) {
  const light = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (!light.current) return;
    const target = isEjecting ? 70 : 0;
    light.current.intensity = THREE.MathUtils.lerp(
      light.current.intensity,
      target,
      1 - Math.exp(-delta * 4),
    );
  });

  return (
    <pointLight
      ref={light}
      position={[0, 1.2, 3.5]}
      color="#ef4444"
      intensity={0}
      distance={14}
      decay={1.8}
    />
  );
}

function ParallaxRig({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const mouse = useMouseTarget();

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, mouse.current.x * 0.28, 0.045);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -mouse.current.y * 0.14, 0.045);
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, mouse.current.x * 0.35, 0.04);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, mouse.current.y * 0.2, 0.04);
  });

  return <group ref={group}>{children}</group>;
}

export function Scene() {
  const { isEjecting } = useMission();

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0.4, 7.2], fov: 48 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 8, 18]} />
        <ambientLight intensity={0.35} />
        <pointLight position={[4, 3, 4]} intensity={18} color="#22d3ee" />
        <pointLight position={[-4, -2, 2]} intensity={10} color="#10b981" />
        <pointLight position={[2, 1, 3]} intensity={8} color="#ef4444" />
        <pointLight position={[0, 0, 5]} intensity={8} color="#ffffff" />
        <EjectorRimLight isEjecting={isEjecting} />
        <ParallaxRig>
          <ParticleField />
          <Processor isEjecting={isEjecting} />
          <ThermalSensor isEjecting={isEjecting} />
          <Ejector isEjecting={isEjecting} />
          <BatteryTarget isEjecting={isEjecting} />
        </ParallaxRig>
      </Canvas>
    </div>
  );
}

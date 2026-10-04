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
const easeInOut = (x: number) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

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

function Processor() {
  return (
    <group position={[-3.4, 0.5, -1.5]} rotation={[0, 0.5, 0]}>
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

function ThermalSensor() {
  return (
    <group position={[3.4, 0.3, -1.5]} rotation={[0, -0.45, 0]}>
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

const EJECTOR_IDLE = new THREE.Vector3(0, -1.15, -2.3);
const EJECTOR_ACTIVE = new THREE.Vector3(0, -0.75, -0.6);
const BATTERY_SPAWN = new THREE.Vector3(1.15, 0.62, 0);

function EjectorRig({ isEjecting }: { isEjecting: boolean }) {
  const rig = useRef<THREE.Group>(null);
  const battery = useRef<THREE.Group>(null);
  const batterySpin = useRef<THREE.Group>(null);
  const batteryMat = useRef<THREE.MeshStandardMaterial>(null);
  const startTime = useRef(0);
  const wasEjecting = useRef(false);
  const target = useMemo(() => new THREE.Vector3(), []);
  const batteryTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (isEjecting && !wasEjecting.current) startTime.current = t;
    wasEjecting.current = isEjecting;
    const e = isEjecting ? t - startTime.current : -1;

    target.copy(EJECTOR_IDLE);
    let scaleTarget = 1;
    let tiltTarget = 0;
    if (e >= 0) {
      const k0 = easeOutCubic(clamp01(e / 0.4));
      target.lerpVectors(EJECTOR_IDLE, EJECTOR_ACTIVE, k0);
      scaleTarget = 1 + 2 * k0;
      if (e >= 0.4) {
        const k1 = easeInOut(clamp01((e - 0.4) / 0.6));
        target.x = EJECTOR_ACTIVE.x + k1 * 1.1;
        tiltTarget = -0.12 * Math.sin(k1 * Math.PI);
      }
    }

    batteryTarget.copy(BATTERY_SPAWN);
    let batteryScale = 0;
    if (e >= 0) {
      if (e < 0.35) {
        batteryScale = clamp01(e / 0.35);
      } else if (e < 0.5) {
        batteryScale = 1;
      } else if (e < 1.4) {
        const k3 = clamp01((e - 0.5) / 0.9);
        batteryTarget.x = BATTERY_SPAWN.x + k3 * k3 * 4.4;
        batteryTarget.y = BATTERY_SPAWN.y + Math.sin(k3 * Math.PI) * 0.4;
        batteryScale = 1;
      } else {
        batteryTarget.x = BATTERY_SPAWN.x + 4.4;
        batteryTarget.y = BATTERY_SPAWN.y;
        batteryScale = 1;
      }
    }

    const kr = 1 - Math.exp(-delta * 6);
    const kb = 1 - Math.exp(-delta * 10);
    const shrinking =
      batteryScale < (battery.current?.scale.x ?? 0) ? 14 : 8;
    const ks = 1 - Math.exp(-delta * shrinking);
    if (rig.current) {
      rig.current.position.lerp(target, kr);
      rig.current.scale.setScalar(
        THREE.MathUtils.lerp(rig.current.scale.x, scaleTarget, kr),
      );
      rig.current.rotation.z = THREE.MathUtils.lerp(
        rig.current.rotation.z,
        tiltTarget,
        kr,
      );
    }
    if (battery.current) {
      battery.current.position.lerp(batteryTarget, kb);
      battery.current.scale.setScalar(
        THREE.MathUtils.lerp(battery.current.scale.x, batteryScale, ks),
      );
    }
    if (batterySpin.current) {
      const flying = e >= 0.5 && e < 1.7;
      batterySpin.current.rotation.z += delta * (flying ? 16 : 1.5);
      batterySpin.current.rotation.x += delta * 1.2;
    }
    if (batteryMat.current) {
      batteryMat.current.emissiveIntensity = 1.6 + Math.sin(t * 6) * 0.7;
    }
  });

  return (
    <group ref={rig} position={[0, -1.15, -2.3]}>
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
      <group ref={battery} position={[1.15, 0.62, 0]} scale={0}>
        <group ref={batterySpin}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.28, 0.32]} />
            <meshStandardMaterial
              ref={batteryMat}
              color="#3f1d1d"
              emissive="#ef4444"
              emissiveIntensity={1.6}
              metalness={0.4}
              roughness={0.45}
            />
          </mesh>
          <mesh position={[0.14, 0.17, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.06, 12]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={1}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, 0, 0.165]}>
            <boxGeometry args={[0.34, 0.07, 0.012]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#f59e0b"
              emissiveIntensity={0.9}
            />
          </mesh>
        </group>
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
      position={[0, 1.2, 1.6]}
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
        <EjectorRimLight isEjecting={isEjecting} />
        <ParallaxRig>
          <ParticleField />
          <Processor />
          <ThermalSensor />
          <EjectorRig isEjecting={isEjecting} />
        </ParallaxRig>
      </Canvas>
    </div>
  );
}

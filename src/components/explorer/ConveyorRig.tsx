import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useMission } from "../../context/MissionContext";
import type { ComponentId } from "./constants";

type InteractiveProps = {
  id: ComponentId;
  hovered: ComponentId | null;
  onHover: (id: ComponentId | null) => void;
  onSelect: (id: ComponentId) => void;
  children: ReactNode;
};

type ComponentProps = {
  active: boolean;
  onHover: (id: ComponentId | null) => void;
  onSelect: (id: ComponentId) => void;
};

function InteractiveGroup({ id, hovered, onHover, onSelect, children }: InteractiveProps) {
  const ref = useRef<THREE.Group>(null);
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const isActive = hovered === id;

  useFrame((_, delta) => {
    if (!ref.current) return;
    const target = isActive ? 1.05 : 1;
    const k = 1 - Math.exp(-delta * 10);
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, target, k));
  });

  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
      }}
      onPointerDown={(e) => {
        downPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
      }}
      onPointerUp={(e) => {
        if (!downPos.current) return;
        const dx = e.nativeEvent.clientX - downPos.current.x;
        const dy = e.nativeEvent.clientY - downPos.current.y;
        if (Math.hypot(dx, dy) < 6) onSelect(id);
        downPos.current = null;
      }}
    >
      {children}
    </group>
  );
}

function useGlow(ref: React.RefObject<THREE.MeshStandardMaterial | null>, active: boolean, base: number, boost: number) {
  useFrame((_, delta) => {
    const mat = ref.current;
    if (!mat) return;
    const target = active ? boost : base;
    const k = 1 - Math.exp(-delta * 10);
    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, target, k);
  });
}

const darkMetal = { color: "#2b3442", metalness: 0.8, roughness: 0.35 };
const nearBlack = { color: "#10161f", metalness: 0.7, roughness: 0.35 };

function ConveyorBelt() {
  return (
    <group>
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 0.28, 1.5]} />
        <meshStandardMaterial color="#232a35" metalness={0.75} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.29, 0]} receiveShadow>
        <boxGeometry args={[6.36, 0.02, 1.46]} />
        <meshStandardMaterial color="#0f141c" metalness={0.6} roughness={0.6} />
      </mesh>
      {[-0.78, 0.78].map((z) => (
        <mesh key={z} position={[0, 0.315, z]}>
          <boxGeometry args={[6.4, 0.05, 0.05]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.2} />
        </mesh>
      ))}
      {[-2.7, -1.35, 0, 1.35, 2.7].map((x) => (
        <mesh key={x} position={[x, -0.04, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 1.5, 20]} />
          <meshStandardMaterial color="#39424f" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {[[-2.9, -0.62], [-2.9, 0.62], [2.9, -0.62], [2.9, 0.62]].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, -0.26, z]} castShadow>
          <boxGeometry args={[0.14, 0.52, 0.14]} />
          <meshStandardMaterial color="#1a212c" metalness={0.7} roughness={0.5} />
        </mesh>
      ))}
      {[-3.2, 3.2].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.1, 24]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.35} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Arch() {
  return (
    <group>
      {[-1.02, 1.02].map((z) => (
        <mesh key={z} position={[0, 1.6, z]} castShadow>
          <boxGeometry args={[0.16, 3.2, 0.16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
      ))}
      <mesh position={[0, 3.15, 0]} castShadow>
        <boxGeometry args={[0.22, 0.22, 2.3]} />
        <meshStandardMaterial {...darkMetal} />
      </mesh>
      <mesh position={[0, 3.15, 0]}>
        <boxGeometry args={[0.24, 0.05, 2.3]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.9} />
      </mesh>
      {[-0.7, 0.7].map((z) => (
        <mesh key={z} position={[0, 2.35, z]}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2.2} />
        </mesh>
      ))}
    </group>
  );
}

function SensorMount({ children, position }: { children: ReactNode; position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.1, 0.32, 0.1]} />
        <meshStandardMaterial color="#1c232e" metalness={0.8} roughness={0.4} />
      </mesh>
      {children}
    </group>
  );
}

function RGBCamera({ active, onHover, onSelect }: ComponentProps) {
  const lensRef = useRef<THREE.MeshStandardMaterial>(null);
  useGlow(lensRef, active, 1.8, 4.5);

  return (
    <InteractiveGroup id="camera" hovered={active ? "camera" : null} onHover={onHover} onSelect={onSelect}>
      <SensorMount position={[-0.62, 2.78, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.56, 0.36, 0.56]} />
          <meshStandardMaterial {...nearBlack} />
        </mesh>
        <mesh position={[0, -0.24, 0]}>
          <cylinderGeometry args={[0.17, 0.19, 0.14, 24]} />
          <meshStandardMaterial color="#0a0e14" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.02, 24]} />
          <meshStandardMaterial ref={lensRef} color="#0ea5e9" emissive="#38bdf8" emissiveIntensity={1.8} roughness={0.2} metalness={0.4} />
        </mesh>
        <mesh position={[0.2, 0.12, 0.29]}>
          <boxGeometry args={[0.05, 0.05, 0.02]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2.5} />
        </mesh>
      </SensorMount>
    </InteractiveGroup>
  );
}

function ThermalArray({ active, onHover, onSelect }: ComponentProps) {
  const lensRef = useRef<THREE.MeshStandardMaterial>(null);
  useGlow(lensRef, active, 1.6, 4.5);
  const dots = useMemo(() => [-0.06, -0.02, 0.02, 0.06], []);

  return (
    <InteractiveGroup id="thermal" hovered={active ? "thermal" : null} onHover={onHover} onSelect={onSelect}>
      <SensorMount position={[0.62, 2.78, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.56, 0.36, 0.56]} />
          <meshStandardMaterial color="#1a1215" metalness={0.65} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.24, 0]}>
          <cylinderGeometry args={[0.16, 0.18, 0.12, 24]} />
          <meshStandardMaterial color="#14090b" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.31, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 24]} />
          <meshStandardMaterial ref={lensRef} color="#7f1d1d" emissive="#ef4444" emissiveIntensity={1.6} roughness={0.25} metalness={0.3} />
        </mesh>
        {dots.map((x) =>
          dots.map((z) => (
            <mesh key={`${x}-${z}`} position={[x, -0.325, z]}>
              <boxGeometry args={[0.018, 0.006, 0.018]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.2} />
            </mesh>
          )),
        )}
      </SensorMount>
    </InteractiveGroup>
  );
}

function EdgeAIHub({ active, onHover, onSelect }: ComponentProps) {
  const boardRef = useRef<THREE.MeshStandardMaterial>(null);
  const ledRefs = [useRef<THREE.MeshStandardMaterial>(null), useRef<THREE.MeshStandardMaterial>(null), useRef<THREE.MeshStandardMaterial>(null)];
  useGlow(boardRef, active, 0.18, 1.1);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ledRefs.forEach((ref, i) => {
      if (ref.current) {
        ref.current.emissiveIntensity = Math.sin(t * 2.8 + i * 1.9) > 0.15 ? 2.8 : 0.12;
      }
    });
  });

  const pins = useMemo(() => [-0.32, -0.22, -0.12, -0.02, 0.08, 0.18, 0.28, 0.38], []);

  return (
    <InteractiveGroup id="aihub" hovered={active ? "aihub" : null} onHover={onHover} onSelect={onSelect}>
      <group position={[-1.8, 0, 1.3]}>
        <mesh position={[0, -0.47, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.28, 0.06, 24]} />
          <meshStandardMaterial color="#1c232e" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.015, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 1.03, 16]} />
          <meshStandardMaterial color="#39424f" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.525, 0]}>
          <boxGeometry args={[0.99, 0.02, 0.69]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0.56, 0]} castShadow>
          <boxGeometry args={[0.95, 0.07, 0.65]} />
          <meshStandardMaterial ref={boardRef} color="#14532d" emissive="#10b981" emissiveIntensity={0.18} metalness={0.35} roughness={0.5} />
        </mesh>
        <mesh position={[-0.22, 0.61, 0.05]} castShadow>
          <boxGeometry args={[0.24, 0.03, 0.24]} />
          <meshStandardMaterial color="#0b1220" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[-0.22, 0.628, 0.05]}>
          <boxGeometry args={[0.1, 0.006, 0.03]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.6} />
        </mesh>
        {pins.map((x) => (
          <mesh key={x} position={[x, 0.605, -0.27]}>
            <boxGeometry args={[0.05, 0.03, 0.05]} />
            <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.3} />
          </mesh>
        ))}
        {[[0.22, 0.22], [0.34, 0.22], [0.46, 0.22]].map(([x, z], i) => (
          <mesh key={`${x}-${z}`} position={[x, 0.6, z]}>
            <boxGeometry args={[0.06, 0.02, 0.06]} />
            <meshStandardMaterial ref={ledRefs[i]} color="#10b981" emissive="#10b981" emissiveIntensity={2.8} />
          </mesh>
        ))}
      </group>
    </InteractiveGroup>
  );
}

function KickerArm({ active, onHover, onSelect }: ComponentProps) {
  const stripeRef = useRef<THREE.MeshStandardMaterial>(null);
  const beaconRef = useRef<THREE.MeshStandardMaterial>(null);
  useGlow(stripeRef, active, 0.8, 2.6);
  useGlow(beaconRef, active, 1.4, 3.6);

  return (
    <InteractiveGroup id="kicker" hovered={active ? "kicker" : null} onHover={onHover} onSelect={onSelect}>
      <group position={[2.2, 0, -1.55]}>
        <mesh position={[0, -0.44, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.38, 0.12, 24]} />
          <meshStandardMaterial color="#1c232e" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh position={[0, -0.23, 0]} castShadow>
          <boxGeometry args={[0.5, 0.3, 0.5]} />
          <meshStandardMaterial color="#232c3a" metalness={0.75} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.1, 20]} />
          <meshStandardMaterial ref={beaconRef} color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.65, 20]} />
          <meshStandardMaterial color="#9aa5b1" metalness={0.95} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.72, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.35, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.18} />
        </mesh>
        <mesh position={[0, 0.82, 0]}>
          <sphereGeometry args={[0.11, 20, 20]} />
          <meshStandardMaterial color="#39424f" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.82, 0.375]} castShadow>
          <boxGeometry args={[0.14, 0.14, 0.8]} />
          <meshStandardMaterial color="#9aa5b1" metalness={0.95} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.82, 0.78]} castShadow>
          <boxGeometry args={[0.34, 0.4, 0.08]} />
          <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
        </mesh>
        {[-0.09, 0, 0.09].map((x) => (
          <mesh key={x} position={[x, 0.82, 0.825]}>
            <boxGeometry args={[0.045, 0.3, 0.012]} />
            <meshStandardMaterial ref={x === 0 ? stripeRef : undefined} color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} />
          </mesh>
        ))}
      </group>
    </InteractiveGroup>
  );
}

function HazardBattery() {
  const group = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.4);
    if (group.current) {
      group.current.position.x = 0.35 + Math.sin(t * 0.22) * 1.9;
    }
    if (bodyRef.current) {
      bodyRef.current.emissiveIntensity = 1.0 + pulse * 1.6;
    }
    if (glowRef.current) {
      glowRef.current.intensity = 1.5 + pulse * 5;
    }
  });

  return (
    <group ref={group} position={[0.35, 0.42, 0.1]}>
      <mesh castShadow>
        <boxGeometry args={[0.42, 0.24, 0.28]} />
        <meshStandardMaterial ref={bodyRef} color="#3f1d1d" emissive="#ef4444" emissiveIntensity={1.4} metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh position={[0.12, 0.15, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.06, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.145]}>
        <boxGeometry args={[0.3, 0.06, 0.012]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.9} />
      </mesh>
      <pointLight ref={glowRef} position={[0, 0.2, 0]} color="#ef4444" intensity={3} distance={2.6} decay={2} />
    </group>
  );
}

function DataCable() {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.8, 0.62, 1.28),
        new THREE.Vector3(-2.05, 1.7, 1.2),
        new THREE.Vector3(-1.5, 2.85, 0.65),
        new THREE.Vector3(-0.4, 3.14, 0.18),
      ]),
    [],
  );

  return (
    <mesh>
      <tubeGeometry args={[curve, 24, 0.028, 8, false]} />
      <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.6} />
    </mesh>
  );
}

export function ConveyorRig({ onSelect }: { onSelect: (id: ComponentId) => void }) {
  const [hovered, setHovered] = useState<ComponentId | null>(null);
  const { setCursorPointer } = useMission();

  useEffect(() => () => setCursorPointer(false), [setCursorPointer]);

  const handleHover = useCallback(
    (id: ComponentId | null) => {
      setHovered(id);
      setCursorPointer(id !== null);
    },
    [setCursorPointer],
  );

  return (
    <group>
      <ConveyorBelt />
      <Arch />
      <RGBCamera active={hovered === "camera"} onHover={handleHover} onSelect={onSelect} />
      <ThermalArray active={hovered === "thermal"} onHover={handleHover} onSelect={onSelect} />
      <EdgeAIHub active={hovered === "aihub"} onHover={handleHover} onSelect={onSelect} />
      <KickerArm active={hovered === "kicker"} onHover={handleHover} onSelect={onSelect} />
      <HazardBattery />
      <DataCable />
    </group>
  );
}

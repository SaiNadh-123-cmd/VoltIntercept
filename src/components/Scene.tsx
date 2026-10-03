import { PointMaterial, Points } from "@react-three/drei";
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

const holo = (color: string, opacity = 0.35) => ({
  color,
  emissive: color,
  emissiveIntensity: 2.4,
  wireframe: true,
  transparent: true,
  opacity,
  roughness: 0.15,
  metalness: 0.8,
});

function ConveyorRig() {
  const spin = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!spin.current) return;
    spin.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.08;
  });

  return (
    <group ref={spin} position={[2.35, -0.85, 0.2]} rotation={[0.22, -0.62, 0.05]} scale={1.28}>
      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[4.6, 0.08, 1.35]} />
        <meshStandardMaterial {...holo("#22d3ee", 0.55)} />
      </mesh>
      <mesh position={[0, -0.22, 0.62]}>
        <boxGeometry args={[4.6, 0.18, 0.06]} />
        <meshStandardMaterial {...holo("#67e8f9")} />
      </mesh>
      <mesh position={[0, -0.22, -0.62]}>
        <boxGeometry args={[4.6, 0.18, 0.06]} />
        <meshStandardMaterial {...holo("#67e8f9")} />
      </mesh>

      {[-1.8, -0.6, 0.6, 1.8].map((x) => (
        <mesh key={x} position={[x, -0.46, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 1.2, 18]} />
          <meshStandardMaterial {...holo("#22d3ee", 0.4)} />
        </mesh>
      ))}

      <mesh position={[-1.15, 0.55, -0.05]}>
        <boxGeometry args={[0.85, 0.7, 0.7]} />
        <meshStandardMaterial {...holo("#10b981", 0.5)} />
      </mesh>
      <mesh position={[-1.15, 1.05, -0.05]}>
        <cylinderGeometry args={[0.18, 0.22, 0.28, 24]} />
        <meshStandardMaterial {...holo("#f8fafc", 0.7)} />
      </mesh>
      <mesh position={[-1.15, 1.28, -0.05]}>
        <cylinderGeometry args={[0.1, 0.1, 0.22, 20]} />
        <meshStandardMaterial {...holo("#22d3ee", 0.85)} />
      </mesh>

      <mesh position={[1.55, 0.05, 0.72]} rotation={[Math.PI / 2.4, 0, 0.2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.85, 16]} />
        <meshStandardMaterial {...holo("#ef4444", 0.75)} />
      </mesh>
      <mesh position={[1.7, 0.42, 1.05]}>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial {...holo("#ef4444", 0.6)} />
      </mesh>

      <mesh position={[0.15, -0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.55, 18]} />
        <meshStandardMaterial {...holo("#f59e0b", 0.7)} />
      </mesh>
    </group>
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
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0.4, 7.2], fov: 48 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 8, 18]} />
        <ambientLight intensity={0.35} />
        <pointLight position={[4, 3, 4]} intensity={18} color="#22d3ee" />
        <pointLight position={[-4, -2, 2]} intensity={10} color="#10b981" />
        <pointLight position={[2, 1, 3]} intensity={8} color="#ef4444" />
        <ParallaxRig>
          <ParticleField />
          <ConveyorRig />
        </ParallaxRig>
      </Canvas>
    </div>
  );
}

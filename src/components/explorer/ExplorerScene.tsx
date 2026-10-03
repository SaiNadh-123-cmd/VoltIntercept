import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { ComponentId } from "./constants";
import { ConveyorRig } from "./ConveyorRig";

type ExplorerSceneProps = {
  onSelect: (id: ComponentId) => void;
};

export function ExplorerScene({ onSelect }: ExplorerSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [5.4, 3.4, 6.4], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 12, 26]} />

      <ambientLight intensity={0.5} />
      <spotLight
        position={[0, 8, 1]}
        angle={0.5}
        penumbra={0.7}
        intensity={180}
        color="#f8fafc"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[5, 2.5, 3]} intensity={30} color="#22d3ee" />
      <pointLight position={[-5, 1.5, -2]} intensity={22} color="#ef4444" />
      <pointLight position={[0, 4, -5]} intensity={14} color="#10b981" />

      <Suspense fallback={null}>
        <ConveyorRig onSelect={onSelect} />
        <Grid
          position={[0, -0.5, 0]}
          args={[14, 14]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#123047"
          sectionSize={2}
          sectionThickness={1.1}
          sectionColor="#1e6f8f"
          fadeDistance={16}
          fadeStrength={1.4}
          infiniteGrid
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <shadowMaterial opacity={0.4} />
        </mesh>
      </Suspense>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={3.2}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2 - 0.04}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
}

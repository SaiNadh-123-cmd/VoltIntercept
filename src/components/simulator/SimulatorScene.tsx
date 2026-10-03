import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { BatteryProfile } from "./batteries";
import { BatteryModel, Platform } from "./BatteryModel";
import { Explosion } from "./Explosion";

export type SimulatorPhase = "idle" | "crushing" | "exploded";

type SimulatorSceneProps = {
  battery: BatteryProfile | null;
  phase: SimulatorPhase;
  explosionTrigger: number;
  explodedScale: number;
  onExplosionComplete: () => void;
};

export function SimulatorScene({
  battery,
  phase,
  explosionTrigger,
  explodedScale,
  onExplosionComplete,
}: SimulatorSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [4.6, 3, 5.6], fov: 45 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#070309"]} />
      <fog attach="fog" args={["#070309", 11, 26]} />

      <ambientLight intensity={0.5} />
      <spotLight
        position={[0, 8, 1]}
        angle={0.5}
        penumbra={0.7}
        intensity={170}
        color="#f8fafc"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[4, 2, 3]} intensity={20} color="#ff6b35" />
      <pointLight position={[-4, 1.5, -2]} intensity={16} color="#ef4444" />

      <Suspense fallback={null}>
        <Platform />
        {battery && <BatteryModel battery={battery} phase={phase === "crushing" ? "crushing" : "idle"} />}
        {phase === "exploded" && (
          <Explosion key={explosionTrigger} scale={explodedScale} onComplete={onExplosionComplete} />
        )}
        <Grid
          position={[0, -0.5, 0]}
          args={[14, 14]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#2a1420"
          sectionSize={2}
          sectionThickness={1.1}
          sectionColor="#7a2e2e"
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
        minDistance={2.5}
        maxDistance={14}
        maxPolarAngle={Math.PI / 2 - 0.04}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
}

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { BatteryProfile, BatteryShape } from "./batteries";

type ShapeConfig = {
  kind: "cylinder" | "box";
  args: [number, number, number];
  detail: "terminals" | "cells";
};

const SHAPE_CONFIG: Record<BatteryShape, ShapeConfig> = {
  coin: { kind: "cylinder", args: [0.55, 0.55, 0.16], detail: "terminals" },
  vape: { kind: "box", args: [0.72, 0.24, 0.46], detail: "terminals" },
  cell: { kind: "cylinder", args: [0.26, 0.26, 1.15], detail: "terminals" },
  phone: { kind: "box", args: [1.7, 0.2, 0.9], detail: "terminals" },
  drone: { kind: "box", args: [1.35, 0.32, 0.75], detail: "terminals" },
  tablet: { kind: "box", args: [2.0, 0.16, 1.35], detail: "terminals" },
  tool: { kind: "box", args: [1.5, 0.95, 0.95], detail: "cells" },
  ebike: { kind: "box", args: [2.3, 0.85, 1.25], detail: "cells" },
  station: { kind: "box", args: [2.7, 1.9, 1.9], detail: "cells" },
  ev: { kind: "box", args: [3.5, 1.5, 2.3], detail: "cells" },
};

const CELL_GRID: Record<BatteryShape, [number, number]> = {
  coin: [1, 1],
  vape: [1, 1],
  cell: [1, 1],
  phone: [1, 1],
  drone: [2, 1],
  tablet: [2, 1],
  tool: [2, 2],
  ebike: [3, 2],
  station: [4, 3],
  ev: [5, 3],
};

function HazardStripe({
  kind,
  args,
}: {
  kind: "cylinder" | "box";
  args: [number, number, number];
}) {
  if (kind === "cylinder") {
    return (
      <mesh>
        <cylinderGeometry args={[args[0] + 0.012, args[0] + 0.012, args[2] * 0.16, 32]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.7} />
      </mesh>
    );
  }
  return (
    <mesh>
      <boxGeometry args={[args[0] + 0.015, args[1] * 0.22, args[2] + 0.015]} />
      <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.7} />
    </mesh>
  );
}

function Terminals({ kind, args }: { kind: "cylinder" | "box"; args: [number, number, number] }) {
  if (kind === "cylinder") {
    return (
      <mesh position={[0, args[2] / 2 + 0.03, 0]}>
        <cylinderGeometry args={[args[0] * 0.32, args[0] * 0.32, 0.06, 20]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.3} />
      </mesh>
    );
  }
  return (
    <>
      <mesh position={[args[0] / 2 - 0.12, args[1] / 2 + 0.025, args[2] / 4]}>
        <boxGeometry args={[0.16, 0.05, 0.16]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[args[0] / 2 - 0.12, args[1] / 2 + 0.025, -args[2] / 4]}>
        <boxGeometry args={[0.16, 0.05, 0.16]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.3} />
      </mesh>
    </>
  );
}

function CellModules({ kind, args, grid }: { kind: "cylinder" | "box"; args: [number, number, number]; grid: [number, number] }) {
  if (kind !== "box") return null;
  const [cols, rows] = grid;
  const cellW = (args[0] * 0.86) / cols;
  const cellD = (args[2] * 0.82) / rows;
  const items: React.ReactNode[] = [];
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const x = -args[0] * 0.43 + cellW * (c + 0.5);
      const z = -args[2] * 0.41 + cellD * (r + 0.5);
      items.push(
        <mesh key={`${c}-${r}`} position={[x, args[1] / 2 + 0.012, z]}>
          <boxGeometry args={[cellW * 0.82, 0.025, cellD * 0.82]} />
          <meshStandardMaterial color="#10161f" metalness={0.7} roughness={0.4} />
        </mesh>,
      );
    }
  }
  return <>{items}</>;
}

type BatteryModelProps = {
  battery: BatteryProfile;
  phase: "idle" | "crushing";
};

export function BatteryModel({ battery, phase }: BatteryModelProps) {
  const group = useRef<THREE.Group>(null);
  const baseY = 1.25;
  const config = SHAPE_CONFIG[battery.shape];
  const grid = CELL_GRID[battery.shape];

  useFrame((state, delta) => {
    if (!group.current) return;
    const k = 1 - Math.exp(-delta * 8);
    if (phase === "crushing") {
      const t = state.clock.elapsedTime;
      group.current.position.x = (Math.random() - 0.5) * 0.24;
      group.current.position.y = baseY + (Math.random() - 0.5) * 0.24;
      group.current.rotation.x = (Math.random() - 0.5) * 0.55;
      group.current.rotation.z = (Math.random() - 0.5) * 0.55;
      const squash = 1 - Math.abs(Math.sin(t * 38)) * 0.18;
      group.current.scale.set(1 + (1 - squash) * 0.7, squash, 1 + (1 - squash) * 0.7);
    } else {
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 0, k);
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, baseY, k);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, k);
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, k);
      group.current.rotation.y += delta * 0.45;
      const s = THREE.MathUtils.lerp(group.current.scale.x, 1, k);
      group.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={group} position={[0, baseY, 0]}>
      {config.kind === "cylinder" ? (
        <mesh castShadow>
          <cylinderGeometry args={[config.args[0], config.args[1], config.args[2], 36]} />
          <meshStandardMaterial color={battery.color} metalness={0.85} roughness={0.3} />
        </mesh>
      ) : (
        <mesh castShadow>
          <boxGeometry args={config.args} />
          <meshStandardMaterial color={battery.color} metalness={0.7} roughness={0.4} />
        </mesh>
      )}
      <HazardStripe kind={config.kind} args={config.args} />
      <Terminals kind={config.kind} args={config.args} />
      <CellModules kind={config.kind} args={config.args} grid={grid} />
      <mesh position={[0, -config.args[1] / 2 - 0.02, 0]}>
        <boxGeometry args={[config.args[0] * 0.4, 0.03, config.args[2] * 0.4]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

export function Platform() {
  return (
    <group>
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[2.3, 2.5, 0.12, 48]} />
        <meshStandardMaterial color="#0d1420" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.05, 0.025, 8, 72]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.55, 0.012, 8, 64]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

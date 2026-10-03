import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type ExplosionProps = {
  scale: number;
  onComplete: () => void;
};

const FIRE_COLORS = ["#ffd166", "#ff8c42", "#ff5e3a", "#ef4444", "#ffb347"];
const SMOKE_COLORS = ["#6b7280", "#9ca3af", "#4b5563", "#78716c"];

function useParticleSystem(count: number, scale: number, palette: string[], opts: { rise: boolean; spread: number }) {
  const system = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const colors = palette.map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i += 1) {
      const dir = new THREE.Vector3().randomDirection();
      const speed = (0.9 + Math.random() * 2.4) * (0.55 + scale * 0.32) * opts.spread;
      vel[i * 3] = dir.x * speed;
      vel[i * 3 + 1] = opts.rise ? Math.abs(dir.y) * speed * 0.9 + 0.4 : dir.y * speed;
      vel[i * 3 + 2] = dir.z * speed;
      const c = colors[Math.floor(Math.random() * colors.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { geo, vel };
  }, [count, scale, palette, opts.rise, opts.spread]);

  useEffect(() => () => system.geo.dispose(), [system]);

  return system;
}

export function Explosion({ scale, onComplete }: ExplosionProps) {
  const total = Math.round(100 * Math.pow(scale, 2.7));
  const fireCount = Math.max(24, Math.round(total * 0.75));
  const smokeCount = Math.max(12, Math.round(total * 0.25));

  const fire = useParticleSystem(fireCount, scale, FIRE_COLORS, { rise: true, spread: 1 });
  const smoke = useParticleSystem(smokeCount, scale, SMOKE_COLORS, { rise: true, spread: 0.55 });

  const fireMat = useRef<THREE.PointsMaterial>(null);
  const smokeMat = useRef<THREE.PointsMaterial>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);

  const elapsed = useRef(0);
  const lifetime = 3.2 + scale * 0.3;
  const flashBase = 120 + scale * 55;
  const fireSize = 0.05 + scale * 0.028;
  const smokeSize = 0.3 + scale * 0.11;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useFrame((_, delta) => {
    elapsed.current += delta;
    const e = elapsed.current;
    const drag = Math.max(0, 1 - 1.6 * delta);

    const fireAttr = fire.geo.attributes.position;
    const fireArr = fireAttr.array as Float32Array;
    for (let i = 0; i < fireCount; i += 1) {
      const vi = i * 3;
      fire.vel[vi] *= drag;
      fire.vel[vi + 1] = fire.vel[vi + 1] * drag - 3.4 * delta;
      fire.vel[vi + 2] *= drag;
      fireArr[vi] += fire.vel[vi] * delta;
      fireArr[vi + 1] = Math.max(-0.45, fireArr[vi + 1] + fire.vel[vi + 1] * delta);
      fireArr[vi + 2] += fire.vel[vi + 2] * delta;
    }
    fireAttr.needsUpdate = true;

    const smokeAttr = smoke.geo.attributes.position;
    const smokeArr = smokeAttr.array as Float32Array;
    const smokeDrag = Math.max(0, 1 - 0.9 * delta);
    for (let i = 0; i < smokeCount; i += 1) {
      const vi = i * 3;
      smoke.vel[vi] *= smokeDrag;
      smoke.vel[vi + 1] = smoke.vel[vi + 1] * smokeDrag + 0.9 * delta;
      smoke.vel[vi + 2] *= smokeDrag;
      smokeArr[vi] += smoke.vel[vi] * delta;
      smokeArr[vi + 1] += smoke.vel[vi + 1] * delta;
      smokeArr[vi + 2] += smoke.vel[vi + 2] * delta;
    }
    smokeAttr.needsUpdate = true;

    const fade = Math.max(0, 1 - e / lifetime);
    if (fireMat.current) fireMat.current.opacity = fade;
    if (smokeMat.current) smokeMat.current.opacity = fade * 0.5;
    if (flashRef.current) {
      flashRef.current.intensity = flashBase * Math.max(0, 1 - e / (lifetime * 0.22));
    }
    if (ringRef.current && ringMat.current) {
      ringRef.current.scale.setScalar(1 + e * (3.2 + scale * 0.9));
      ringMat.current.opacity = 0.7 * Math.max(0, 1 - e / (lifetime * 0.45));
    }

    if (e >= lifetime) onCompleteRef.current();
  });

  return (
    <group>
      <points geometry={fire.geo}>
        <pointsMaterial
          ref={fireMat}
          size={fireSize}
          vertexColors
          transparent
          opacity={1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <points geometry={smoke.geo}>
        <pointsMaterial
          ref={smokeMat}
          size={smokeSize}
          vertexColors
          transparent
          opacity={0.5}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      <pointLight ref={flashRef} position={[0, 0.6, 0]} color="#ff7733" intensity={flashBase} distance={24} decay={1.6} />
      <mesh ref={ringRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1, 64]} />
        <meshBasicMaterial ref={ringMat} color="#ff6b35" transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

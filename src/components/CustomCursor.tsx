import { motion, useSpring } from "framer-motion";
import { useEffect } from "react";
import { useMission } from "../context/MissionContext";

export function CustomCursor() {
  const { cursorPointer } = useMission();
  const x = useSpring(0, { stiffness: 500, damping: 32, mass: 0.4 });
  const y = useSpring(0, { stiffness: 500, damping: 32, mass: 0.4 });
  const trailX = useSpring(0, { stiffness: 140, damping: 22, mass: 0.6 });
  const trailY = useSpring(0, { stiffness: 140, damping: 22, mass: 0.6 });

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      trailX.set(event.clientX);
      trailY.set(event.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [trailX, trailY, x, y]);

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-[80] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/40"
        animate={{
          width: cursorPointer ? 44 : 40,
          height: cursorPointer ? 44 : 40,
          borderColor: cursorPointer ? "rgba(16,185,129,0.85)" : "rgba(103,232,249,0.4)",
        }}
        style={{ left: trailX, top: trailY }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-[81] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300"
        animate={{
          width: cursorPointer ? 8 : 10,
          height: cursorPointer ? 8 : 10,
          backgroundColor: cursorPointer ? "#34d399" : "#67e8f9",
        }}
        style={{
          left: x,
          top: y,
          boxShadow: cursorPointer
            ? "0 0 18px #34d399, 0 0 36px rgba(16,185,129,0.7)"
            : "0 0 18px #22d3ee, 0 0 36px rgba(34,211,238,0.7)",
        }}
      />
    </>
  );
}

import { motion, useSpring } from "framer-motion";
import { useEffect } from "react";
import { useMission } from "../context/MissionContext";

export function MouseGlow() {
  const { alertMode } = useMission();
  const x = useSpring(0, { stiffness: 80, damping: 20 });
  const y = useSpring(0, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-[1] h-[42vw] w-[42vw] max-h-[560px] max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        left: x,
        top: y,
        background: alertMode
          ? "radial-gradient(circle, rgba(239,68,68,0.22) 0%, rgba(239,68,68,0.05) 38%, transparent 68%)"
          : "radial-gradient(circle, rgba(34,211,238,0.16) 0%, rgba(16,185,129,0.06) 42%, transparent 70%)",
      }}
    />
  );
}

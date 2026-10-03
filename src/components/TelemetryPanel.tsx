import { useMotionValueEvent, useSpring } from "framer-motion";
import { motion } from "framer-motion";
import { Flame, IndianRupee, Recycle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useMission } from "../context/MissionContext";

function CountValue({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  locale = false,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  locale?: boolean;
}) {
  const spring = useSpring(0, { stiffness: 45, damping: 18, mass: 0.7 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplay(latest);
  });

  const body = locale
    ? Math.round(display).toLocaleString("en-IN")
    : decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toString();

  return (
    <span>
      {prefix}
      {body}
      {suffix}
    </span>
  );
}

function Metric({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
      <div className="flex items-center gap-2 text-emerald-300">{icon}</div>
      <p className="mt-3 font-mono text-[10px] tracking-[0.28em] text-emerald-200/70">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-wide text-white">{children}</p>
    </div>
  );
}

export function TelemetryPanel() {
  const { telemetry } = useMission();

  return (
    <motion.section
      className="glass-panel relative flex min-h-[420px] flex-col overflow-hidden rounded-3xl p-5 shadow-[0_0_34px_rgba(16,185,129,0.4)]"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.14),transparent_62%)]" />
      <div className="relative">
        <p className="font-mono text-[10px] tracking-[0.4em] text-emerald-300/80">NODE 03</p>
        <h2 className="mt-1 text-lg font-semibold tracking-widest text-white">LIVE IMPACT TELEMETRY</h2>
        <div className="mt-6 grid gap-4">
          <Metric icon={<Flame className="h-4 w-4" />} label="FIRES AVERTED">
            <CountValue value={telemetry.fires} />
          </Metric>
          <Metric icon={<IndianRupee className="h-4 w-4" />} label="DAMAGE PREVENTED">
            <CountValue value={telemetry.damage} prefix="₹" locale />
          </Metric>
          <Metric icon={<Recycle className="h-4 w-4" />} label="WASTE DIVERTED">
            <CountValue value={telemetry.waste} decimals={1} suffix=" kg" />
          </Metric>
        </div>
      </div>
    </motion.section>
  );
}

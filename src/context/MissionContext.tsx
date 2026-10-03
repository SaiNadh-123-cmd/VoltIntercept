import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { BatteryProfile } from "../components/simulator/batteries";

export type Phase = "boot" | "waiting" | "hud";
export type VisionMode = "idle" | "camera" | "upload";

export type Telemetry = {
  fires: number;
  damage: number;
  waste: number;
};

export type Interception = {
  name: string;
  capacity: string;
  financialDamage: string;
  confidence: number;
};

type MissionContextValue = {
  phase: Phase;
  setPhase: (phase: Phase) => void;
  alertMode: boolean;
  setAlertMode: (value: boolean) => void;
  shake: boolean;
  triggerShake: () => void;
  visionMode: VisionMode;
  setVisionMode: (mode: VisionMode) => void;
  mediaReady: boolean;
  setMediaReady: (value: boolean) => void;
  telemetry: Telemetry;
  eject: () => void;
  ejectFlash: boolean;
  lastInterception: Interception | null;
  recordInterception: (profile: BatteryProfile, confidence: number) => void;
  explorerOpen: boolean;
  setExplorerOpen: (value: boolean) => void;
  simulatorOpen: boolean;
  setSimulatorOpen: (value: boolean) => void;
  cursorPointer: boolean;
  setCursorPointer: (value: boolean) => void;
};

const MissionContext = createContext<MissionContextValue | null>(null);

export function MissionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [alertMode, setAlertMode] = useState(false);
  const [shake, setShake] = useState(false);
  const [visionMode, setVisionMode] = useState<VisionMode>("idle");
  const [mediaReady, setMediaReady] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    fires: 0,
    damage: 0,
    waste: 0,
  });
  const [ejectFlash, setEjectFlash] = useState(false);
  const [lastInterception, setLastInterception] = useState<Interception | null>(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [cursorPointer, setCursorPointer] = useState(false);

  const value = useMemo<MissionContextValue>(
    () => ({
      phase,
      setPhase,
      alertMode,
      setAlertMode,
      shake,
      triggerShake: () => {
        setShake(true);
        window.setTimeout(() => setShake(false), 560);
      },
      visionMode,
      setVisionMode,
      mediaReady,
      setMediaReady,
      telemetry,
      explorerOpen,
      setExplorerOpen,
      simulatorOpen,
      setSimulatorOpen,
      cursorPointer,
      setCursorPointer,
      ejectFlash,
      eject: () => {
        setTelemetry((prev) => ({
          fires: prev.fires + 1,
          damage: prev.damage + 250000,
          waste: Number((prev.waste + 0.4).toFixed(1)),
        }));
        setShake(true);
        window.setTimeout(() => setShake(false), 560);
        setEjectFlash(true);
        window.setTimeout(() => setEjectFlash(false), 1800);
      },
      lastInterception,
      recordInterception: (profile, confidence) => {
        setLastInterception({
          name: profile.name,
          capacity: profile.capacity,
          financialDamage: profile.financialDamage,
          confidence,
        });
        setTelemetry((prev) => ({
          fires: prev.fires + 1,
          damage: prev.damage + profile.financialDamageMah,
          waste: Number((prev.waste + 0.3).toFixed(1)),
        }));
      },
    }),
    [
      phase,
      alertMode,
      shake,
      visionMode,
      mediaReady,
      telemetry,
      explorerOpen,
      simulatorOpen,
      cursorPointer,
      ejectFlash,
      lastInterception,
    ],
  );

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission() {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error("useMission must be used within MissionProvider");
  return ctx;
}

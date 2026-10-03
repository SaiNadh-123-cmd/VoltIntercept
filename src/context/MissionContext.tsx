import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Phase = "boot" | "waiting" | "hud";
export type VisionMode = "idle" | "camera" | "upload";

export type Telemetry = {
  fires: number;
  toxins: number;
  savings: number;
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
    fires: 14,
    toxins: 4.2,
    savings: 750000,
  });
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
      eject: () => {
        setTelemetry((prev) => ({
          fires: prev.fires + 1,
          toxins: Number((prev.toxins + 0.3).toFixed(1)),
          savings: prev.savings + 25000,
        }));
        setShake(true);
        window.setTimeout(() => setShake(false), 560);
      },
    }),
    [phase, alertMode, shake, visionMode, mediaReady, telemetry, explorerOpen, simulatorOpen, cursorPointer],
  );

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission() {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error("useMission must be used within MissionProvider");
  return ctx;
}

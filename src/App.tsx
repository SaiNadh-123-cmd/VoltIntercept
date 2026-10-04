import { useMission } from "./context/MissionContext";
import { BootSequence } from "./components/BootSequence";
import { CustomCursor } from "./components/CustomCursor";
import { HardwareExplorer } from "./components/explorer/HardwareExplorer";
import { ImpactSimulator } from "./components/simulator/ImpactSimulator";
import { HUD } from "./components/HUD";
import { MouseGlow } from "./components/MouseGlow";
import { Scene } from "./components/Scene";

export default function App() {
  const { shake, alertMode } = useMission();

  return (
    <div className={`relative min-h-screen overflow-hidden bg-black ${shake ? "shake-once" : ""}`}>
      <div className="grid-noise pointer-events-none absolute inset-0 z-[1] opacity-70" />
      <Scene />
      <MouseGlow />
      <CustomCursor />
      <BootSequence />
      <HUD />
      <HardwareExplorer />
      <ImpactSimulator />
      {alertMode && (
        <div
          aria-hidden
          className="vignette-alert pointer-events-none fixed inset-0 z-30"
          style={{
            background:
              "radial-gradient(circle at center, transparent 38%, rgba(239,68,68,0.18) 72%, rgba(127,29,29,0.55) 100%)",
          }}
        />
      )}
    </div>
  );
}

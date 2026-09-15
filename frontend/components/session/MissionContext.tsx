"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  BASELINE_ROUTES,
  DEFAULTS,
  MISSIONS,
  VESSELS,
  type ForecastHorizon,
  type Mission,
  type OptimizationPreference,
  type RouteAlternative,
  type RouteId,
  type Vessel,
} from "@/lib/data";

export type SimulationStatus = "idle" | "running" | "completed";

interface MissionContextValue {
  mission: Mission;
  vessel: Vessel;
  forecastHorizon: ForecastHorizon;
  preference: OptimizationPreference;
  selectedRouteId: RouteId;
  selectedRoute: RouteAlternative;
  routes: RouteAlternative[];
  simulationStatus: SimulationStatus;
  simulationProgress: number;
  setMissionId: (id: string) => void;
  setVesselId: (id: string) => void;
  setHorizon: (h: ForecastHorizon) => void;
  setPreference: (p: OptimizationPreference) => void;
  setSelectedRouteId: (id: RouteId) => void;
  runSimulation: () => void;
}

const MissionContext = createContext<MissionContextValue | null>(null);

export function MissionProvider({ children }: { children: React.ReactNode }) {
  const [missionId, setMissionId] = useState(DEFAULTS.missionId);
  const [vesselId, setVesselId] = useState(DEFAULTS.vesselId);
  const [forecastHorizon, setHorizon] = useState<ForecastHorizon>(DEFAULTS.horizon);
  const [preference, setPreference] = useState<OptimizationPreference>(DEFAULTS.preference);
  const [selectedRouteId, setSelectedRouteId] = useState<RouteId>(DEFAULTS.routeId);
  const [simulationStatus, setStatus] = useState<SimulationStatus>("idle");
  const [simulationProgress, setProgress] = useState(0);
  const timers = useRef<NodeJS.Timeout[]>([]);

  const mission = useMemo(
    () => MISSIONS.find((m) => m.id === missionId) ?? MISSIONS[0],
    [missionId]
  );
  const vessel = useMemo(
    () => VESSELS.find((v) => v.id === vesselId) ?? VESSELS[2],
    [vesselId]
  );
  const routes = useMemo(() => BASELINE_ROUTES, []);
  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) ?? routes[3],
    [routes, selectedRouteId]
  );

  const runSimulation = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStatus("running");
    setProgress(0);
    timers.current.push(setTimeout(() => setProgress(40), 300));
    timers.current.push(setTimeout(() => setProgress(80), 700));
    timers.current.push(
      setTimeout(() => {
        setProgress(100);
        setStatus("completed");
      }, 1200)
    );
  }, []);

  const value: MissionContextValue = {
    mission,
    vessel,
    forecastHorizon,
    preference,
    selectedRouteId,
    selectedRoute,
    routes,
    simulationStatus,
    simulationProgress,
    setMissionId,
    setVesselId,
    setHorizon,
    setPreference,
    setSelectedRouteId,
    runSimulation,
  };

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission(): MissionContextValue {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error("useMission must be used within MissionProvider");
  return ctx;
}

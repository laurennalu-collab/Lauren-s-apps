import { useCallback, useEffect, useRef, useState } from 'react';
import type { FloorPlan, FurnitureItem, DrawnShape, ScaleCalibration } from '../types';

type HistoryEntry = { furniture: FurnitureItem[]; drawnShapes: DrawnShape[] };

const STORAGE_KEY = 'floorplan-app-v1';

const DEFAULT_CALIBRATION: ScaleCalibration = {
  pixelsPerInch: 0,
  isCalibrating: false,
  calibrationStart: null,
  calibrationEnd: null,
  realWorldInches: 0,
};

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function newPlan(name: string): FloorPlan {
  return {
    id: genId(),
    name,
    furniture: [],
    drawnShapes: [],
    calibration: DEFAULT_CALIBRATION,
    floorplanImageDataUrl: null,
  };
}

interface PersistedState {
  tabs: FloorPlan[];
  activeTabId: string;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: PersistedState = JSON.parse(raw);
      if (parsed.tabs?.length > 0 && parsed.activeTabId) {
        // Reset transient calibration state on reload
        parsed.tabs = parsed.tabs.map((t) => ({
          ...t,
          calibration: { ...t.calibration, isCalibrating: false, calibrationStart: null, calibrationEnd: null },
        }));
        return parsed;
      }
    }
  } catch {}
  const first = newPlan('Floor Plan 1');
  return { tabs: [first], activeTabId: first.id };
}

export function useFloorPlans() {
  const [state, setState] = useState<PersistedState>(() => loadState());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Per-tab undo history — kept in a ref so it never bloats localStorage.
  // historyTick is a counter that forces a re-render when history changes
  // so that canUndo reflects the latest state.
  const historyRef = useRef<Record<string, HistoryEntry[]>>({});
  const [historyTick, setHistoryTick] = useState(0);

  // Always-current snapshot of the active tab, used inside stable callbacks.
  const activeTabRef = useRef<FloorPlan | null>(null);
  useEffect(() => {
    const { tabs, activeTabId } = state;
    activeTabRef.current = tabs.find((t) => t.id === activeTabId) ?? tabs[0] ?? null;
  });

  // Debounced auto-save to localStorage
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Storage quota exceeded — retry without images
        try {
          const stripped: PersistedState = {
            ...state,
            tabs: state.tabs.map((t) => ({ ...t, floorplanImageDataUrl: null })),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
        } catch {}
      }
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [state]);

  const updateActiveTab = useCallback((updates: Partial<FloorPlan>) => {
    // Push a history snapshot whenever furniture or shapes change.
    if (updates.furniture !== undefined || updates.drawnShapes !== undefined) {
      const current = activeTabRef.current;
      if (current) {
        const tabId = current.id;
        const prev = historyRef.current[tabId] ?? [];
        historyRef.current[tabId] = [
          ...prev.slice(-49),
          { furniture: current.furniture, drawnShapes: current.drawnShapes },
        ];
        setHistoryTick((n) => n + 1);
      }
    }
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => (t.id === prev.activeTabId ? { ...t, ...updates } : t)),
    }));
  }, []); // stable — reads from refs only

  const undoActiveTab = useCallback(() => {
    const current = activeTabRef.current;
    if (!current) return;
    const tabId = current.id;
    const entries = historyRef.current[tabId] ?? [];
    if (entries.length === 0) return;
    const snapshot = entries[entries.length - 1];
    historyRef.current[tabId] = entries.slice(0, -1);
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => (t.id === tabId ? { ...t, ...snapshot } : t)),
    }));
    setHistoryTick((n) => n + 1);
  }, []); // stable — reads from refs only

  const addTab = useCallback(() => {
    const plan = newPlan(`Floor Plan ${state.tabs.length + 1}`);
    setState((prev) => ({ tabs: [...prev.tabs, plan], activeTabId: plan.id }));
  }, [state.tabs.length]);

  const closeTab = useCallback((id: string) => {
    delete historyRef.current[id];
    setState((prev) => {
      if (prev.tabs.length <= 1) return prev;
      const remaining = prev.tabs.filter((t) => t.id !== id);
      const nextActiveId =
        prev.activeTabId === id
          ? remaining[Math.max(0, prev.tabs.findIndex((t) => t.id === id) - 1)].id
          : prev.activeTabId;
      return { tabs: remaining, activeTabId: nextActiveId };
    });
  }, []);

  const renameTab = useCallback((id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => (t.id === id ? { ...t, name } : t)),
    }));
  }, []);

  const setActiveTabId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeTabId: id }));
  }, []);

  const exportTab = useCallback((id: string) => {
    const tab = state.tabs.find((t) => t.id === id);
    if (!tab) return;
    const blob = new Blob([JSON.stringify(tab, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tab.name.replace(/\s+/g, '-')}.floorplan.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.tabs]);

  const importTab = useCallback((json: string) => {
    try {
      const plan: FloorPlan = JSON.parse(json);
      if (!plan.id || !plan.name) throw new Error('Invalid file');
      // Give it a fresh ID to avoid collisions
      const imported = { ...plan, id: genId(), name: `${plan.name} (imported)` };
      setState((prev) => ({ tabs: [...prev.tabs, imported], activeTabId: imported.id }));
    } catch {
      alert('Could not import — invalid floor plan file.');
    }
  }, []);

  const { tabs, activeTabId } = state;
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const canUndo = (historyRef.current[activeTabId]?.length ?? 0) > 0;
  void historyTick; // consumed only to trigger re-render

  return {
    tabs,
    activeTabId,
    activeTab,
    updateActiveTab,
    undoActiveTab,
    canUndo,
    addTab,
    closeTab,
    renameTab,
    setActiveTabId,
    exportTab,
    importTab,
  };
}

"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { PlannerState } from "@twelve-cycle/domain";

type SaveStatus = "loading" | "saved" | "saving" | "error";

type PlannerContextValue = {
  state: PlannerState | null;
  saveStatus: SaveStatus;
  error: string | null;
  updateState: (update: (draft: PlannerState) => void) => void;
  reload: () => Promise<void>;
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<PlannerState | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  const reload = useCallback(async () => {
    setSaveStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!response.ok) throw new Error("Không thể tải dữ liệu planner.");
      const nextState = (await response.json()) as PlannerState;
      hydrated.current = false;
      setState(nextState);
      setSaveStatus("saved");
      queueMicrotask(() => {
        hydrated.current = true;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Đã có lỗi xảy ra.");
      setSaveStatus("error");
    }
  }, []);

  useEffect(() => {
    if (pathname === "/login" || pathname === "/setup") return;
    void reload();
  }, [pathname, reload]);

  useEffect(() => {
    if (!state || !hydrated.current) return;
    setSaveStatus("saving");
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
          signal: controller.signal,
        });
        if (response.status === 401) {
          window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        if (!response.ok) throw new Error("Không thể lưu thay đổi.");
        setSaveStatus("saved");
        setError(null);
      } catch (saveError) {
        if (controller.signal.aborted) return;
        setSaveStatus("error");
        setError(saveError instanceof Error ? saveError.message : "Không thể lưu thay đổi.");
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [state]);

  const updateState = useCallback((update: (draft: PlannerState) => void) => {
    setState((current) => {
      if (!current) return current;
      const draft = structuredClone(current);
      update(draft);
      draft.updatedAt = new Date().toISOString();
      return draft;
    });
  }, []);

  return (
    <PlannerContext.Provider value={{ state, saveStatus, error, updateState, reload }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error("usePlanner must be used inside PlannerProvider");
  return context;
}

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AcademicData, EMPTY_DATA } from "./domain/academic";
import { storage } from "./storage";
export function useAcademic() {
  const [data, setData] = useState<AcademicData>(EMPTY_DATA);
  const [target, setTarget] = useState(75);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([storage.read(), storage.target()]).then(([d,t]) => { if (active) { setData(d); setTarget(t); setError(""); } }).catch(() => { if (active) { setData(EMPTY_DATA); setError("Saved data could not be read. Clear this device’s data in More, then sync again."); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));
  return { data, target, loading, error };
}
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id); }, []);
  return now;
}

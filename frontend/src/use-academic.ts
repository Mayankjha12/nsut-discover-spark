import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EMPTY_DATA } from "./domain/academic";
import { storage } from "./storage";
export function useAcademic() {
  const q = useQuery({ queryKey: ['academic'], queryFn: async () => {
    const [data, target] = await Promise.all([storage.read(), storage.target()]); return { data, target };
  }, staleTime: Infinity });
  return { data: q.data?.data ?? EMPTY_DATA, target: q.data?.target ?? 75, loading: q.isPending, error: q.isError ? 'Saved reports could not be opened. Please retry or sign in again.' : '' };
}
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id); }, []);
  return now;
}

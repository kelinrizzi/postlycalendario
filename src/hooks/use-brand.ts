import { useCallback, useEffect, useState } from "react";
import { defaultBrand, type Brand } from "@/lib/slide-types";

const KEY = "postly:brand";

export function useBrand() {
  const [brand, setBrand] = useState<Brand>(defaultBrand);

  // Load persisted brand on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setBrand({ ...defaultBrand(), ...(JSON.parse(raw) as Partial<Brand>) });
    } catch {
      /* ignore */
    }
  }, []);

  const update = useCallback((patch: Partial<Brand>) => {
    setBrand((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { brand, update };
}

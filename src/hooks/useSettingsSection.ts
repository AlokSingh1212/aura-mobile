import { useCallback, useEffect, useState } from "react";
import {
  loadEcosystemSettings,
  updateSettingsSection,
  type EcosystemSettings,
} from "@/lib/ecosystemSettings";

export function useSettingsSection<K extends keyof EcosystemSettings>(section: K) {
  const [data, setData] = useState<EcosystemSettings[K] | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await loadEcosystemSettings();
    setData(all[section]);
    setLoading(false);
  }, [section]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const patch = useCallback(
    async (p: Partial<EcosystemSettings[K]>) => {
      const next = await updateSettingsSection(section, p);
      setData(next[section]);
      return next;
    },
    [section]
  );

  return { data, loading, patch, refresh };
}

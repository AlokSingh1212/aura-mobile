import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  loadEcosystemSettings,
  refreshSettingsEnforcement,
  type EcosystemSettings,
} from "@/lib/ecosystemSettings";
import {
  getAccessibilityTokens,
  getEnforcedSettings,
  subscribeSettingsEnforcement,
} from "@/lib/settingsEnforcement";
import { setActiveLanguage, t as translate } from "@/lib/settingsI18n";
import { TimeLimitOverlay } from "@/components/settings/TimeLimitOverlay";
import { BiometricLockGate } from "@/components/settings/BiometricLockGate";

type Ctx = {
  settings: EcosystemSettings | null;
  refresh: () => Promise<void>;
  a11y: ReturnType<typeof getAccessibilityTokens>;
  t: (key: string, fallback?: string) => string;
};

const SettingsEnforcementContext = createContext<Ctx>({
  settings: null,
  refresh: async () => {},
  a11y: {
    reduceMotion: false,
    highContrast: false,
    largerText: false,
    autoCaptions: true,
    screenReaderHints: true,
    fontScale: 1,
  },
  t: translate,
});

export function SettingsEnforcementProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<EcosystemSettings | null>(null);

  const reload = useCallback(async () => {
    const all = await refreshSettingsEnforcement();
    setActiveLanguage(all.language);
    setSettings(all);
  }, []);

  useEffect(() => {
    reload();
    return subscribeSettingsEnforcement(() => {
      const current = getEnforcedSettings();
      if (current) {
        setActiveLanguage(current.language);
        setSettings({ ...current });
      }
    });
  }, [reload]);

  const a11y = useMemo(() => {
    try {
      return getAccessibilityTokens();
    } catch {
      return {
        reduceMotion: false,
        highContrast: false,
        largerText: false,
        autoCaptions: true,
        screenReaderHints: true,
        fontScale: 1,
      };
    }
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      refresh: reload,
      a11y,
      t: translate,
    }),
    [settings, reload, a11y]
  );

  return (
    <SettingsEnforcementContext.Provider value={value}>
      {children}
      <BiometricLockGate />
      <TimeLimitOverlay />
    </SettingsEnforcementContext.Provider>
  );
}

export function useEnforcedSettings() {
  return useContext(SettingsEnforcementContext);
}

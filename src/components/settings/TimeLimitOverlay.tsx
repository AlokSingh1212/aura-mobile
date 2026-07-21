import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  getDailyLimitMinutes,
  isBreakRemindersEnabled,
  isDailyLimitEnabled,
  isDailyLimitReached,
  setSessionUsageMinutes,
} from "@/lib/settingsEnforcement";
import { updateSettingsSection } from "@/lib/ecosystemSettings";
import { t as translate } from "@/lib/settingsI18n";
import { IG } from "@/theme/settingsTheme";

const USAGE_KEY = "@aura/daily_usage_v1";
const BREAK_KEY = "@aura/break_reminder_v1";
const TICK_MS = 60_000;
const BREAK_INTERVAL_MIN = 30;

export function TimeLimitOverlay() {
  const t = translate;
  const [visible, setVisible] = useState(false);
  const [breakVisible, setBreakVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const boot = async () => {
      const today = new Date().toISOString().slice(0, 10);
      try {
        const raw = await AsyncStorage.getItem(USAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : { day: today, minutes: 0 };
        const minutes = parsed.day === today ? parsed.minutes : 0;
        setSessionUsageMinutes(minutes, today);
        if (isDailyLimitEnabled() && minutes >= getDailyLimitMinutes()) {
          setVisible(true);
        }
      } catch {
        setSessionUsageMinutes(0, today);
      }
    };
    boot();

    timerRef.current = setInterval(async () => {
      if (!isDailyLimitEnabled() && !isBreakRemindersEnabled()) return;
      const today = new Date().toISOString().slice(0, 10);
      try {
        const raw = await AsyncStorage.getItem(USAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : { day: today, minutes: 0 };
        const base = parsed.day === today ? parsed.minutes : 0;
        const next = base + 1;
        await AsyncStorage.setItem(USAGE_KEY, JSON.stringify({ day: today, minutes: next }));
        setSessionUsageMinutes(next, today);
        if (isDailyLimitReached()) {
          setVisible(true);
          return;
        }

        if (isBreakRemindersEnabled() && next > 0 && next % BREAK_INTERVAL_MIN === 0) {
          const breakRaw = await AsyncStorage.getItem(BREAK_KEY);
          const breakParsed = breakRaw ? JSON.parse(breakRaw) : { day: today, lastAt: 0 };
          if (breakParsed.day !== today || breakParsed.lastAt !== next) {
            await AsyncStorage.setItem(
              BREAK_KEY,
              JSON.stringify({ day: today, lastAt: next })
            );
            setBreakVisible(true);
          }
        }
      } catch {
        /* ignore */
      }
    }, TICK_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const extendFifteen = async () => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const raw = await AsyncStorage.getItem(USAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : { day: today, minutes: 0 };
      const base = parsed.day === today ? parsed.minutes : 0;
      const next = Math.max(0, base - 15);
      await AsyncStorage.setItem(USAGE_KEY, JSON.stringify({ day: today, minutes: next }));
      setSessionUsageMinutes(next, today);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const snoozeLimit = async () => {
    await updateSettingsSection("time", { limitEnabled: false });
    setVisible(false);
  };

  if (!visible && !breakVisible) return null;

  if (breakVisible && !visible) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>Time for a break</Text>
            <Text style={styles.body}>
              You&apos;ve been on AURA for a while. Stretch, hydrate, or step away for a few minutes.
            </Text>
            <TouchableOpacity style={styles.primary} onPress={() => setBreakVisible(false)}>
              <Text style={styles.primaryText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/settings/time" as any)}>
              <Text style={styles.link}>Break reminder settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t("settings.time_limit.title")}</Text>
          <Text style={styles.body}>{t("settings.time_limit.body")}</Text>
          <TouchableOpacity style={styles.primary} onPress={() => router.push("/settings/time" as any)}>
            <Text style={styles.primaryText}>{t("settings.time_limit.settings")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={extendFifteen}>
            <Text style={styles.secondaryText}>{t("settings.time_limit.continue")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={snoozeLimit}>
            <Text style={styles.link}>Turn off daily limit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: IG.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
  },
  title: { color: IG.text, fontSize: 20, fontWeight: "700", marginBottom: 8 },
  body: { color: IG.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  primary: {
    backgroundColor: IG.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  secondary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IG.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryText: { color: IG.text, fontWeight: "600", fontSize: 15 },
  link: { color: IG.textSecondary, textAlign: "center", fontSize: 14 },
});

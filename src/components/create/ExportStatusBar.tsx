import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { subscribeExportJob, type ExportJob } from "@/lib/exportJob";

export function ExportStatusBar() {
  const [job, setJob] = useState<ExportJob>({ phase: "idle", label: "", progress: 0 });

  useEffect(() => subscribeExportJob(setJob), []);

  if (job.phase === "idle" || job.phase === "done") return null;

  return (
    <View style={styles.bar}>
      {job.phase !== "error" ? (
        <ActivityIndicator size="small" color="#00f5ff" />
      ) : null}
      <Text style={[styles.label, job.phase === "error" && styles.error]} numberOfLines={1}>
        {job.label}
        {job.progress > 0 && job.phase !== "error" ? ` · ${job.progress}%` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(0,245,255,0.08)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,245,255,0.2)",
  },
  label: {
    flex: 1,
    color: "#00f5ff",
    fontSize: 13,
    fontWeight: "600",
  },
  error: {
    color: "#ff6b6b",
  },
});

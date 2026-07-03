import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  type TextStyle,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  applyCaptionSuggestion,
  getActiveCaptionToken,
  segmentCaptionForInput,
  type CaptionToken,
} from "@/lib/captionAutocomplete";
import { searchHashtags, searchProfiles } from "@/lib/postComposerSearch";

const HASHTAG_COLOR = "#00f5ff";
const MENTION_COLOR = "#ff9500";

interface SuggestionRow {
  id: string;
  label: string;
  subtitle?: string;
  value: string;
}

interface CaptionComposerInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  style?: TextStyle;
  minHeight?: number;
}

export function CaptionComposerInput({
  value,
  onChangeText,
  placeholder = "Write a caption…",
  maxLength = 2200,
  style,
  minHeight = 64,
}: CaptionComposerInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: value.length, end: value.length });
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const pendingCursor = useRef<number | null>(null);

  const activeToken = useMemo(
    () => getActiveCaptionToken(value, selection.end),
    [value, selection.end]
  );

  const segments = useMemo(() => {
    const base = segmentCaptionForInput(value);
    if (!activeToken) return base;

    const covered =
      base.reduce((n, s) => n + s.value.length, 0) >= value.length ||
      base.some((s) => s.value === value.slice(activeToken.start, activeToken.end));

    if (covered) return base;

    const before = value.slice(0, activeToken.start);
    const tokenText = value.slice(activeToken.start, activeToken.end);
    const after = value.slice(activeToken.end);
    const rebuilt: ReturnType<typeof segmentCaptionForInput> = [];

    if (before) {
      rebuilt.push(...segmentCaptionForInput(before).filter((s) => s.value));
    }
    rebuilt.push({
      kind: activeToken.type === "hashtag" ? "hashtag" : "mention",
      value: tokenText,
    });
    if (after) {
      rebuilt.push(...segmentCaptionForInput(after).filter((s) => s.value));
    }
    return rebuilt.length ? rebuilt : base;
  }, [value, activeToken]);

  const inputStyle = useMemo(
    () => [styles.input, { minHeight }, style],
    [minHeight, style]
  );

  useEffect(() => {
    if (pendingCursor.current !== null) {
      const pos = pendingCursor.current;
      pendingCursor.current = null;
      setSelection({ start: pos, end: pos });
      inputRef.current?.setNativeProps({ selection: { start: pos, end: pos } });
    }
  }, [value]);

  useEffect(() => {
    if (!activeToken) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        if (activeToken.type === "hashtag") {
          const tags = await searchHashtags(activeToken.query);
          if (cancelled) return;
          setSuggestions(
            tags.map((t) => ({
              id: t.tag,
              label: `#${t.tag}`,
              subtitle: t.count > 1 ? `${t.count.toLocaleString()} posts` : "Start this tag",
              value: t.tag,
            }))
          );
        } else {
          const q = activeToken.query.trim();
          if (!q) {
            setSuggestions([]);
            setLoading(false);
            return;
          }
          const profiles = await searchProfiles(q);
          if (cancelled) return;
          setSuggestions(
            profiles.map((p) => ({
              id: p.id,
              label: `@${p.username}`,
              subtitle: p.name,
              value: p.username,
            }))
          );
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeToken?.type, activeToken?.query]);

  const pickSuggestion = useCallback(
    (row: SuggestionRow, token: CaptionToken) => {
      const { text, cursor } = applyCaptionSuggestion(value, token, row.value);
      pendingCursor.current = cursor;
      onChangeText(text);
      setSuggestions([]);
    },
    [value, onChangeText]
  );

  const onSelectionChange = (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    setSelection(e.nativeEvent.selection);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.inputStack}>
        <Text pointerEvents="none" style={[inputStyle, styles.mirror]}>
          {value.length === 0 ? (
            <Text style={styles.placeholder}>{placeholder}</Text>
          ) : (
            segments.map((seg, i) => {
              if (seg.kind === "hashtag") {
                return (
                  <Text key={`${i}-h`} style={styles.hashtag}>
                    {seg.value}
                  </Text>
                );
              }
              if (seg.kind === "mention") {
                return (
                  <Text key={`${i}-m`} style={styles.mention}>
                    {seg.value}
                  </Text>
                );
              }
              return <Text key={`${i}-t`}>{seg.value}</Text>;
            })
          )}
        </Text>
        <TextInput
          ref={inputRef}
          style={[inputStyle, styles.inputOverlay]}
          placeholder=""
          value={value}
          onChangeText={onChangeText}
          onSelectionChange={onSelectionChange}
          multiline
          maxLength={maxLength}
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={activeToken?.type === "hashtag" ? HASHTAG_COLOR : MENTION_COLOR}
          cursorColor="#fff"
        />
      </View>

      {activeToken &&
      (activeToken.type === "hashtag" || activeToken.query.length > 0) &&
      (loading || suggestions.length > 0) ? (
        <View style={styles.suggestPanel}>
          {loading ? (
            <ActivityIndicator color={HASHTAG_COLOR} style={{ paddingVertical: 10 }} />
          ) : (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="always"
              style={{ maxHeight: 160 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestRow}
                  onPress={() => pickSuggestion(item, activeToken)}
                >
                  <Lucide
                    name={activeToken.type === "hashtag" ? "pricetag-outline" : "at-outline"}
                    size={18}
                    color={activeToken.type === "hashtag" ? HASHTAG_COLOR : MENTION_COLOR}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.suggestLabel,
                        activeToken.type === "hashtag" ? styles.hashtag : styles.mention,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle ? (
                      <Text style={styles.suggestSub} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  inputStack: { position: "relative" },
  input: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: "top",
    padding: 0,
  },
  mirror: {
    color: "#fff",
  },
  inputOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    color: "transparent",
  },
  placeholder: {
    color: "rgba(255,255,255,0.35)",
  },
  hashtag: {
    color: HASHTAG_COLOR,
    fontWeight: "600",
  },
  mention: {
    color: MENTION_COLOR,
    fontWeight: "600",
  },
  suggestPanel: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  suggestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  suggestLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  suggestSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 2,
  },
});

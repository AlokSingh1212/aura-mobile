import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  type TextStyle,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import {
  applyCaptionSuggestion,
  getActiveCaptionToken,
  segmentCaptionForInput,
  type CaptionSegment,
  type CaptionToken,
} from "@/lib/captionAutocomplete";
import { searchHashtags, searchProfiles } from "@/lib/postComposerSearch";

const HASHTAG_COLOR = "#00f5ff";
const MENTION_COLOR = "#ff9500";

const ANDROID_TEXT = Platform.OS === "android"
  ? { fontFamily: "Roboto" as const, includeFontPadding: false as const }
  : {};

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

/** Mirror segments must match TextInput char-for-char (same weight/size — color only). */
function buildMirrorSegments(value: string, activeToken: CaptionToken | null): CaptionSegment[] {
  if (!value) return [];

  if (!activeToken) {
    return segmentCaptionForInput(value);
  }

  const before = value.slice(0, activeToken.start);
  const tokenText = value.slice(activeToken.start, activeToken.end);
  const after = value.slice(activeToken.end);

  const segments: CaptionSegment[] = [];
  if (before) segments.push(...segmentCaptionForInput(before));
  segments.push({
    kind: activeToken.type === "hashtag" ? "hashtag" : "mention",
    value: tokenText,
  });
  if (after) segments.push(...segmentCaptionForInput(after));

  return segments.filter((s) => s.value.length > 0);
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

  const segments = useMemo(
    () => buildMirrorSegments(value, activeToken),
    [value, activeToken]
  );

  const sharedTextStyle = useMemo(
    () => [styles.textBase, { minHeight }, style],
    [minHeight, style]
  );

  useEffect(() => {
    if (pendingCursor.current !== null) {
      const pos = pendingCursor.current;
      pendingCursor.current = null;
      setSelection({ start: pos, end: pos });
      requestAnimationFrame(() => {
        inputRef.current?.setNativeProps({ selection: { start: pos, end: pos } });
      });
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
        {/* Colored mirror — absolute behind; must not change glyph metrics vs TextInput */}
        <Text pointerEvents="none" style={[sharedTextStyle, styles.mirror]} accessible={false}>
          {value.length === 0 ? (
            <Text style={styles.placeholder}>{placeholder}</Text>
          ) : (
            segments.map((seg, i) => {
              if (seg.kind === "hashtag") {
                return (
                  <Text key={`${i}-h`} style={styles.hashtagMirror}>
                    {seg.value}
                  </Text>
                );
              }
              if (seg.kind === "mention") {
                return (
                  <Text key={`${i}-m`} style={styles.mentionMirror}>
                    {seg.value}
                  </Text>
                );
              }
              return (
                <Text key={`${i}-t`} style={styles.plainMirror}>
                  {seg.value}
                </Text>
              );
            })
          )}
        </Text>

        {/* TextInput drives layout height; text transparent so mirror shows through */}
        <TextInput
          ref={inputRef}
          style={[sharedTextStyle, styles.inputField]}
          placeholder=""
          value={value}
          onChangeText={onChangeText}
          onSelectionChange={onSelectionChange}
          multiline
          scrollEnabled={false}
          maxLength={maxLength}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          selectionColor={activeToken?.type === "hashtag" ? HASHTAG_COLOR : "#fff"}
          cursorColor="#fff"
          underlineColorAndroid="transparent"
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
              nestedScrollEnabled
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
                        activeToken.type === "hashtag" ? styles.suggestHashtag : styles.suggestMention,
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
  inputStack: {
    position: "relative",
  },
  textBase: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
    textAlignVertical: "top",
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    margin: 0,
    ...ANDROID_TEXT,
  },
  mirror: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  inputField: {
    zIndex: 1,
    color: Platform.OS === "ios" ? "transparent" : "rgba(255,255,255,0.01)",
    backgroundColor: "transparent",
  },
  plainMirror: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
    ...ANDROID_TEXT,
  },
  hashtagMirror: {
    color: HASHTAG_COLOR,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
    ...ANDROID_TEXT,
  },
  mentionMirror: {
    color: MENTION_COLOR,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
    ...ANDROID_TEXT,
  },
  placeholder: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
    ...ANDROID_TEXT,
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
  suggestHashtag: { color: HASHTAG_COLOR },
  suggestMention: { color: MENTION_COLOR },
  suggestSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 2,
  },
});

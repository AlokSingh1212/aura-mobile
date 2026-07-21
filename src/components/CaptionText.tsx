import React, { useMemo } from "react";
import { Text, type TextProps, type TextStyle } from "react-native";

const HASHTAG_COLOR = "#0095f6";
const MENTION_COLOR = "#ff9500";

type Segment =
  | { kind: "text"; value: string }
  | { kind: "hashtag"; value: string }
  | { kind: "mention"; value: string };

function tokenizeCaption(caption: string): Segment[] {
  const segments: Segment[] = [];
  const re = /(#([\w\u00C0-\u024F\u0900-\u097F]+)|@([\w.]+))/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(caption)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", value: caption.slice(lastIndex, match.index) });
    }
    if (match[0].startsWith("#")) {
      segments.push({ kind: "hashtag", value: match[0] });
    } else {
      segments.push({ kind: "mention", value: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < caption.length) {
    segments.push({ kind: "text", value: caption.slice(lastIndex) });
  }

  return segments.length ? segments : [{ kind: "text", value: caption }];
}

interface CaptionTextProps extends TextProps {
  caption?: string | null;
  style?: TextStyle | TextStyle[];
  hashtagStyle?: TextStyle;
  mentionStyle?: TextStyle;
  onHashtagPress?: (tag: string) => void;
  onMentionPress?: (username: string) => void;
}

import { StyleSheet } from "react-native";

export function CaptionText({
  caption,
  style,
  hashtagStyle,
  mentionStyle,
  onHashtagPress,
  onMentionPress,
  ...rest
}: CaptionTextProps) {
  const segments = useMemo(() => tokenizeCaption(caption || ""), [caption]);

  if (!caption) return null;

  const flatStyle = StyleSheet.flatten(style) || {};
  const textColor = flatStyle.color || "#fff";
  const parentStyle = { ...flatStyle, color: undefined };

  return (
    <Text style={parentStyle} {...rest}>
      {segments.map((seg, i) => {
        if (seg.kind === "hashtag") {
          return (
            <Text
              key={`${i}-${seg.value}`}
              style={[{ color: HASHTAG_COLOR, fontWeight: "600" }, hashtagStyle]}
              onPress={
                onHashtagPress
                  ? () => onHashtagPress(seg.value.replace(/^#/, "").toLowerCase())
                  : undefined
              }
            >
              {seg.value}
            </Text>
          );
        }
        if (seg.kind === "mention") {
          return (
            <Text
              key={`${i}-${seg.value}`}
              style={[{ color: MENTION_COLOR, fontWeight: "600" }, mentionStyle]}
              onPress={
                onMentionPress
                  ? () => onMentionPress(seg.value.replace(/^@/, "").toLowerCase())
                  : undefined
              }
            >
              {seg.value}
            </Text>
          );
        }
        return (
          <Text key={`${i}-${seg.value}`} style={{ color: textColor }}>
            {seg.value}
          </Text>
        );
      })}
    </Text>
  );
}

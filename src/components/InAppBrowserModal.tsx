import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width } = Dimensions.get("window");

export interface InAppBrowserProps {
  visible: boolean;
  url: string;
  onClose: () => void;
}

/**
 * Extracts the hostname from a URL string.
 * Falls back to the raw URL if parsing fails.
 */
const extractDomain = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
};

export const InAppBrowserModal: React.FC<InAppBrowserProps> = ({
  visible,
  url,
  onClose,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(url);

  const handleNavigationStateChange = useCallback(
    (navState: { canGoBack: boolean; canGoForward: boolean; url: string; loading: boolean }) => {
      setCanGoBack(navState.canGoBack);
      setCanGoForward(navState.canGoForward);
      setCurrentUrl(navState.url);
      setIsLoading(navState.loading);
    },
    []
  );

  const goBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    }
  };

  const goForward = () => {
    if (canGoForward && webViewRef.current) {
      webViewRef.current.goForward();
    }
  };

  const reload = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const domain = extractDomain(currentUrl || url);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* ── Top Header Bar ──────────────────────────────── */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.domainRow}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.domainText} numberOfLines={1}>
                {domain}
              </Text>
            </View>
            <Text style={styles.subtitleText}>Aura</Text>
          </View>

          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── Loading Progress Bar ────────────────────────── */}
        {isLoading && (
          <View style={styles.progressContainer}>
            <ActivityIndicator
              size="small"
              color="#00f5ff"
              style={styles.progressIndicator}
            />
            <View style={styles.progressBar} />
          </View>
        )}

        {/* ── WebView ────────────────────────────────────── */}
        <View style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            style={styles.webView}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            startInLoadingState
            allowsInlineMediaPlayback
            javaScriptEnabled
          />
        </View>

        {/* ── Bottom Navigation Toolbar ───────────────────── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomBtn}
            onPress={goBack}
            disabled={!canGoBack}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={canGoBack ? "#FFFFFF" : "#48484A"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomBtn}
            onPress={goForward}
            disabled={!canGoForward}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={canGoForward ? "#FFFFFF" : "#48484A"}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBtn}>
            <Ionicons name="share-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBtn} onPress={reload}>
            <Ionicons name="refresh-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBtn}>
            <Ionicons name="time-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  domainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lockIcon: {
    fontSize: 12,
  },
  domainText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    maxWidth: width * 0.55,
  },
  subtitleText: {
    color: "#8E8E93",
    fontSize: 11,
    marginTop: 2,
  },
  progressContainer: {
    height: 3,
    backgroundColor: "#111",
    overflow: "hidden",
    position: "relative",
  },
  progressIndicator: {
    position: "absolute",
    right: 8,
    top: -8,
    transform: [{ scale: 0.5 }],
  },
  progressBar: {
    height: 3,
    width: "60%",
    backgroundColor: "#00f5ff",
    borderRadius: 2,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  webView: {
    flex: 1,
    backgroundColor: "#000",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: "#111",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  bottomBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import Lucide from "@expo/vector-icons/Ionicons";
import { reverseGeocodeLocation, type VerifiedLocation } from "@/lib/postComposerTypes";

interface LocationCaptureSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (location: VerifiedLocation) => void;
}

function buildMapHtml(lat: number, lon: number) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; background: #111; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const startLat = ${lat};
    const startLon = ${lon};
    const map = L.map('map', { zoomControl: true }).setView([startLat, startLon], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    const marker = L.marker([startLat, startLon], { draggable: true }).addTo(map);
    function sendPosition() {
      const pos = marker.getLatLng();
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: pos.lat, lon: pos.lng }));
    }
    marker.on('dragend', sendPosition);
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      sendPosition();
    });
    sendPosition();
  </script>
</body>
</html>`;
}

export function LocationCaptureSheet({ visible, onClose, onConfirm }: LocationCaptureSheetProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [preview, setPreview] = useState<VerifiedLocation | null>(null);
  const webRef = useRef<WebView>(null);

  const captureGps = useCallback(async () => {
    setLoading(true);
    setPreview(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location required", "Enable location access to add a verified place to your post.");
        onClose();
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    } catch {
      Alert.alert("GPS unavailable", "Could not read your device location. Try again outdoors or enable location services.");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [onClose]);

  useEffect(() => {
    if (visible) captureGps();
    else {
      setCoords(null);
      setPreview(null);
      setConfirming(false);
    }
  }, [visible, captureGps]);

  const onMapMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { lat: number; lon: number };
      if (Number.isFinite(data.lat) && Number.isFinite(data.lon)) {
        setCoords({ lat: data.lat, lon: data.lon });
        setPreview(null);
      }
    } catch {
      /* ignore */
    }
  };

  const handleConfirm = async () => {
    if (!coords) return;
    setConfirming(true);
    try {
      const verified = await reverseGeocodeLocation(coords.lat, coords.lon);
      if (!verified) {
        Alert.alert("Could not verify location", "Try moving the pin or refreshing GPS.");
        return;
      }
      onConfirm(verified);
      onClose();
    } catch {
      Alert.alert("Network error", "Could not verify this location with the map server.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Lucide name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Add location</Text>
          <TouchableOpacity onPress={captureGps} disabled={loading}>
            <Lucide name="locate-outline" size={24} color="#00f5ff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Your location is captured from GPS and the map pin. You cannot type a fake place.
        </Text>

        <View style={styles.mapWrap}>
          {loading || !coords ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator color="#00f5ff" size="large" />
              <Text style={styles.mapLoadingText}>Getting GPS…</Text>
            </View>
          ) : (
            <WebView
              ref={webRef}
              originWhitelist={["*"]}
              source={{ html: buildMapHtml(coords.lat, coords.lon) }}
              onMessage={onMapMessage}
              style={styles.map}
              javaScriptEnabled
              domStorageEnabled
            />
          )}
        </View>

        {preview ? (
          <View style={styles.previewBox}>
            <Lucide name="location" size={18} color="#00f5ff" />
            <Text style={styles.previewText} numberOfLines={2}>
              {preview.label}
            </Text>
          </View>
        ) : coords ? (
          <Text style={styles.coordsText}>
            Pin: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.confirmBtn, (!coords || confirming) && { opacity: 0.5 }]}
          onPress={handleConfirm}
          disabled={!coords || confirming}
        >
          {confirming ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.confirmText}>Use this location</Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080415" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  hint: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  mapWrap: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#111",
  },
  map: { flex: 1 },
  mapLoading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  mapLoadingText: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  coordsText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 16,
  },
  previewBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  previewText: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600" },
  confirmBtn: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#00f5ff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmText: { color: "#000", fontSize: 16, fontWeight: "800" },
});

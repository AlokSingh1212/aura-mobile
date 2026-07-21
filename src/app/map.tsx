import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { API_HOST } from "@/constants/api";
import { useStore } from "@/store/useStore";
import { authHeaders } from "@/lib/apiClient";

const { width, height } = Dimensions.get("window");

export default function MapScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView | null>(null);
  
  // App store auth session
  const currentUser = useStore((state: any) => state.currentUser);
  const activeProfile = useStore((state: any) => state.activeProfile);
  
  // Screen States
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const [myLocationInfo, setMyLocationInfo] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [ghostMode, setGhostMode] = useState(true);
  
  // Note Modal State
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [updatingNote, setUpdatingNote] = useState(false);

  // Story/Video Viewer Modal State
  const [viewingStory, setViewingStory] = useState<any>(null);

  // Map Click Explore State
  const [exploreCoords, setExploreCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [exploreData, setExploreData] = useState<{ reels: any[]; stories: any[] } | null>(null);
  const [loadingExplore, setLoadingExplore] = useState(false);
  
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationPermission(true);
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setCurrentCoords(coords);
        await updateBackendLocation(coords.latitude, coords.longitude);
      } else {
        setLocationPermission(false);
        setCurrentCoords({ latitude: 28.6139, longitude: 77.2090 });
      }
      await fetchMapFeed();
    } catch (err) {
      console.warn("Failed to get location permission/coordinates:", err);
      setCurrentCoords({ latitude: 28.6139, longitude: 77.2090 });
      await fetchMapFeed();
    } finally {
      setLoading(false);
    }
  };

  const updateBackendLocation = async (lat: number, lng: number) => {
    try {
      await fetch(`${API_HOST}/api/mobile/location/update`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: currentUser?.id,
          latitude: lat,
          longitude: lng,
        }),
      });
    } catch (e) {
      console.warn("Failed to report coordinates to backend:", e);
    }
  };

  const fetchMapFeed = async () => {
    try {
      const res = await fetch(`${API_HOST}/api/mobile/location/friends?userId=${currentUser?.id || ""}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setMyLocationInfo(data.myLocation);
        setFriends(data.friends || []);
        if (data.myLocation) {
          setGhostMode(data.myLocation.isGhostMode);
          setNoteText(data.myLocation.note || "");
        }
      }
    } catch (e) {
      console.warn("Failed to fetch map friends/locations:", e);
    }
  };

  const fetchExploreContent = async (lat: number, lng: number) => {
    setLoadingExplore(true);
    try {
      const res = await fetch(`${API_HOST}/api/mobile/location/explore?latitude=${lat}&longitude=${lng}&radius=15`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setExploreData({
          reels: data.reels || [],
          stories: data.stories || [],
        });
      }
    } catch (e) {
      console.warn("Failed to fetch explore content:", e);
    } finally {
      setLoadingExplore(false);
    }
  };

  const toggleGhostMode = async () => {
    try {
      const nextGhost = !ghostMode;
      setGhostMode(nextGhost);
      
      const res = await fetch(`${API_HOST}/api/mobile/location/ghost-mode`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: currentUser?.id,
          isGhostMode: nextGhost,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGhostMode(data.isGhostMode);
        await fetchMapFeed();
      }
    } catch (e) {
      setGhostMode(!ghostMode);
      Alert.alert("Error", "Failed to update location privacy settings");
    }
  };

  const submitNote = async () => {
    if (updatingNote) return;
    setUpdatingNote(true);
    try {
      const res = await fetch(`${API_HOST}/api/mobile/profile/note`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: currentUser?.id,
          note: noteText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNoteModal(false);
        await fetchMapFeed();
      } else {
        Alert.alert("Error", data.error || "Failed to update note");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update status note");
    } finally {
      setUpdatingNote(false);
    }
  };

  const centerOnMe = () => {
    if (currentCoords && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: "PAN_TO",
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
      }));
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "CLICK_MARKER") {
        const { isSelf, profile } = msg;
        if (isSelf) {
          setShowNoteModal(true);
        } else if (profile.stories && profile.stories.length > 0) {
          setViewingStory({
            url: profile.stories[0].url,
            caption: profile.stories[0].caption,
            isVideo: profile.stories[0].url.includes(".mp4") || profile.stories[0].url.includes("video"),
          });
        } else {
          Alert.alert(`@${profile.username}`, profile.note || "Active on Aura Map");
        }
      } else if (msg.type === "TAP_MAP") {
        const { latitude, longitude } = msg;
        setExploreCoords({ latitude, longitude });
        fetchExploreContent(latitude, longitude);
      }
    } catch (err) {
      console.warn("Failed to parse webview message:", err);
    }
  };

  const generateMapHtml = () => {
    const userAvatar = activeProfile?.logo || currentUser?.avatar || "";
    const myLoc = myLocationInfo ? {
      ...myLocationInfo,
      avatar: userAvatar,
      isGhostMode: ghostMode
    } : null;

    const serializedMyLoc = JSON.stringify(myLoc);
    const serializedFriends = JSON.stringify(friends);
    const centerCoords = currentCoords ? [currentCoords.latitude, currentCoords.longitude] : [28.6139, 77.2090];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; background: #080614; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          #map { height: 100vh; width: 100vw; background: #080614; }
          
          /* Custom leaflet markers */
          .marker-container {
            position: relative;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          /* Notes Bubble */
          .note-bubble {
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid #110e24;
            border-radius: 12px;
            padding: 4px 8px;
            color: #0c0a1c;
            font-size: 10px;
            font-weight: 700;
            text-align: center;
            white-space: nowrap;
            max-width: 110px;
            overflow: hidden;
            text-overflow: ellipsis;
            position: absolute;
            bottom: 48px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            z-index: 100;
          }
          .note-bubble::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            border-width: 4px 4px 0;
            border-style: solid;
            border-color: rgba(255, 255, 255, 0.96) transparent transparent;
          }
          
          /* Avatar rings */
          .avatar-ring-self {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2.5px solid #00f5ff;
            overflow: hidden;
            box-shadow: 0 0 8px rgba(0,245,255,0.4);
            box-sizing: border-box;
          }
          .avatar-ring-friend {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.85);
            overflow: hidden;
            box-sizing: border-box;
          }
          .avatar-ring-story {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fb923c, #d946ef, #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding: 2.5px;
            box-shadow: 0 0 8px rgba(217,70,239,0.3);
          }
          .avatar-img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
          }
          .avatar-img-story {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 1.5px solid #110e24;
            object-fit: cover;
          }
          
          /* Label name */
          .marker-name {
            color: #ffffff;
            font-size: 10.5px;
            font-weight: 700;
            text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9);
            position: absolute;
            top: 45px;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const myLoc = ${serializedMyLoc};
          const friends = ${serializedFriends};
          
          const map = L.map('map', { 
            zoomControl: false,
            attributionControl: false
          }).setView([${centerCoords[0]}, ${centerCoords[1]}], 12);
          
          // CartoDB Dark Matter tiles layer (premium clean dark mode)
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
          }).addTo(map);
          
          function addProfileMarker(data, isSelf) {
            const hasStory = data.stories && data.stories.length > 0;
            const avatarUrl = data.avatar;
            
            let avatarHtml = '';
            if (avatarUrl) {
              avatarHtml = '<img class="' + (hasStory ? 'avatar-img-story' : 'avatar-img') + '" src="' + avatarUrl + '" />';
            } else {
              const initial = data.name ? data.name.charAt(0).toUpperCase() : '?';
              avatarHtml = '<div style="width:100%;height:100%;border-radius:50%;background:#2C2C2E;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:bold;">' + initial + '</div>';
            }
            
            let html = '<div class="marker-container">';
            if (data.note) {
              html += '<div class="note-bubble">' + data.note + '</div>';
            }
            
            if (isSelf) {
              html += '<div class="avatar-ring-self">' + avatarHtml + '</div>';
            } else if (hasStory) {
              html += '<div class="avatar-ring-story">' + avatarHtml + '</div>';
            } else {
              html += '<div class="avatar-ring-friend">' + avatarHtml + '</div>';
            }
            
            html += '<div class="marker-name">' + (isSelf ? 'You' : data.name.split(" ")[0]) + '</div>';
            html += '</div>';
            
            const customIcon = L.divIcon({
              html: html,
              className: '',
              iconSize: [50, 50],
              iconAnchor: [25, 25]
            });
            
            const marker = L.marker([data.latitude, data.longitude], { icon: customIcon }).addTo(map);
            
            marker.on('click', function(e) {
              L.DomEvent.stopPropagation(e);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CLICK_MARKER',
                isSelf: isSelf,
                profile: data
              }));
            });
          }
          
          if (myLoc && !myLoc.isGhostMode && myLoc.latitude) {
            addProfileMarker(myLoc, true);
          }
          
          friends.forEach(f => {
            if (f.latitude && f.longitude) {
              addProfileMarker(f, false);
            }
          });

          // Listen for general map clicks to explore coordinates
          map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'TAP_MAP',
              latitude: e.latlng.lat,
              longitude: e.latlng.lng
            }));
          });
          
          window.addEventListener('message', function(event) {
            const msg = JSON.parse(event.data);
            if (msg.type === 'PAN_TO') {
              map.panTo([msg.latitude, msg.longitude]);
            }
          });
        </script>
      </body>
      </html>
    `;
  };

  if (loading || !currentCoords) {
    return (
      <View style={localStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#00f5ff" />
        <Text style={localStyles.loadingText}>Synthesizing location maps...</Text>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      {/* Leaflet Web Map */}
      <WebView
        ref={webViewRef}
        style={StyleSheet.absoluteFillObject}
        originWhitelist={["*"]}
        source={{ html: generateMapHtml() }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />

      {/* Floating Header */}
      <SafeAreaView style={localStyles.headerContainer} pointerEvents="box-none">
        <View style={localStyles.headerRow}>
          <TouchableOpacity style={localStyles.roundBtn} onPress={() => router.back()}>
            <Lucide name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={localStyles.headerTitle}>Aura Map</Text>

          <TouchableOpacity style={localStyles.roundBtn} onPress={fetchMapFeed}>
            <Lucide name="sync-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Explore Bottom Slider Tray */}
      {exploreCoords && (
        <View style={localStyles.exploreTray}>
          <View style={localStyles.exploreHeader}>
            <View>
              <Text style={localStyles.exploreTitle}>Explore Location</Text>
              <Text style={localStyles.exploreSubtitle}>
                {loadingExplore
                  ? "Searching coordinates..."
                  : `${(exploreData?.reels || []).length} reels & ${(exploreData?.stories || []).length} stories nearby`}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { setExploreCoords(null); setExploreData(null); }}>
              <Lucide name="close-circle" size={24} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          {loadingExplore ? (
            <ActivityIndicator size="small" color="#00f5ff" style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {exploreData?.reels.map((reel) => (
                <TouchableOpacity
                  key={reel.id}
                  style={localStyles.exploreItem}
                  onPress={() => setViewingStory({
                    url: reel.videoUrl,
                    caption: reel.title,
                    isVideo: true
                  })}
                >
                  <View style={[localStyles.exploreItemThumb, { backgroundColor: "#2C2C2E", justifyContent: "center", alignItems: "center" }]}>
                    <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>{reel.username?.[0]?.toUpperCase() || "?"}</Text>
                  </View>
                  <View style={localStyles.exploreItemLabel}>
                    <Lucide name="play" size={10} color="#00f5ff" />
                    <Text style={localStyles.exploreItemText} numberOfLines={1}>
                      @{reel.username}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {exploreData?.stories.map((story) => (
                <TouchableOpacity
                  key={story.id}
                  style={localStyles.exploreItem}
                  onPress={() => setViewingStory({
                    url: story.url,
                    caption: story.caption,
                    isVideo: false
                  })}
                >
                  <Image source={{ uri: story.url }} style={localStyles.exploreItemThumb} />
                  <View style={localStyles.exploreItemLabel}>
                    <Lucide name="image" size={10} color="#fb923c" />
                    <Text style={localStyles.exploreItemText} numberOfLines={1}>
                      @{story.username}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {(!exploreData || (exploreData.reels.length === 0 && exploreData.stories.length === 0)) && (
                <Text style={localStyles.emptyExploreText}>No moments shared near this coordinate yet.</Text>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* Bottom Floating Control Bar */}
      <View style={localStyles.bottomBar}>
        {/* Toggle Ghost Mode */}
        <TouchableOpacity
          style={[localStyles.bottomBtn, ghostMode && localStyles.bottomBtnActive]}
          onPress={toggleGhostMode}
        >
          <Lucide name={ghostMode ? "airplane" : "location"} size={22} color="#fff" />
          <Text style={localStyles.bottomBtnText}>
            {ghostMode ? "Location Off" : "Location Active"}
          </Text>
        </TouchableOpacity>

        {/* Update status Note */}
        <TouchableOpacity
          style={localStyles.bottomBtn}
          onPress={() => setShowNoteModal(true)}
        >
          <Lucide name="chatbubble-ellipses-outline" size={22} color="#fff" />
          <Text style={localStyles.bottomBtnText}>Update Vibe</Text>
        </TouchableOpacity>

        {/* Center on Me */}
        <TouchableOpacity style={localStyles.centerBtn} onPress={centerOnMe}>
          <Lucide name="locate" size={24} color="#00f5ff" />
        </TouchableOpacity>
      </View>

      {/* Modal - Update Status Note */}
      <Modal
        visible={showNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Share Today's Vibe</Text>
            <Text style={localStyles.modalSubtitle}>Floating note bubble on your map marker</Text>
            
            <TextInput
              style={localStyles.noteInput}
              placeholder="What's your vibe today?..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              maxLength={60}
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
            />
            
            <Text style={localStyles.charCount}>{noteText.length}/60</Text>

            <View style={localStyles.modalButtons}>
              <TouchableOpacity
                style={[localStyles.modalBtn, localStyles.cancelBtn]}
                onPress={() => setShowNoteModal(false)}
              >
                <Text style={localStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[localStyles.modalBtn, localStyles.saveBtn]}
                onPress={submitNote}
                disabled={updatingNote}
              >
                {updatingNote ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={localStyles.saveBtnText}>Share vibe</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal - Story & Video Viewer */}
      <Modal
        visible={viewingStory !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingStory(null)}
      >
        <TouchableOpacity
          style={localStyles.storyOverlay}
          activeOpacity={1}
          onPress={() => setViewingStory(null)}
        >
          <View style={localStyles.storyContent}>
            {viewingStory && (
              <>
                <View style={localStyles.storyHeader}>
                  <Text style={localStyles.storyCaption} numberOfLines={1}>
                    {viewingStory.caption || "Aura Location Moment"}
                  </Text>
                  <TouchableOpacity onPress={() => setViewingStory(null)}>
                    <Lucide name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
                {viewingStory.isVideo ? (
                  <View style={{ width: width, height: height * 0.7, backgroundColor: "#000", borderRadius: 16, overflow: "hidden" }}>
                    <WebView
                      style={{ flex: 1, backgroundColor: "#000" }}
                      originWhitelist={["*"]}
                      source={{
                        html: `
                          <!DOCTYPE html>
                          <html>
                          <body style="margin:0;padding:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;">
                            <video src="${viewingStory.url}" autoplay loop playsinline controls style="max-width:100%;max-height:100%;object-fit:contain;"></video>
                          </body>
                          </html>
                        `
                      }}
                    />
                  </View>
                ) : (
                  <Image
                    source={{ uri: viewingStory.url }}
                    style={localStyles.storyImage}
                    resizeMode="contain"
                  />
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080614",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#080614",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    fontWeight: "500",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(8,6,20,0.75)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomBar: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  bottomBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(8,6,20,0.85)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  bottomBtnActive: {
    backgroundColor: "rgba(239,68,68,0.75)",
    borderColor: "rgba(239,68,68,0.3)",
  },
  bottomBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(8,6,20,0.85)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0d0b20",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  modalSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  noteInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#fff",
    padding: 16,
    fontSize: 15,
    height: 80,
  },
  charCount: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  cancelBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#00f5ff",
  },
  saveBtnText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
  },
  storyOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  storyContent: {
    width: width,
    height: height * 0.85,
    justifyContent: "center",
  },
  storyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  storyCaption: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  storyImage: {
    width: width,
    height: height * 0.7,
  },
  exploreTray: {
    position: "absolute",
    bottom: 95,
    left: 16,
    right: 16,
    backgroundColor: "rgba(13,11,32,0.92)",
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 99,
  },
  exploreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  exploreTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  exploreSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
  },
  exploreItem: {
    width: 80,
    height: 110,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    position: "relative",
  },
  exploreItemThumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  exploreItemLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 3,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  exploreItemText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "600",
    flex: 1,
  },
  emptyExploreText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "center",
    marginVertical: 20,
    width: width - 64,
  },
});

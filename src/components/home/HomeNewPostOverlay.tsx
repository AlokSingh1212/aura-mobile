import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lucide from "@expo/vector-icons/Ionicons";
import { type NewPostAudience } from "@/components/home/homeNewPostConstants";
import { homeNewPostStyles as styles } from "@/components/home/homeNewPostStyles";
import { searchAudio, searchLocations, searchProfiles, type LocationResult, type ProfileSearchResult } from "@/lib/postComposerSearch";
import { type AudioTrack } from "@/lib/audioLibrary";
import { Avatar } from "@/components/ui/Avatar";

type HomeNewPostOverlayProps = {
  visible: boolean;
  mediaUri: string;
  products: any[];
  isPublishing: boolean;
  caption: string;
  setCaption: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  audio: string;
  setAudio: (value: string) => void;
  aiLabel: boolean;
  setAiLabel: (value: boolean) => void;
  productId: string;
  setProductId: (value: string) => void;
  taggedPeople: string;
  setTaggedPeople: (value: string) => void;
  audience: NewPostAudience;
  setAudience: (value: NewPostAudience) => void;
  shareFeed: boolean;
  setShareFeed: (value: boolean) => void;
  commentsEnabled: boolean;
  setCommentsEnabled: (value: boolean) => void;
  likesHidden: boolean;
  setLikesHidden: (value: boolean) => void;
  crossPostEnabled: boolean;
  setCrossPostEnabled: (value: boolean) => void;
  allowDownload: boolean;
  setAllowDownload: (value: boolean) => void;
  promoteReel: boolean;
  setPromoteReel: (value: boolean) => void;
  isScheduled: boolean;
  setIsScheduled: (value: boolean) => void;
  scheduledTime: string;
  setScheduledTime: (value: string) => void;
  triggerHaptic: (style: "light" | "medium" | "success") => void;
  onClose: () => void;
  onShare: () => void;
};

export function HomeNewPostOverlay({
  visible,
  mediaUri,
  products,
  isPublishing,
  caption,
  setCaption,
  location,
  setLocation,
  audio,
  setAudio,
  aiLabel,
  setAiLabel,
  productId,
  setProductId,
  taggedPeople,
  setTaggedPeople,
  audience,
  setAudience,
  shareFeed,
  setShareFeed,
  commentsEnabled,
  setCommentsEnabled,
  likesHidden,
  setLikesHidden,
  crossPostEnabled,
  setCrossPostEnabled,
  allowDownload,
  setAllowDownload,
  promoteReel,
  setPromoteReel,
  isScheduled,
  setIsScheduled,
  scheduledTime,
  setScheduledTime,
  triggerHaptic,
  onClose,
  onShare,
}: HomeNewPostOverlayProps) {
  const [showAudioInput, setShowAudioInput] = useState(false);
  const [showTagPeople, setShowTagPeople] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showAudienceSelector, setShowAudienceSelector] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const [audioResults, setAudioResults] = useState<AudioTrack[]>([]);
  const [profileResults, setProfileResults] = useState<ProfileSearchResult[]>([]);
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showAudioInput) {
        searchAudio(audio).then(setAudioResults).catch(console.error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [audio, showAudioInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showTagPeople) {
        searchProfiles(taggedPeople).then(setProfileResults).catch(console.error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [taggedPeople, showTagPeople]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showLocationInput) {
        searchLocations(location).then(setLocationResults).catch(console.error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [location, showLocationInput]);

  useEffect(() => {
    if (!visible) {
      setShowAudioInput(false);
      setShowTagPeople(false);
      setShowLocationInput(false);
      setShowProductSelector(false);
      setShowAudienceSelector(false);
      setShowAdvancedOptions(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.dmSlidePanel}>
      <SafeAreaView style={styles.dmSafeArea}>
        <View style={styles.newPostHeader}>
          <TouchableOpacity onPress={onClose}>
            <Lucide name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.newPostHeaderTitle}>New post</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView style={styles.newPostScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.newPostMediaPreview}>
            <Image source={{ uri: mediaUri }} style={styles.newPostMediaImg} />
          </View>

          <View style={styles.newPostCaptionWrap}>
            <TextInput
              style={styles.newPostCaptionInput}
              placeholder="Add a caption..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={250}
            />
          </View>

          <View style={styles.newPostChipsRow}>
            <TouchableOpacity
              style={styles.newPostChip}
              onPress={() => {
                triggerHaptic("light");
                Alert.alert("Poll", "Add a poll question for your audience", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Add", onPress: () => setCaption(caption + "\n\n📊 Poll: ") },
                ]);
              }}
            >
              <Lucide name="options-outline" size={17} color="#fff" />
              <Text style={styles.newPostChipText}>Poll</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newPostChip}
              onPress={() => {
                triggerHaptic("light");
                Alert.alert("Prompt", "Add a question prompt for engagement", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Add", onPress: () => setCaption(caption + "\n\n💬 Ask me: ") },
                ]);
              }}
            >
              <Lucide name="chatbubble-ellipses-outline" size={17} color="#fff" />
              <Text style={styles.newPostChipText}>Prompt</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.newPostDivider} />

          <TouchableOpacity
            style={styles.newPostOptionRow}
            onPress={() => {
              triggerHaptic("light");
              setShowAudioInput(!showAudioInput);
            }}
          >
            <View style={styles.newPostOptionLeft}>
              <Lucide name="musical-notes-outline" size={23} color={audio ? "#00f5ff" : "#fff"} />
              <Text style={[styles.newPostOptionText, audio ? { color: "#00f5ff" } : {}]}>
                {audio || "Add audio"}
              </Text>
            </View>
            <Lucide
              name={showAudioInput ? "chevron-down" : "chevron-forward"}
              size={21}
              color="rgba(255,255,255,0.3)"
            />
          </TouchableOpacity>

          {showAudioInput && (
            <View>
              <View style={styles.newPostInlineInput}>
                <TextInput
                  style={styles.newPostInlineTextInput}
                  placeholder="Search trending songs / soundscapes..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={audio}
                  onChangeText={setAudio}
                  autoFocus
                />
                {audio ? (
                  <TouchableOpacity onPress={() => setAudio("")}>
                    <Lucide name="close-circle" size={21} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.autocompleteList}>
                {audioResults.map((songItem) => (
                  <TouchableOpacity
                    key={songItem.id || songItem.title}
                    style={styles.autocompleteItem}
                    onPress={() => {
                      triggerHaptic("light");
                      setAudio(`${songItem.title} - ${songItem.artist}`);
                      setShowAudioInput(false);
                    }}
                  >
                    <Image source={{ uri: songItem.cover }} style={styles.autocompleteCover} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.autocompleteText}>{songItem.title}</Text>
                      <Text style={styles.autocompleteSub}>
                        {songItem.artist} • {songItem.durationMs ? `${Math.floor((songItem.durationMs/1000) / 60)}:${(Math.floor(songItem.durationMs/1000) % 60).toString().padStart(2, '0')}` : ""}
                      </Text>
                    </View>
                    <Lucide name="play-circle-outline" size={23} color="#00f5ff" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {audio && !showAudioInput ? (
            <View style={styles.newPostAudioTrack}>
              <View style={styles.newPostAudioThumb}>
                <Lucide name="musical-note" size={19} color="#00f5ff" />
              </View>
              <Text style={styles.newPostAudioName} numberOfLines={1}>
                {audio}
              </Text>
              <TouchableOpacity onPress={() => setAudio("")}>
                <Lucide name="close-circle" size={19} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.newPostDivider} />

          <TouchableOpacity
            style={styles.newPostOptionRow}
            onPress={() => {
              triggerHaptic("light");
              setShowTagPeople(!showTagPeople);
            }}
          >
            <View style={styles.newPostOptionLeft}>
              <Lucide name="people-outline" size={23} color={taggedPeople ? "#00f5ff" : "#fff"} />
              <Text style={[styles.newPostOptionText, taggedPeople ? { color: "#00f5ff" } : {}]}>
                {taggedPeople ? `Tagged: ${taggedPeople}` : "Tag people"}
              </Text>
            </View>
            <Lucide
              name={showTagPeople ? "chevron-down" : "chevron-forward"}
              size={21}
              color="rgba(255,255,255,0.3)"
            />
          </TouchableOpacity>

          {showTagPeople && (
            <View>
              <View style={styles.newPostInlineInput}>
                <TextInput
                  style={styles.newPostInlineTextInput}
                  placeholder="@username, name..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={taggedPeople}
                  onChangeText={setTaggedPeople}
                  autoFocus
                />
                {taggedPeople ? (
                  <TouchableOpacity onPress={() => setTaggedPeople("")}>
                    <Lucide name="close-circle" size={21} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.autocompleteList}>
                {profileResults.map((userItem) => (
                  <TouchableOpacity
                    key={userItem.id}
                    style={styles.autocompleteItem}
                    onPress={() => {
                      triggerHaptic("light");
                      setTaggedPeople(userItem.username);
                      setShowTagPeople(false);
                    }}
                  >
                    <Avatar uri={userItem.logo} name={userItem.name} size={40} style={styles.autocompleteAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.autocompleteText}>{userItem.name}</Text>
                      <Text style={styles.autocompleteSub}>
                        @{userItem.username}
                      </Text>
                    </View>
                    <Lucide name="add-circle-outline" size={21} color="#00f5ff" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.newPostDivider} />

          <TouchableOpacity
            style={styles.newPostOptionRow}
            onPress={() => {
              triggerHaptic("light");
              setShowLocationInput(!showLocationInput);
            }}
          >
            <View style={styles.newPostOptionLeft}>
              <Lucide name="location-outline" size={23} color={location ? "#00f5ff" : "#fff"} />
              <Text style={[styles.newPostOptionText, location ? { color: "#00f5ff" } : {}]}>
                {location || "Add location"}
              </Text>
            </View>
            <Lucide
              name={showLocationInput ? "chevron-down" : "chevron-forward"}
              size={21}
              color="rgba(255,255,255,0.3)"
            />
          </TouchableOpacity>

          {showLocationInput && (
            <View>
              <View style={styles.newPostInlineInput}>
                <Lucide name="navigate-outline" size={19} color="rgba(255,255,255,0.3)" />
                <TextInput
                  style={styles.newPostInlineTextInput}
                  placeholder="e.g. Milan, 20121..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={location}
                  onChangeText={setLocation}
                  autoFocus
                />
                {location ? (
                  <TouchableOpacity onPress={() => setLocation("")}>
                    <Lucide name="close-circle" size={21} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.autocompleteList}>
                {locationResults.map((locItem) => (
                  <TouchableOpacity
                    key={locItem.id}
                    style={styles.autocompleteItem}
                    onPress={() => {
                      triggerHaptic("light");
                      setLocation(`${locItem.label}`);
                      setShowLocationInput(false);
                    }}
                  >
                    <View style={styles.autocompleteLocationIcon}>
                      <Lucide name="pin-outline" size={19} color="#00f5ff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.autocompleteText}>
                        {locItem.label}
                      </Text>
                      <Text style={styles.autocompleteSub}>{locItem.fullName}</Text>
                    </View>
                    <Lucide name="chevron-forward" size={19} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.newPostDivider} />

          <View style={styles.newPostOptionRow}>
            <View style={styles.newPostOptionLeft}>
              <Lucide name="cube-outline" size={23} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.newPostOptionText}>Add AI Label</Text>
                <Text style={styles.newPostOptionSub}>
                  {"We require you to label certain realistic content that's made with AI."}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.newPostToggle, aiLabel && styles.newPostToggleActive]}
              onPress={() => {
                triggerHaptic("light");
                setAiLabel(!aiLabel);
              }}
            >
              <View style={[styles.newPostToggleThumb, aiLabel && styles.newPostToggleThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.newPostDivider} />

          <TouchableOpacity
            style={styles.newPostOptionRow}
            onPress={() => setShowProductSelector(!showProductSelector)}
          >
            <View style={styles.newPostOptionLeft}>
              <Lucide name="pricetag-outline" size={23} color="#00f5ff" />
              <Text style={[styles.newPostOptionText, { color: "#00f5ff" }]}>
                {productId ? "Product Tagged ✓" : "Tag Product (Affiliate)"}
              </Text>
            </View>
            <Lucide
              name={showProductSelector ? "chevron-down" : "chevron-forward"}
              size={21}
              color="#00f5ff"
            />
          </TouchableOpacity>

          {showProductSelector && (
            <View style={styles.newPostProductList}>
              {productId ? (
                <TouchableOpacity
                  style={[styles.newPostProductItem, { backgroundColor: "rgba(255,60,60,0.1)" }]}
                  onPress={() => {
                    triggerHaptic("light");
                    setProductId("");
                  }}
                >
                  <Text style={[styles.newPostProductName, { color: "#ff3b30" }]}>Remove Product Tag</Text>
                  <Lucide name="close-circle" size={17} color="#ff3b30" />
                </TouchableOpacity>
              ) : null}
              {(products || []).slice(0, 8).map((p: any) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.newPostProductItem, productId === p.id && styles.newPostProductItemActive]}
                  onPress={() => {
                    triggerHaptic("light");
                    setProductId(p.id);
                    setShowProductSelector(false);
                  }}
                >
                  <Text style={styles.newPostProductName} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Text style={styles.newPostProductPrice}>₹{p.price?.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
              {(!products || products.length === 0) && (
                <Text style={styles.newPostProductEmpty}>
                  {"No products available in the sovereign mesh catalog."}
                </Text>
              )}
            </View>
          )}

          <View style={styles.newPostDivider} />

          <TouchableOpacity
            style={styles.newPostOptionRow}
            onPress={() => {
              triggerHaptic("light");
              setShowAudienceSelector(!showAudienceSelector);
            }}
          >
            <View style={styles.newPostOptionLeft}>
              <Lucide name="eye-outline" size={23} color="#fff" />
              <Text style={styles.newPostOptionText}>Audience</Text>
            </View>
            <View style={styles.newPostOptionRight}>
              <Text style={styles.newPostOptionValue}>
                {audience === "everyone"
                  ? "Everyone"
                  : audience === "followers"
                    ? "Followers"
                    : "Close Friends"}
              </Text>
              <Lucide
                name={showAudienceSelector ? "chevron-down" : "chevron-forward"}
                size={21}
                color="rgba(255,255,255,0.3)"
              />
            </View>
          </TouchableOpacity>

          {showAudienceSelector && (
            <View style={styles.newPostProductList}>
              {(
                [
                  { key: "everyone" as const, label: "Everyone", icon: "globe-outline" as const },
                  { key: "followers" as const, label: "Followers Only", icon: "people-outline" as const },
                  { key: "close_friends" as const, label: "Close Friends", icon: "star-outline" as const },
                ] as const
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.newPostProductItem, audience === opt.key && styles.newPostProductItemActive]}
                  onPress={() => {
                    triggerHaptic("light");
                    setAudience(opt.key);
                    setShowAudienceSelector(false);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Lucide
                      name={opt.icon}
                      size={19}
                      color={audience === opt.key ? "#00f5ff" : "#fff"}
                    />
                    <Text
                      style={[styles.newPostProductName, audience === opt.key ? { color: "#00f5ff" } : {}]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  {audience === opt.key && <Lucide name="checkmark" size={19} color="#00f5ff" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.newPostDivider} />

          <View style={styles.newPostOptionRow}>
            <View style={styles.newPostOptionLeft}>
              <Lucide name="share-outline" size={23} color="#fff" />
              <Text style={styles.newPostOptionText}>Also share on AURA Feed</Text>
            </View>
            <TouchableOpacity
              style={[styles.newPostToggle, shareFeed && styles.newPostToggleActive]}
              onPress={() => {
                triggerHaptic("light");
                setShareFeed(!shareFeed);
              }}
            >
              <View style={[styles.newPostToggleThumb, shareFeed && styles.newPostToggleThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.newPostDivider} />

          <TouchableOpacity
            style={styles.newPostOptionRow}
            onPress={() => {
              triggerHaptic("light");
              setShowAdvancedOptions(!showAdvancedOptions);
            }}
          >
            <View style={styles.newPostOptionLeft}>
              <Lucide
                name="ellipsis-horizontal"
                size={23}
                color={showAdvancedOptions ? "#00f5ff" : "#fff"}
              />
              <Text style={[styles.newPostOptionText, showAdvancedOptions ? { color: "#00f5ff" } : {}]}>
                More options
              </Text>
            </View>
            <Lucide
              name={showAdvancedOptions ? "chevron-down" : "chevron-forward"}
              size={21}
              color={showAdvancedOptions ? "#00f5ff" : "rgba(255,255,255,0.3)"}
            />
          </TouchableOpacity>

          {showAdvancedOptions && (
            <View style={styles.advancedOptionsContainer}>
              <View style={styles.newPostOptionRow}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="chatbox-ellipses-outline" size={23} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.newPostOptionText}>Allow Comments</Text>
                    <Text style={styles.newPostOptionSub}>Let other users comment on this curation.</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.newPostToggle, commentsEnabled && styles.newPostToggleActive]}
                  onPress={() => {
                    triggerHaptic("light");
                    setCommentsEnabled(!commentsEnabled);
                  }}
                >
                  <View
                    style={[styles.newPostToggleThumb, commentsEnabled && styles.newPostToggleThumbActive]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.newPostDivider} />

              <View style={styles.newPostOptionRow}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="heart-dislike-outline" size={23} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.newPostOptionText}>Hide Likes and Views</Text>
                    <Text style={styles.newPostOptionSub}>
                      Only you will see the total number of likes and views.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.newPostToggle, likesHidden && styles.newPostToggleActive]}
                  onPress={() => {
                    triggerHaptic("light");
                    setLikesHidden(!likesHidden);
                  }}
                >
                  <View style={[styles.newPostToggleThumb, likesHidden && styles.newPostToggleThumbActive]} />
                </TouchableOpacity>
              </View>

              <View style={styles.newPostDivider} />

              <View style={styles.newPostOptionRow}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="globe-outline" size={23} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.newPostOptionText}>Cross-Post (Federated)</Text>
                    <Text style={styles.newPostOptionSub}>Syndicate instantly to linked luxury platforms.</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.newPostToggle, crossPostEnabled && styles.newPostToggleActive]}
                  onPress={() => {
                    triggerHaptic("light");
                    setCrossPostEnabled(!crossPostEnabled);
                  }}
                >
                  <View
                    style={[styles.newPostToggleThumb, crossPostEnabled && styles.newPostToggleThumbActive]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.newPostDivider} />

              <View style={styles.newPostOptionRow}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="download-outline" size={23} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.newPostOptionText}>Allow Downloads</Text>
                    <Text style={styles.newPostOptionSub}>
                      Let other collectors download this curation to local nodes.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.newPostToggle, allowDownload && styles.newPostToggleActive]}
                  onPress={() => {
                    triggerHaptic("light");
                    setAllowDownload(!allowDownload);
                  }}
                >
                  <View
                    style={[styles.newPostToggleThumb, allowDownload && styles.newPostToggleThumbActive]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.newPostDivider} />

              <View style={styles.newPostOptionRow}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="trending-up-outline" size={23} color="#00f5ff" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.newPostOptionText, { color: "#00f5ff" }]}>Promote Reel (Boost)</Text>
                    <Text style={styles.newPostOptionSub}>
                      Enhance algorithmic visibility using affiliate ad-spend.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.newPostToggle, promoteReel && styles.newPostToggleActive]}
                  onPress={() => {
                    triggerHaptic("light");
                    setPromoteReel(!promoteReel);
                  }}
                >
                  <View style={[styles.newPostToggleThumb, promoteReel && styles.newPostToggleThumbActive]} />
                </TouchableOpacity>
              </View>

              <View style={styles.newPostDivider} />

              <View style={styles.newPostOptionRow}>
                <View style={styles.newPostOptionLeft}>
                  <Lucide name="time-outline" size={23} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.newPostOptionText}>Schedule Post</Text>
                    <Text style={styles.newPostOptionSub}>
                      Publish automatically at a future synchronized timestamp.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.newPostToggle, isScheduled && styles.newPostToggleActive]}
                  onPress={() => {
                    triggerHaptic("light");
                    setIsScheduled(!isScheduled);
                  }}
                >
                  <View style={[styles.newPostToggleThumb, isScheduled && styles.newPostToggleThumbActive]} />
                </TouchableOpacity>
              </View>

              {isScheduled && (
                <View style={styles.newPostInlineInput}>
                  <Lucide name="alarm-outline" size={19} color="#00f5ff" />
                  <TextInput
                    style={styles.newPostInlineTextInput}
                    placeholder="Set posting time (e.g. 06:00 PM)"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={scheduledTime}
                    onChangeText={setScheduledTime}
                  />
                </View>
              )}
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={styles.newPostShareBtnWrap}>
          <TouchableOpacity
            style={[styles.newPostShareBtn, isPublishing && { opacity: 0.5 }]}
            onPress={onShare}
            disabled={isPublishing}
            activeOpacity={0.8}
          >
            {isPublishing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.newPostShareBtnText}>Share</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

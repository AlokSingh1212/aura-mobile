import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { parseCollabInviteAttachment } from "@/lib/collabMessage";
import { respondToCollabWithConfirmation } from "@/lib/collabApi";
import { parseProductCollabInviteAttachment } from "@/lib/productCollabMessage";
import { respondProductCollabWithConfirmation } from "@/lib/productCollabApi";
import { parseBrandPartnershipInviteAttachment } from "@/lib/brandPartnershipMessage";
import {
  respondBrandPartnershipWithConfirmation,
  partnershipTypeLabel,
} from "@/lib/brandPartnershipApi";
import { AudioMessagePlayer } from "@/components/chat/AudioMessagePlayer";
import { chatDrawerStyles as styles } from "@/components/chat/chatDrawerStyles";

export type ChatMessageContentProps = {
  content: string;
  isMine: boolean;
  currentUserId: string;
  activeProfile: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

export function ChatMessageContent({
  content,
  isMine,
  currentUserId,
  activeProfile,
  triggerHaptic,
}: ChatMessageContentProps) {
  const router = useRouter();

  const brandPartnershipInvite = parseBrandPartnershipInviteAttachment(content);
  if (brandPartnershipInvite) {
    const canRespond =
      !isMine &&
      brandPartnershipInvite.status === "pending" &&
      brandPartnershipInvite.creatorProfileId === activeProfile?.id;
    return (
      <View style={styles.collabInviteCard}>
        {brandPartnershipInvite.brandLogo ? (
          <Image source={{ uri: brandPartnershipInvite.brandLogo }} style={styles.collabInviteThumb} />
        ) : (
          <View
            style={[
              styles.collabInviteThumb,
              { backgroundColor: "#818cf822", alignItems: "center", justifyContent: "center" },
            ]}
          >
            <Lucide name="briefcase-outline" size={28} color="#818cf8" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.collabInviteTitle}>Brand partnership</Text>
          <Text style={styles.collabInviteSub} numberOfLines={2}>
            {brandPartnershipInvite.title} · ₹
            {Math.round(brandPartnershipInvite.budget).toLocaleString("en-IN")}
          </Text>
          <Text style={styles.collabInviteSub} numberOfLines={1}>
            {brandPartnershipInvite.brandName} · {partnershipTypeLabel(brandPartnershipInvite.dealType)}
          </Text>
          {brandPartnershipInvite.status === "accepted" ? (
            <Text style={styles.collabInviteStatusOk}>Active · escrow locked</Text>
          ) : brandPartnershipInvite.status === "completed" ? (
            <Text style={styles.collabInviteStatusOk}>Completed</Text>
          ) : brandPartnershipInvite.status === "declined" ? (
            <Text style={styles.collabInviteStatusNo}>Declined</Text>
          ) : canRespond ? (
            <View style={styles.collabInviteActions}>
              <TouchableOpacity
                style={styles.collabInviteAcceptBtn}
                onPress={async () => {
                  if (!currentUserId || !activeProfile?.id) return;
                  const result = await respondBrandPartnershipWithConfirmation({
                    userId: currentUserId,
                    profileId: activeProfile.id,
                    dealId: brandPartnershipInvite.dealId,
                    respondAction: "accept",
                  });
                  if (result.success) triggerHaptic("success");
                }}
              >
                <Text style={styles.collabInviteAcceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.collabInviteDeclineBtn}
                onPress={async () => {
                  if (!currentUserId || !activeProfile?.id) return;
                  await respondBrandPartnershipWithConfirmation({
                    userId: currentUserId,
                    profileId: activeProfile.id,
                    dealId: brandPartnershipInvite.dealId,
                    respondAction: "decline",
                  });
                }}
              >
                <Text style={styles.collabInviteDeclineText}>Decline</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.collabInvitePending}>Pending</Text>
          )}
        </View>
      </View>
    );
  }

  const productCollabInvite = parseProductCollabInviteAttachment(content);
  if (productCollabInvite) {
    const canRespond =
      !isMine &&
      productCollabInvite.status === "pending" &&
      ((productCollabInvite.initiator === "BRAND" &&
        productCollabInvite.creatorProfileId === activeProfile?.id) ||
        (productCollabInvite.initiator === "CREATOR" && activeProfile?.type === "BUSINESS"));
    return (
      <View style={styles.collabInviteCard}>
        <Image source={{ uri: productCollabInvite.productImage }} style={styles.collabInviteThumb} />
        <View style={{ flex: 1 }}>
          <Text style={styles.collabInviteTitle}>Product collab</Text>
          <Text style={styles.collabInviteSub} numberOfLines={2}>
            {productCollabInvite.productTitle} · {productCollabInvite.commissionRate}% commission
          </Text>
          <Text style={styles.collabInviteSub} numberOfLines={1}>
            {productCollabInvite.brandName}
          </Text>
          {productCollabInvite.status === "accepted" ? (
            <Text style={styles.collabInviteStatusOk}>
              Live {productCollabInvite.affiliateCode ? `· ${productCollabInvite.affiliateCode}` : ""}
            </Text>
          ) : productCollabInvite.status === "declined" ? (
            <Text style={styles.collabInviteStatusNo}>Declined</Text>
          ) : canRespond ? (
            <View style={styles.collabInviteActions}>
              <TouchableOpacity
                style={styles.collabInviteAcceptBtn}
                onPress={async () => {
                  if (!currentUserId || !activeProfile?.id) return;
                  const result = await respondProductCollabWithConfirmation({
                    userId: currentUserId,
                    profileId: activeProfile.id,
                    collabId: productCollabInvite.collabId,
                    respondAction: "accept",
                  });
                  if (result.success) triggerHaptic("success");
                }}
              >
                <Text style={styles.collabInviteAcceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.collabInviteDeclineBtn}
                onPress={async () => {
                  if (!currentUserId || !activeProfile?.id) return;
                  await respondProductCollabWithConfirmation({
                    userId: currentUserId,
                    profileId: activeProfile.id,
                    collabId: productCollabInvite.collabId,
                    respondAction: "decline",
                  });
                }}
              >
                <Text style={styles.collabInviteDeclineText}>Decline</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.collabInvitePending}>Pending</Text>
          )}
        </View>
      </View>
    );
  }

  const collabInvite = parseCollabInviteAttachment(content);
  if (collabInvite) {
    const isInvitee =
      !isMine &&
      collabInvite.inviteeProfileId === activeProfile?.id &&
      collabInvite.status === "pending";
    return (
      <View style={styles.collabInviteCard}>
        <Image source={{ uri: collabInvite.thumbnail }} style={styles.collabInviteThumb} />
        <View style={{ flex: 1 }}>
          <Text style={styles.collabInviteTitle}>
            {collabInvite.mediaType === "reel" ? "Reel collab invite" : "Post collab invite"}
          </Text>
          <Text style={styles.collabInviteSub} numberOfLines={2}>
            @{collabInvite.authorUsername} invited you to collab
            {collabInvite.caption ? ` · "${collabInvite.caption.slice(0, 60)}"` : ""}
          </Text>
          {collabInvite.status === "accepted" ? (
            <Text style={styles.collabInviteStatusOk}>Accepted</Text>
          ) : collabInvite.status === "declined" ? (
            <Text style={styles.collabInviteStatusNo}>Declined</Text>
          ) : isInvitee ? (
            <View style={styles.collabInviteActions}>
              <TouchableOpacity
                style={styles.collabInviteAcceptBtn}
                onPress={async () => {
                  if (!currentUserId || !activeProfile?.id) return;
                  triggerHaptic("medium");
                  const result = await respondToCollabWithConfirmation({
                    postId: collabInvite.postId,
                    userId: currentUserId,
                    profileId: activeProfile.id,
                    action: "accept",
                  });
                  if (result.success) {
                    triggerHaptic("success");
                    Alert.alert("Collab accepted", "This post will appear on your profile.");
                  }
                }}
              >
                <Text style={styles.collabInviteAcceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.collabInviteDeclineBtn}
                onPress={async () => {
                  if (!currentUserId || !activeProfile?.id) return;
                  triggerHaptic("light");
                  await respondToCollabWithConfirmation({
                    postId: collabInvite.postId,
                    userId: currentUserId,
                    profileId: activeProfile.id,
                    action: "decline",
                  });
                }}
              >
                <Text style={styles.collabInviteDeclineText}>Decline</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.collabInvitePending}>Pending</Text>
          )}
        </View>
      </View>
    );
  }

  if (content.startsWith("[ATTACHMENT:AUDIO]")) {
    const uri = content.replace("[ATTACHMENT:AUDIO]", "");
    return <AudioMessagePlayer uri={uri} isMine={isMine} />;
  }
  if (content.startsWith("[ATTACHMENT:GIF]")) {
    const uri = content.replace("[ATTACHMENT:GIF]", "");
    return (
      <View style={styles.msgImageContainer}>
        <Image source={{ uri }} style={styles.msgGif} contentFit="cover" />
      </View>
    );
  }
  if (content.startsWith("[ATTACHMENT:IMAGE]")) {
    const uri = content.replace("[ATTACHMENT:IMAGE]", "");
    return (
      <View style={styles.msgImageContainer}>
        <Image source={{ uri }} style={styles.msgImage} />
      </View>
    );
  }
  if (content.startsWith("[ATTACHMENT:LOCATION]")) {
    const url = content.replace("[ATTACHMENT:LOCATION]", "");
    return (
      <TouchableOpacity
        style={styles.msgLocationContainer}
        onPress={async () => {
          triggerHaptic("light");
          const WebBrowser = require("expo-web-browser");
          await WebBrowser.openBrowserAsync(url);
        }}
      >
        <Lucide name="map-outline" size={20} color="#00f5ff" />
        <Text style={styles.msgLocationText}>View Shared Location Pin</Text>
      </TouchableOpacity>
    );
  }
  if (content.startsWith("[ATTACHMENT:PRODUCT]")) {
    try {
      const product = JSON.parse(content.replace("[ATTACHMENT:PRODUCT]", ""));
      return (
        <TouchableOpacity
          style={styles.msgProductCard}
          onPress={() => {
            triggerHaptic("light");
            router.push(`/product/${product.id}` as any);
          }}
        >
          <Image source={{ uri: product.image }} style={styles.msgProductImage} />
          <View style={{ flex: 1, paddingLeft: 10 }}>
            <Text style={styles.msgProductName} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={styles.msgProductPrice}>₹{parseFloat(product.price).toLocaleString()}</Text>
            <TouchableOpacity
              style={styles.msgProductBuyBtn}
              onPress={() => {
                triggerHaptic("success");
                Alert.alert("Direct Order", `Instant checkout initiated for ${product.name}!`);
              }}
            >
              <Text style={styles.msgProductBuyText}>Order Now</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    } catch {
      return (
        <Text style={[styles.msgText, isMine ? styles.msgTextRight : styles.msgTextLeft]}>
          [Broken Product Card]
        </Text>
      );
    }
  }

  const postMatch = content.match(/(?:https:\/\/aura\.app)?\/post\/([a-zA-Z0-9_\-]+)/i);
  const reelMatch = content.match(/(?:https:\/\/aura\.app)?\/reel\/([a-zA-Z0-9_\-]+)/i);
  const productMatch = content.match(/(?:https:\/\/aura\.app)?\/product\/([a-zA-Z0-9_\-]+)/i);
  const profileMatch = content.match(/(?:https:\/\/aura\.app)?\/profile\/([a-zA-Z0-9_\-]+)/i);
  const maisonMatch = content.match(/(?:https:\/\/aura\.app)?\/maison\/([a-zA-Z0-9_\-]+)/i);

  if (postMatch || reelMatch || productMatch || profileMatch || maisonMatch) {
    let icon = "document-text-outline";
    let title = "Shared Post";
    let routePath = "";

    if (postMatch) {
      icon = "image-outline";
      title = "Shared Post";
      routePath = `/post/${postMatch[1]}`;
    } else if (reelMatch) {
      icon = "film-outline";
      title = "Shared Reel";
      routePath = `/reel/${reelMatch[1]}`;
    } else if (productMatch) {
      icon = "gift-outline";
      title = "Shared Product";
      routePath = `/product/${productMatch[1]}`;
    } else if (profileMatch) {
      icon = "person-outline";
      title = "Shared Profile";
      routePath = `/profile/${profileMatch[1]}`;
    } else if (maisonMatch) {
      icon = "storefront-outline";
      title = "Shared Maison Store";
      routePath = `/maison/${maisonMatch[1]}`;
    }

    return (
      <TouchableOpacity
        style={{
          backgroundColor: "rgba(255,255,255,0.06)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: 12,
          minWidth: 200,
          maxWidth: 280,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginVertical: 4,
        }}
        onPress={() => {
          triggerHaptic("medium");
          router.push(routePath as any);
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(0, 245, 255, 0.1)",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(0, 245, 255, 0.2)",
          }}
        >
          <Lucide name={icon as any} size={20} color="#00f5ff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "bold" }}>{title}</Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }} numberOfLines={1}>
            {content.split("\n")[0]}
          </Text>
        </View>
        <Lucide name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
      </TouchableOpacity>
    );
  }

  return (
    <Text style={[styles.msgText, isMine ? styles.msgTextRight : styles.msgTextLeft]}>{content}</Text>
  );
}

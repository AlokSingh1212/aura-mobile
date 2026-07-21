import { useMemo } from "react";
import { filterSocialMediaItems } from "@/lib/feedSocialFilter";
import { filterContentItems } from "@/lib/settingsEnforcement";
import { isPersonalizedAdsEnabled } from "@/lib/settingsRuntime";
import { isReelFeedItem, isReelVideoUrl } from "@/lib/reelMedia";

type UseHomeReelsFeedOptions = {
  feedItems: any[];
  stories: any[];
  localReels: any[];
  reelsSponsoredAd: any;
  tappedReelItem: any;
  socialGraph: any;
  socialGraphVersion: number;
  activeProfileId?: string;
  currentUserId?: string;
};

export function useHomeReelsFeed({
  feedItems,
  stories,
  localReels,
  reelsSponsoredAd,
  tappedReelItem,
  socialGraph,
  socialGraphVersion,
  activeProfileId,
  currentUserId,
}: UseHomeReelsFeedOptions) {
  const displayStories = useMemo(() => {
    const feedReels = feedItems
      .filter((item: any) => isReelFeedItem(item))
      .map((item: any) => ({
        id: item.id,
        url:
          item.content?.videoUrl ||
          item.content?.mediaUrl ||
          item.sponsoredMetadata?.creativeMediaUrl ||
          "",
        caption: item.content?.caption || item.caption || item.sponsoredMetadata?.ctaText || "",
        creator: item.creator,
        profile: item.creator
          ? {
              name: item.creator.name,
              username: item.creator.username,
              logo: item.creator.avatar,
              id: item.creator.id,
            }
          : item.profile,
        user: item.creator,
        music: item.music || "AURA Original Sound",
        likesCount: item.content?.likesCount || 0,
        likes: item.content?.likesCount || 0,
        commentsCount: item.content?.commentsCount || 0,
        comments: item.comments || [],
        isVideo: true,
        product: item.product,
        type: item.type,
        sponsoredMetadata: item.sponsoredMetadata,
        content: item.content,
        photoTags: item.photoTags || item.content?.photoTags || [],
        collab: item.collab || item.content?.collab || null,
        productStickers: item.productStickers || item.content?.productStickers || [],
        location: item.location || item.content?.location,
        aiLabel: item.aiLabel || item.content?.aiLabel,
      }))
      .filter((item: any) => isReelVideoUrl(item.url));

    const apiStoryReels = stories.filter(
      (s: any) =>
        s.music !== "STORY_ONLY" &&
        isReelVideoUrl(s.url) &&
        (s.isVideo === true || isReelVideoUrl(s.url))
    );

    const baseStories = [
      ...localReels.filter((r) => isReelVideoUrl(r.url)),
      ...apiStoryReels,
    ];

    const combined = [...baseStories];
    feedReels.forEach((fr) => {
      if (fr.url && !combined.some((s) => s.id === fr.id || s.url === fr.url)) {
        combined.push(fr);
      }
    });

    if (reelsSponsoredAd && isPersonalizedAdsEnabled()) {
      const reelsAdItem = {
        id: reelsSponsoredAd.id,
        url:
          reelsSponsoredAd.content?.videoUrl ||
          reelsSponsoredAd.content?.mediaUrl ||
          reelsSponsoredAd.sponsoredMetadata?.creativeMediaUrl ||
          "",
        caption: reelsSponsoredAd.content?.caption || reelsSponsoredAd.sponsoredMetadata?.ctaText || "",
        creator: reelsSponsoredAd.creator,
        music: "Sponsored",
        likes: 0,
        commentsCount: 0,
        comments: [],
        isVideo: true,
        product: reelsSponsoredAd.product,
        type: "SPONSORED_AD",
        sponsoredMetadata: reelsSponsoredAd.sponsoredMetadata,
      };
      if (!combined.some((s) => s.id === reelsAdItem.id)) {
        combined.unshift(reelsAdItem);
      }
    }

    if (tappedReelItem) {
      const existsIndex = combined.findIndex((s) => s.id === tappedReelItem.id);
      if (existsIndex === -1) {
        combined.unshift({
          id: tappedReelItem.id,
          url: tappedReelItem.content?.videoUrl || tappedReelItem.content?.mediaUrl || "",
          caption: tappedReelItem.content?.caption || "",
          creator: tappedReelItem.creator,
          music: "AURA Original Sound",
          likes: tappedReelItem.content?.likesCount || 0,
          commentsCount: tappedReelItem.content?.commentsCount || 0,
          comments: tappedReelItem.comments || [],
          isVideo: true,
          product: tappedReelItem.product,
        });
      }
    }

    return filterContentItems(
      filterSocialMediaItems(
        combined,
        socialGraph || {
          blocked: [],
          muted: [],
          closeFriends: [],
          favorites: [],
          archived: [],
          hiddenPostIds: [],
        },
        activeProfileId
      )
    );
  }, [
    tappedReelItem,
    localReels,
    stories,
    feedItems,
    reelsSponsoredAd,
    currentUserId,
    socialGraph,
    socialGraphVersion,
    activeProfileId,
  ]);

  return { displayStories };
}

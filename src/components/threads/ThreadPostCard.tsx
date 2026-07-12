import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Lucide from "@expo/vector-icons/Ionicons";
import { THREADS_THEME as T } from "@/constants/threadsTheme";
import type { ThreadPostDto } from "@/lib/threadsApi";

type Props = {
  item: ThreadPostDto;
  showThreadLine?: boolean;
  isLastInChain?: boolean;
  onLike: (id: string) => void;
  onRepost: (id: string) => void;
  onReply: (id: string) => void;
  onPress?: (id: string) => void;
  triggerHaptic: (type: "light" | "medium" | "success") => void;
};

function Avatar({ author }: { author: ThreadPostDto["author"] }) {
  const initial = (author.username || author.name || "?").charAt(0).toUpperCase();
  if (author.avatarUrl) {
    return <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />;
  }
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
}

export function ThreadPostCard({
  item,
  showThreadLine = true,
  isLastInChain = false,
  onLike,
  onRepost,
  onReply,
  onPress,
  triggerHaptic,
}: Props) {
  const router = useRouter();

  const handleShare = async () => {
    triggerHaptic("light");
    try {
      await Share.share({
        message: `@${item.author.username}: ${item.content}`,
      });
    } catch {
      /* cancelled */
    }
  };

  const openProduct = (productId: string) => {
    triggerHaptic("medium");
    router.push(`/product/${productId}` as any);
  };

  const openProfile = () => {
    triggerHaptic("light");
    router.push(`/profile/${item.author.username}` as any);
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={() => onPress?.(item.id)}
      style={styles.row}
    >
      <View style={styles.leftCol}>
        <TouchableOpacity onPress={openProfile}>
          <Avatar author={item.author} />
        </TouchableOpacity>
        {showThreadLine && !isLastInChain ? <View style={styles.threadLine} /> : null}
        {showThreadLine && item.repliers.length > 0 ? (
          <View style={styles.repliersGroup}>
            {item.repliers.slice(0, 3).map((r, idx) => (
              <View
                key={`${r}-${idx}`}
                style={[
                  styles.miniReplier,
                  idx === 1 && { marginLeft: -6, marginTop: 10 },
                  idx === 2 && { marginLeft: 8, marginTop: 4 },
                ]}
              >
                <Text style={styles.miniReplierText}>{r}</Text>
              </View>
            ))}
          </View>
        ) : showThreadLine ? (
          <View style={styles.emptyDot} />
        ) : null}
      </View>

      <View style={styles.rightCol}>
        <View style={styles.metaRow}>
          <TouchableOpacity style={styles.nameRow} onPress={openProfile}>
            <Text style={styles.username}>@{item.author.username}</Text>
            {(item.author.isElite || item.author.isVerified) && (
              <View style={styles.badge}>
                <Lucide name="shield-checkmark" size={10} color={T.bg} />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.metaRight}>
            <Text style={styles.time}>{item.timestamp}</Text>
          </View>
        </View>

        {item.repostOf ? (
          <View style={styles.repostBanner}>
            <Lucide name="repeat" size={12} color={T.textMuted} />
            <Text style={styles.repostLabel}>Reposted</Text>
          </View>
        ) : null}

        {item.content ? <Text style={styles.content}>{item.content}</Text> : null}

        {item.repostOf ? (
          <View style={styles.embedded}>
            <Text style={styles.embeddedUser}>@{item.repostOf.author.username}</Text>
            <Text style={styles.embeddedContent} numberOfLines={4}>
              {item.repostOf.content}
            </Text>
          </View>
        ) : null}

        {item.mediaUrls?.length ? (
          <View style={styles.mediaRow}>
            {item.mediaUrls.slice(0, 4).map((url) => (
              <Image key={url} source={{ uri: url }} style={styles.mediaThumb} />
            ))}
          </View>
        ) : null}

        {(item.product || item.repostOf?.product) && (
          <TouchableOpacity
            style={styles.productBox}
            activeOpacity={0.9}
            onPress={() => openProduct((item.product || item.repostOf?.product)!.id)}
          >
            {(item.product || item.repostOf?.product)?.image ? (
              <Image
                source={{ uri: (item.product || item.repostOf?.product)!.image! }}
                style={styles.productImage}
              />
            ) : null}
            <View style={styles.productDetails}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {(item.product || item.repostOf?.product)!.title}
              </Text>
              <Text style={styles.productPrice}>
                {(item.product || item.repostOf?.product)!.priceLabel}
              </Text>
            </View>
            <View style={styles.acquireBtn}>
              <Text style={styles.acquireText}>SHOP</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(item.id)}>
            <Lucide
              name={item.liked ? "heart" : "heart-outline"}
              size={19}
              color={item.liked ? T.like : T.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onReply(item.id)}>
            <Lucide name="chatbubble-outline" size={17} color={T.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onRepost(item.id)}>
            <Lucide
              name="repeat-outline"
              size={18}
              color={item.reposted ? T.primary : T.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Lucide name="paper-plane-outline" size={17} color={T.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          {item.repliesCount > 0 && (
            <Text style={styles.statText}>{item.repliesCount} replies</Text>
          )}
          {item.repliesCount > 0 && item.likesCount > 0 && (
            <Text style={styles.statDot}>·</Text>
          )}
          {item.likesCount > 0 && (
            <Text style={styles.statText}>{item.likesCount} likes</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: T.bg,
  },
  leftCol: {
    width: 46,
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: T.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  threadLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: T.borderSubtle,
    marginVertical: 8,
    minHeight: 24,
  },
  repliersGroup: {
    width: 24,
    height: 24,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  miniReplier: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: T.surfaceElevated,
    borderWidth: 1,
    borderColor: T.bg,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  miniReplierText: {
    color: T.textMuted,
    fontSize: 7,
    fontWeight: "700",
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.borderSubtle,
    marginBottom: 4,
  },
  rightCol: {
    flex: 1,
    marginLeft: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  username: {
    color: T.text,
    fontSize: 13,
    fontWeight: "600",
  },
  badge: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  time: {
    color: T.textMuted,
    fontSize: 12,
  },
  repostBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  repostLabel: {
    color: T.textMuted,
    fontSize: 11,
  },
  content: {
    color: T.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  embedded: {
    borderWidth: 1,
    borderColor: T.borderSubtle,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: T.surface,
  },
  embeddedUser: {
    color: T.text,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  embeddedContent: {
    color: T.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  mediaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  mediaThumb: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: T.surface,
  },
  productBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    padding: 8,
    marginBottom: 10,
  },
  productImage: {
    width: 46,
    height: 46,
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
    marginLeft: 10,
  },
  productTitle: {
    color: T.text,
    fontSize: 12,
    fontWeight: "700",
  },
  productPrice: {
    color: T.primary,
    fontSize: 11,
    marginTop: 2,
  },
  acquireBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: T.primaryMuted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  acquireText: {
    color: T.primary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 2,
    marginBottom: 6,
  },
  actionBtn: {
    paddingVertical: 4,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    color: T.textMuted,
    fontSize: 11,
  },
  statDot: {
    color: T.textMuted,
    fontSize: 10,
  },
});

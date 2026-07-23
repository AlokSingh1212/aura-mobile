import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
} from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";
import { CaptionText } from "@/components/CaptionText";
import { homeModalStyles as modalStyles } from "@/components/home/homeModalStyles";
import { useA11yProps } from "@/hooks/useA11yProps";
import { Avatar } from "@/components/ui/Avatar";
import { useStore } from "@/store/useStore";

type ReplyTarget = { commentId: string; username: string } | null;

type HomeFeedCommentsModalProps = {
  visible: boolean;
  targetPost: any;
  sheetHeight: number;
  bottomInset: number;
  currentMaisonName: string;
  postComments: any[];
  likedComments: Record<string, boolean>;
  commentLikeCounts: Record<string, number>;
  expandedComments: Record<string, boolean>;
  newCommentText: string;
  replyingTo: ReplyTarget;
  commentInputRef: React.RefObject<TextInput | null>;
  triggerHaptic: (style: "light" | "medium" | "success") => void;
  onClose: () => void;
  onSubmitComment: () => void;
  onOpenProfile: (username: string) => void;
  setNewCommentText: (text: string) => void;
  setReplyingTo: (target: ReplyTarget) => void;
  setLikedComments: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setCommentLikeCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setExpandedComments: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

export function HomeFeedCommentsModal({
  visible,
  targetPost,
  sheetHeight,
  bottomInset,
  currentMaisonName,
  postComments,
  likedComments,
  commentLikeCounts,
  expandedComments,
  newCommentText,
  replyingTo,
  commentInputRef,
  triggerHaptic,
  onClose,
  onSubmitComment,
  onOpenProfile,
  setNewCommentText,
  setReplyingTo,
  setLikedComments,
  setCommentLikeCounts,
  setExpandedComments,
}: HomeFeedCommentsModalProps) {
  const { a11yProps } = useA11yProps();
  const { activeProfile, currentUser } = useStore();
  const avatarUri = activeProfile?.avatar || activeProfile?.logo || currentUser?.avatar || null;
  const avatarInitial = (activeProfile?.name || currentUser?.name || "A")[0]?.toUpperCase();

  if (!targetPost) return null;
  return (
      
        <Modal
          visible={visible}
          transparent
          animationType="slide"
          onRequestClose={onClose}
        >
          <View style={modalStyles.commentsOverlayBackdrop}>
            <TouchableOpacity 
              style={{ flex: 1 }} 
              activeOpacity={1} 
              onPress={() => onClose()}
            />
            
            <View style={[modalStyles.commentsSheetContent, { height: sheetHeight }]}>
              {/* Drag Handle */}
              <View style={modalStyles.bottomSheetDragHandle} />
              
              {/* Header */}
              <View style={modalStyles.commentsHeaderRow}>
                <Text style={modalStyles.commentsHeaderTitle}>Comments</Text>
                <TouchableOpacity onPress={() => onClose()}>
                  <Lucide name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {/* Comments list */}
              <ScrollView 
                style={modalStyles.commentsScroll}
                contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
              >
                {/* Author original post caption as the pinned first comment */}
                {(() => {
                  const authorUsername = (targetPost.profile?.name || targetPost.user?.name || currentMaisonName).toLowerCase().replace(/\s+/g, "");
                  const authorCommentId = `${targetPost.id}_author`;
                  const isAuthorLiked = likedComments[authorCommentId] || false;
                  const authorLikeCount = commentLikeCounts[authorCommentId] || 0;

                  return (
                    <View style={modalStyles.commentRow}>
                      <TouchableOpacity 
                        onPress={() => {
                          const authorName = targetPost.profile?.name || targetPost.user?.name || currentMaisonName;
                          onOpenProfile(authorName);
                        }}
                        activeOpacity={0.85}
                      >
                        <Avatar
                          uri={targetPost.profile?.avatar || targetPost.user?.avatar}
                          name={targetPost.profile?.name || targetPost.user?.name || "A"}
                          size={36}
                        />
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>
                        <TouchableOpacity 
                          onPress={() => {
                            const authorName = targetPost.profile?.name || targetPost.user?.name || currentMaisonName;
                            onOpenProfile(authorName);
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={modalStyles.commentUsername}>
                            {authorUsername} <Text style={modalStyles.commentBadge}>Author</Text>
                          </Text>
                        </TouchableOpacity>
                        <CaptionText
                          caption={targetPost.caption || "Atelier Masterpiece Collection."}
                          style={modalStyles.commentTextContent}
                        />
                        
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 }}>
                          <Text style={modalStyles.commentTime}>Pinned • 1d</Text>
                          {authorLikeCount > 0 && (
                            <Text style={[modalStyles.commentTime, { fontWeight: "600" }]}>
                              {authorLikeCount} {authorLikeCount === 1 ? "like" : "likes"}
                            </Text>
                          )}
                          <TouchableOpacity onPress={() => {
                            triggerHaptic("medium");
                            setLikedComments(prev => ({ ...prev, [authorCommentId]: !isAuthorLiked }));
                            setCommentLikeCounts(prev => ({
                              ...prev,
                              [authorCommentId]: (prev[authorCommentId] || 0) + (isAuthorLiked ? -1 : 1)
                            }));
                          }}>
                            <Text style={[modalStyles.commentTime, { fontWeight: "700", color: isAuthorLiked ? "#FF3B30" : "rgba(255,255,255,0.6)" }]}>
                              {isAuthorLiked ? "Liked" : "Like"}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => {
                            triggerHaptic("light");
                            setReplyingTo({ commentId: "author", username: authorUsername });
                            setNewCommentText(`@${authorUsername} `);
                            if (commentInputRef.current) {
                              commentInputRef.current.focus();
                            }
                          }}>
                            <Text style={[modalStyles.commentTime, { fontWeight: "700", color: "rgba(255,255,255,0.6)" }]}>Reply</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => {
                            triggerHaptic("light");
                            Share.share({
                              message: `Caption from @${authorUsername}: "${targetPost.caption || "Atelier Masterpiece Collection."}" on AURA.`,
                            });
                          }}>
                            <Text style={[modalStyles.commentTime, { fontWeight: "700", color: "rgba(255,255,255,0.6)" }]}>Share</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Comment Heart Toggle */}
                      <TouchableOpacity onPress={() => {
                        triggerHaptic("medium");
                        setLikedComments(prev => ({ ...prev, [authorCommentId]: !isAuthorLiked }));
                        setCommentLikeCounts(prev => ({
                          ...prev,
                          [authorCommentId]: (prev[authorCommentId] || 0) + (isAuthorLiked ? -1 : 1)
                        }));
                      }}>
                        <Lucide 
                          name={isAuthorLiked ? "heart" : "heart-outline"} 
                          size={15} 
                          color={isAuthorLiked ? "#FF3B30" : "rgba(255,255,255,0.4)"} 
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })()}
                
                <View style={modalStyles.commentsSeparator} />

                {/* Additional user comments */}
                {(() => {
                  const allComments = postComments || [];
                  const parentComments = allComments.filter((c: any) => !c.parentId);
                  const replies = allComments.filter((c: any) => c.parentId);

                  return parentComments.map((comm: any) => {
                    const commentId = `${targetPost.id}_${comm.id}`;
                    const isCommentLiked = likedComments[commentId] || false;
                    const likeCount = commentLikeCounts[commentId] || 0;
                    const commentReplies = replies.filter((r: any) => r.parentId === comm.id);
                    const isExpanded = expandedComments[commentId] || false;

                    return (
                      <View key={comm.id} style={{ marginBottom: 12 }}>
                        {/* Parent Comment */}
                        <View style={modalStyles.commentRow}>
                          <TouchableOpacity 
                            onPress={() => onOpenProfile(comm.username)}
                            activeOpacity={0.85}
                          >
                            <Avatar
                              uri={comm.avatar || comm.userAvatar || comm.profilePic}
                              name={comm.username || comm.authorName}
                              size={34}
                            />
                          </TouchableOpacity>
                          <View style={{ flex: 1 }}>
                            <TouchableOpacity 
                              onPress={() => onOpenProfile(comm.username)}
                              activeOpacity={0.85}
                            >
                              <Text style={modalStyles.commentUsername}>{comm.username}</Text>
                            </TouchableOpacity>
                            <CaptionText caption={comm.text} style={modalStyles.commentTextContent} />
                            
                            {/* Inline Actions Row (Like, Reply, Share) */}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 }}>
                              <Text style={modalStyles.commentTime}>{comm.time || "now"}</Text>
                              {likeCount > 0 && (
                                <Text style={[modalStyles.commentTime, { fontWeight: "600" }]}>
                                  {likeCount} {likeCount === 1 ? "like" : "likes"}
                                </Text>
                              )}
                              <TouchableOpacity onPress={() => {
                                triggerHaptic("medium");
                                setLikedComments(prev => ({ ...prev, [commentId]: !isCommentLiked }));
                                setCommentLikeCounts(prev => ({
                                  ...prev,
                                  [commentId]: (prev[commentId] || 0) + (isCommentLiked ? -1 : 1)
                                }));
                              }}>
                                <Text style={[modalStyles.commentTime, { fontWeight: "700", color: isCommentLiked ? "#FF3B30" : "rgba(255,255,255,0.6)" }]}>
                                  {isCommentLiked ? "Liked" : "Like"}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => {
                                triggerHaptic("light");
                                setReplyingTo({ commentId: comm.id, username: comm.username });
                                setNewCommentText(`@${comm.username} `);
                                if (commentInputRef.current) {
                                  commentInputRef.current.focus();
                                }
                              }}>
                                <Text style={[modalStyles.commentTime, { fontWeight: "700", color: "rgba(255,255,255,0.6)" }]}>Reply</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => {
                                triggerHaptic("light");
                                Share.share({
                                  message: `Comment from @${comm.username}: "${comm.text}" on AURA.`,
                                });
                              }}>
                                <Text style={[modalStyles.commentTime, { fontWeight: "700", color: "rgba(255,255,255,0.6)" }]}>Share</Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Comment Heart Toggle */}
                          <TouchableOpacity onPress={() => {
                            triggerHaptic("medium");
                            setLikedComments(prev => ({ ...prev, [commentId]: !isCommentLiked }));
                            setCommentLikeCounts(prev => ({
                              ...prev,
                              [commentId]: (prev[commentId] || 0) + (isCommentLiked ? -1 : 1)
                            }));
                          }}>
                            <Lucide 
                              name={isCommentLiked ? "heart" : "heart-outline"} 
                              size={15} 
                              color={isCommentLiked ? "#FF3B30" : "rgba(255,255,255,0.4)"} 
                            />
                          </TouchableOpacity>
                        </View>

                        {/* Accordion / Thread Line Indicator for Replies */}
                        {commentReplies.length > 0 && (
                          <View style={{ marginLeft: 44, marginTop: 4 }}>
                            <TouchableOpacity 
                              style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, paddingVertical: 4 }}
                              onPress={() => {
                                triggerHaptic("light");
                                setExpandedComments(prev => ({
                                  ...prev,
                                  [commentId]: !isExpanded
                                }));
                              }}
                            >
                              <View style={{ width: 24, height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginRight: 8 }} />
                              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "600" }}>
                                {isExpanded ? "Hide replies" : `View replies (${commentReplies.length})`}
                              </Text>
                            </TouchableOpacity>

                            {isExpanded && commentReplies.map((reply: any) => {
                              const replyCommentId = `${targetPost.id}_${reply.id}`;
                              const isReplyLiked = likedComments[replyCommentId] || false;
                              const replyLikeCount = commentLikeCounts[replyCommentId] || 0;

                              return (
                                <View key={reply.id} style={[modalStyles.commentRow, { paddingLeft: 8, marginTop: 4, marginBottom: 8 }]}>
                                  <TouchableOpacity 
                                    onPress={() => onOpenProfile(reply.username)}
                                    activeOpacity={0.85}
                                  >
                                    <Avatar uri={reply.avatar || reply.userAvatar || reply.profilePic} name={reply.username} size={24} />
                                  </TouchableOpacity>
                                  <View style={{ flex: 1 }}>
                                    <TouchableOpacity 
                                      onPress={() => onOpenProfile(reply.username)}
                                      activeOpacity={0.85}
                                    >
                                      <Text style={modalStyles.commentUsername}>{reply.username}</Text>
                                    </TouchableOpacity>
                                    <CaptionText caption={reply.text} style={modalStyles.commentTextContent} />
                                    
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 }}>
                                      <Text style={modalStyles.commentTime}>{reply.time || "now"}</Text>
                                      {replyLikeCount > 0 && (
                                        <Text style={[modalStyles.commentTime, { fontWeight: "600" }]}>
                                          {replyLikeCount} {replyLikeCount === 1 ? "like" : "likes"}
                                        </Text>
                                      )}
                                      <TouchableOpacity onPress={() => {
                                        triggerHaptic("medium");
                                        setLikedComments(prev => ({ ...prev, [replyCommentId]: !isReplyLiked }));
                                        setCommentLikeCounts(prev => ({
                                          ...prev,
                                          [replyCommentId]: (prev[replyCommentId] || 0) + (isReplyLiked ? -1 : 1)
                                        }));
                                      }}>
                                        <Text style={[modalStyles.commentTime, { fontWeight: "700", color: isReplyLiked ? "#FF3B30" : "rgba(255,255,255,0.6)" }]}>
                                          {isReplyLiked ? "Liked" : "Like"}
                                        </Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity onPress={() => {
                                        triggerHaptic("light");
                                        setReplyingTo({ commentId: comm.id, username: reply.username });
                                        setNewCommentText(`@${reply.username} `);
                                        if (commentInputRef.current) {
                                          commentInputRef.current.focus();
                                        }
                                      }}>
                                        <Text style={[modalStyles.commentTime, { fontWeight: "700", color: "rgba(255,255,255,0.6)" }]}>Reply</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity onPress={() => {
                                        triggerHaptic("light");
                                        Share.share({
                                          message: `Comment from @${reply.username}: "${reply.text}" on AURA.`,
                                        });
                                      }}>
                                        <Text style={[modalStyles.commentTime, { fontWeight: "700", color: "rgba(255,255,255,0.6)" }]}>Share</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>

                                  <TouchableOpacity onPress={() => {
                                    triggerHaptic("medium");
                                    setLikedComments(prev => ({ ...prev, [replyCommentId]: !isReplyLiked }));
                                    setCommentLikeCounts(prev => ({
                                      ...prev,
                                      [replyCommentId]: (prev[replyCommentId] || 0) + (isReplyLiked ? -1 : 1)
                                    }));
                                  }}>
                                    <Lucide 
                                      name={isReplyLiked ? "heart" : "heart-outline"} 
                                      size={13} 
                                      color={isReplyLiked ? "#FF3B30" : "rgba(255,255,255,0.4)"} 
                                    />
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  });
                })()}
              </ScrollView>

              {/* Replying target header indicator */}
              {replyingTo && (
                <View style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255,255,255,0.04)"
                }}>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                    Replying to <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>@{replyingTo.username}</Text>
                  </Text>
                  <TouchableOpacity onPress={() => {
                    triggerHaptic("light");
                    setReplyingTo(null);
                    setNewCommentText("");
                  }}>
                    <Lucide name="close-circle" size={16} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Bottom text input row */}
              <View style={[modalStyles.commentsInputRow, { paddingBottom: bottomInset + 8 }]}>
                <Avatar uri={avatarUri} name={avatarInitial} size={32} />
                
                <TextInput
                  ref={commentInputRef}
                  style={modalStyles.commentTextInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={newCommentText}
                  onChangeText={setNewCommentText}
                  onSubmitEditing={onSubmitComment}
                  {...a11yProps("Add a comment", { role: "search" })}
                />

                <TouchableOpacity
                  disabled={!newCommentText.trim()}
                  onPress={onSubmitComment}
                  style={{ paddingLeft: 8 }}
                  {...a11yProps("Post comment", {
                    role: "button",
                    disabled: !newCommentText.trim(),
                  })}
                >
                  <Text style={[
                    modalStyles.commentPostBtnText, 
                    !newCommentText.trim() && { color: "rgba(255,255,255,0.2)" }
                  ]}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
  );
}

import React from "react";
import { PostShareSheet } from "@/components/post/PostShareSheet";
import { PostReshareSheet } from "@/components/post/PostReshareSheet";
import { ReportFlowModal } from "@/components/ReportFlowModal";
import { HomeThreeDotsModal } from "@/components/home/HomeThreeDotsModal";
import { HomeFeedCommentsModal } from "@/components/home/HomeFeedCommentsModal";
import { resolveReshareSourceId } from "@/lib/postRepost";

type ThreeDotsHandlers = {
  onClose: () => void;
  onAboutAccount: () => void;
  onSave: () => void;
  onShare: () => void;
  onCopyLink: () => void;
  onArchive: () => void;
  onInterested: () => void;
  onHidePost: () => void | Promise<void>;
  onMute: () => void | Promise<void>;
  onBlock: () => void;
  onNotInterested: () => void;
  onUnfollow: () => void;
  onReport: () => void;
};

type HomeFeedEngagementModalsProps = {
  sheetHeight: number;
  bottomInset: number;
  currentMaisonName: string;
  isOwnThreeDotsPost: boolean;
  showShareSheet: boolean;
  setShowShareSheet: (show: boolean) => void;
  shareTargetPost: any;
  setShareTargetPost: (post: any) => void;
  shareLink: string | null;
  setShareLink: (link: string | null) => void;
  setShareCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  showReshareSheet: boolean;
  setShowReshareSheet: (show: boolean) => void;
  reshareTargetPost: any;
  setReshareTargetPost: (post: any) => void;
  buildReshareTarget: (post: any) => any;
  setRepostCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  showReportModal: boolean;
  setShowReportModal: (show: boolean) => void;
  reportTargetProfileId: string;
  reportTargetPostId?: string;
  handleReportSubmit: (reason: string, description?: string) => Promise<boolean>;
  showThreeDotsModal: boolean;
  threeDotsHandlers: ThreeDotsHandlers;
  showCommentsModal: boolean;
  setShowCommentsModal: (show: boolean) => void;
  commentsTargetPost: any;
  postComments: Record<string, any[]>;
  likedComments: Record<string, boolean>;
  setLikedComments: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  commentLikeCounts: Record<string, number>;
  setCommentLikeCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  expandedComments: Record<string, boolean>;
  setExpandedComments: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  newCommentText: string;
  setNewCommentText: (text: string) => void;
  replyingTo: { commentId: string; username: string } | null;
  setReplyingTo: (value: { commentId: string; username: string } | null) => void;
  commentInputRef: React.RefObject<any>;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  submitFeedComment: () => void | Promise<void>;
  navigateToUserProfile: (username: string) => void;
};

export function HomeFeedEngagementModals({
  sheetHeight,
  bottomInset,
  currentMaisonName,
  isOwnThreeDotsPost,
  showShareSheet,
  setShowShareSheet,
  shareTargetPost,
  setShareTargetPost,
  shareLink,
  setShareLink,
  setShareCounts,
  showReshareSheet,
  setShowReshareSheet,
  reshareTargetPost,
  setReshareTargetPost,
  buildReshareTarget,
  setRepostCounts,
  showReportModal,
  setShowReportModal,
  reportTargetProfileId,
  reportTargetPostId,
  handleReportSubmit,
  showThreeDotsModal,
  threeDotsHandlers,
  showCommentsModal,
  setShowCommentsModal,
  commentsTargetPost,
  postComments,
  likedComments,
  setLikedComments,
  commentLikeCounts,
  setCommentLikeCounts,
  expandedComments,
  setExpandedComments,
  newCommentText,
  setNewCommentText,
  replyingTo,
  setReplyingTo,
  commentInputRef,
  triggerHaptic,
  submitFeedComment,
  navigateToUserProfile,
}: HomeFeedEngagementModalsProps) {
  return (
    <>
      <PostShareSheet
        visible={showShareSheet}
        onClose={() => {
          setShowShareSheet(false);
          setShareTargetPost(null);
          setShareLink(null);
        }}
        post={
          shareTargetPost
            ? {
                id: shareTargetPost.id,
                caption: shareTargetPost.caption,
                url:
                  shareTargetPost.videoUrl ||
                  shareTargetPost.mediaUrl ||
                  shareTargetPost.thumbnail ||
                  shareTargetPost.url,
                profile: shareTargetPost.profile,
                user: shareTargetPost.user,
              }
            : null
        }
        shareLink={shareLink}
        onShareComplete={(shareCount) => {
          if (!shareTargetPost?.id) return;
          setShareCounts((prev) => ({
            ...prev,
            [shareTargetPost.id]: shareCount ?? (prev[shareTargetPost.id] ?? 0) + 1,
          }));
        }}
      />

      <PostReshareSheet
        visible={showReshareSheet}
        onClose={() => {
          setShowReshareSheet(false);
          setReshareTargetPost(null);
        }}
        target={reshareTargetPost ? buildReshareTarget(reshareTargetPost) : null}
        onComplete={({ repostCount, removed }) => {
          if (!reshareTargetPost || removed) return;
          const sourceId = resolveReshareSourceId(buildReshareTarget(reshareTargetPost));
          if (repostCount != null) {
            setRepostCounts((prev) => ({ ...prev, [sourceId]: repostCount }));
          }
        }}
      />

      <ReportFlowModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetProfileId={reportTargetProfileId}
        postId={reportTargetPostId}
        onSubmitReport={handleReportSubmit}
      />

      <HomeThreeDotsModal
        visible={showThreeDotsModal}
        isOwnPost={isOwnThreeDotsPost}
        {...threeDotsHandlers}
      />

      <HomeFeedCommentsModal
        visible={showCommentsModal}
        targetPost={commentsTargetPost}
        sheetHeight={sheetHeight}
        bottomInset={bottomInset}
        currentMaisonName={currentMaisonName}
        postComments={commentsTargetPost ? postComments[commentsTargetPost.id] || [] : []}
        likedComments={likedComments}
        commentLikeCounts={commentLikeCounts}
        expandedComments={expandedComments}
        newCommentText={newCommentText}
        replyingTo={replyingTo}
        commentInputRef={commentInputRef}
        triggerHaptic={triggerHaptic}
        onClose={() => setShowCommentsModal(false)}
        onSubmitComment={submitFeedComment}
        onOpenProfile={navigateToUserProfile}
        setNewCommentText={setNewCommentText}
        setReplyingTo={setReplyingTo}
        setLikedComments={setLikedComments}
        setCommentLikeCounts={setCommentLikeCounts}
        setExpandedComments={setExpandedComments}
      />
    </>
  );
}

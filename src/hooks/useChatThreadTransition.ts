import { useState, useEffect, useRef, useCallback } from "react";
import { Animated, Dimensions, PanResponder, ScrollView } from "react-native";
import { markMessagesRead, resolveChatScope } from "@/lib/chatEnhancements";

type UseChatThreadTransitionOptions = {
  activeChat: any;
  setActiveChat: (chat: any) => void;
  currentUserId: string;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
  onConversationStateChange?: (active: boolean) => void;
};

export function useChatThreadTransition({
  activeChat,
  setActiveChat,
  currentUserId,
  triggerHaptic,
  onConversationStateChange,
}: UseChatThreadTransitionOptions) {
  const chatTranslateX = useRef(new Animated.Value(Dimensions.get("window").width)).current;
  const [chatScrollEnabled, setChatScrollEnabled] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_evt, gestureState) => {
        return gestureState.x0 < 60 && Math.abs(gestureState.dx) > 5;
      },
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return gestureState.x0 < 60 && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        setChatScrollEnabled(false);
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dx > 0) {
          chatTranslateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        setChatScrollEnabled(true);
        const screenWidth = Dimensions.get("window").width;
        if (gestureState.dx > screenWidth * 0.3 || gestureState.vx > 0.4) {
          triggerHaptic("light");
          Animated.timing(chatTranslateX, {
            toValue: screenWidth,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            onConversationStateChange?.(false);
            setActiveChat(null);
            chatTranslateX.setValue(screenWidth);
          });
        } else {
          Animated.spring(chatTranslateX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        setChatScrollEnabled(true);
        Animated.spring(chatTranslateX, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const closeActiveChat = useCallback(
    (callback?: () => void) => {
      triggerHaptic("light");
      const screenWidth = Dimensions.get("window").width;
      Animated.timing(chatTranslateX, {
        toValue: screenWidth,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onConversationStateChange?.(false);
        setActiveChat(null);
        chatTranslateX.setValue(screenWidth);
        if (callback) callback();
      });
    },
    [chatTranslateX, triggerHaptic, onConversationStateChange, setActiveChat]
  );

  const lastActiveChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeChat) {
      const chatId = activeChat.id;
      const wasDifferent = lastActiveChatIdRef.current !== chatId;
      lastActiveChatIdRef.current = chatId;

      if (wasDifferent) {
        const screenWidth = Dimensions.get("window").width;
        chatTranslateX.setValue(screenWidth);
        setChatScrollEnabled(true);
        Animated.timing(chatTranslateX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(() => {
          onConversationStateChange?.(true);
        });
      }

      const scope = resolveChatScope(activeChat.type);
      if (scope && currentUserId) {
        markMessagesRead({
          userId: currentUserId,
          conversationId: activeChat.id,
          scope,
        }).catch(() => {});
      }
    } else {
      lastActiveChatIdRef.current = null;
    }
  }, [activeChat, chatTranslateX, currentUserId, onConversationStateChange]);

  return {
    chatTranslateX,
    chatScrollEnabled,
    scrollViewRef,
    panHandlers: panResponder.panHandlers,
    closeActiveChat,
  };
}

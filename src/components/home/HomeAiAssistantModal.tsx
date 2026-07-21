import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import Lucide from "@expo/vector-icons/Ionicons";
import { matchProductFromQuery } from "@/lib/catalogSearch";
import { homeAiAssistantStyles as styles } from "@/components/home/homeAiAssistantStyles";

type AiChatMessage = {
  id: string;
  sender: "user" | "ai";
  text: string;
  product?: any;
};

const WELCOME_MESSAGE: AiChatMessage = {
  id: "msg_init",
  sender: "ai",
  text: "Welcome to AURA Conversational Shopping. I am your concierge. Ask me anything, e.g., 'Find oversized hoodies under ₹1500' or 'Show me quiet luxury bags'.",
};

type HomeAiAssistantModalProps = {
  visible: boolean;
  products: any[];
  formatPrice: (price: number) => string;
  onAddToCart: (product: any) => void;
  triggerHaptic: (style: "light" | "medium" | "success") => void;
  onClose: () => void;
  onProductPreview?: (product: any) => void;
};

export function HomeAiAssistantModal({
  visible,
  products,
  formatPrice,
  onAddToCart,
  triggerHaptic,
  onClose,
  onProductPreview,
}: HomeAiAssistantModalProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([WELCOME_MESSAGE]);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [visible, messages.length]);

  const handleSubmit = () => {
    if (!query.trim()) return;
    triggerHaptic("light");
    const trimmed = query.trim();
    setMessages((prev) => [...prev, { id: `user_${Date.now()}`, sender: "user", text: trimmed }]);
    setQuery("");

    setTimeout(() => {
      triggerHaptic("medium");
      const { product: matchedProd, replyText } = matchProductFromQuery(trimmed, products);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: replyText,
          product: matchedProd,
        },
      ]);
    }, 800);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={styles.dismissTouchable} activeOpacity={1} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.notch} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Lucide name="sparkles" size={20} color="#00f5ff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Aura AI Concierge</Text>
                <Text style={styles.headerSub}>Conversational shopping assistant</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Lucide name="close-circle" size={26} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <View
                  key={msg.id}
                  style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAi]}
                >
                  {!isUser ? (
                    <View style={styles.msgAvatar}>
                      <Lucide name="sparkles" size={14} color="#00f5ff" />
                    </View>
                  ) : null}
                  <View style={{ flexShrink: 1 }}>
                    <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleAi]}>
                      <Text style={isUser ? styles.msgTextUser : styles.msgTextAi}>{msg.text}</Text>
                    </View>
                    {msg.product ? (
                      <View style={styles.productCard}>
                        <TouchableOpacity
                          style={styles.productCardRow}
                          activeOpacity={0.85}
                          onPress={() => {
                            triggerHaptic("light");
                            onProductPreview?.(msg.product);
                          }}
                        >
                          <Image
                            source={{
                              uri:
                                msg.product.images?.[0] ||
                                "https://auragram.com/logo.png",
                            }}
                            style={styles.productImage}
                            contentFit="cover"
                          />
                          <View style={styles.productInfo}>
                            <Text style={styles.productTitle} numberOfLines={2}>
                              {msg.product.title || msg.product.name}
                            </Text>
                            {msg.product.price != null ? (
                              <Text style={styles.productPrice}>{formatPrice(msg.product.price)}</Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                        <View style={styles.productActions}>
                          <TouchableOpacity
                            style={styles.productActionBtn}
                            onPress={() => {
                              triggerHaptic("light");
                              onProductPreview?.(msg.product);
                            }}
                          >
                            <Text style={styles.productActionText}>View</Text>
                          </TouchableOpacity>
                          <View style={styles.productActionDivider} />
                          <TouchableOpacity
                            style={styles.productActionBtn}
                            onPress={() => {
                              triggerHaptic("success");
                              onAddToCart(msg.product);
                            }}
                          >
                            <Text style={styles.productActionText}>Add to Cart</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Ask about products, styles, budgets..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={query}
              onChangeText={setQuery}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !query.trim() && styles.sendBtnDisabled]}
              onPress={handleSubmit}
              disabled={!query.trim()}
            >
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

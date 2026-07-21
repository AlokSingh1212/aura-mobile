import { useState, useRef, useCallback } from "react";
import { Animated } from "react-native";

export function useChatDrawerUiState(
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void
) {
  const [activeBusinessTool, setActiveBusinessTool] = useState<string | null>(null);
  const [showLabelSheet, setShowLabelSheet] = useState(false);
  const [selectedLabelTemp, setSelectedLabelTemp] = useState<string | null>(null);
  const [showCoinPopup, setShowCoinPopup] = useState(false);
  const [coinUser, setCoinUser] = useState<any>(null);
  const [coinFlipped, setCoinFlipped] = useState(false);
  const coinFlipAnim = useRef(new Animated.Value(0)).current;

  const frontInterpolate = coinFlipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backInterpolate = coinFlipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const handleCoinFlipPress = useCallback(() => {
    triggerHaptic("medium");
    const toValue = coinFlipped ? 0 : 1;
    Animated.spring(coinFlipAnim, {
      toValue,
      friction: 7,
      tension: 15,
      useNativeDriver: true,
    }).start();
    setCoinFlipped((prev) => !prev);
  }, [coinFlipped, coinFlipAnim, triggerHaptic]);

  const openCoinPopup = useCallback(
    (user: any) => {
      setCoinUser(user);
      setCoinFlipped(false);
      coinFlipAnim.setValue(0);
      setShowCoinPopup(true);
    },
    [coinFlipAnim]
  );

  return {
    activeBusinessTool,
    setActiveBusinessTool,
    showLabelSheet,
    setShowLabelSheet,
    selectedLabelTemp,
    setSelectedLabelTemp,
    showCoinPopup,
    setShowCoinPopup,
    coinUser,
    setCoinUser,
    coinFlipped,
    setCoinFlipped,
    coinFlipAnim,
    frontInterpolate,
    backInterpolate,
    handleCoinFlipPress,
    openCoinPopup,
  };
}

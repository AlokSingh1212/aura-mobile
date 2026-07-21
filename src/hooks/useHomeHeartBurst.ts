import { useCallback, useState } from "react";
import { Animated } from "react-native";

export function useHomeHeartBurst() {
  const [heartAnimScale] = useState(() => new Animated.Value(0));
  const [heartAnimOpacity] = useState(() => new Animated.Value(0));
  const [heartAnimItem, setHeartAnimItem] = useState<string | null>(null);

  const triggerHeartBurst = useCallback(
    (itemId: string) => {
      setHeartAnimItem(itemId);
      heartAnimScale.setValue(0);
      heartAnimOpacity.setValue(1);
      Animated.parallel([
        Animated.spring(heartAnimScale, {
          toValue: 1.5,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(heartAnimOpacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setHeartAnimItem(null);
      });
    },
    [heartAnimOpacity, heartAnimScale]
  );

  return {
    heartAnimItem,
    heartAnimScale,
    heartAnimOpacity,
    triggerHeartBurst,
  };
}

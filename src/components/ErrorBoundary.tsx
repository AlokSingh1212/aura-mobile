import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Lucide from "@expo/vector-icons/Ionicons";

type Props = {
  children: React.ReactNode;
  screenName?: string;
  onReset?: () => void;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.screenName ? `:${this.props.screenName}` : ""}]`, error, info);
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.fallback} accessibilityRole="alert">
          <Lucide name="warning-outline" size={40} color="#ff6b6b" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message} numberOfLines={3}>
            {this.state.error.message || "An unexpected error occurred."}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={this.reset} accessibilityLabel="Try again">
            <Text style={styles.btnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 16 },
  message: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  btn: {
    marginTop: 20,
    backgroundColor: "#0095f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

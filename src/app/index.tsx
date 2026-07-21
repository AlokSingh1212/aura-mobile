import { LogBox } from "react-native";
import { HomeScreen } from "@/components/home/HomeScreen";

LogBox.ignoreLogs([
  "[expo-av]: Expo AV has been deprecated and will be removed in SDK 54",
  "Video component from `expo-av` is deprecated in favor of `expo-video`",
]);

export default function ReelsScreen() {
  return <HomeScreen />;
}

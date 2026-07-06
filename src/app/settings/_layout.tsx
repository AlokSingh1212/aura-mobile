import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="accounts" />
      <Stack.Screen name="shop" />
      <Stack.Screen name="delivery" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="creator" />
      <Stack.Screen name="personal-details" />
      <Stack.Screen name="security" />
      <Stack.Screen name="archives" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="time" />
      <Stack.Screen name="content" />
      <Stack.Screen name="close-friends" />
      <Stack.Screen name="blocked" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="tags" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="muted" />
      <Stack.Screen name="saved" />
      <Stack.Screen name="accessibility" />
      <Stack.Screen name="language" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="help" />
      <Stack.Screen name="support" />
      <Stack.Screen name="store/index" />
      <Stack.Screen name="store/catalog" />
      <Stack.Screen name="store/orders" />
      <Stack.Screen name="store/shipping" />
      <Stack.Screen name="store/payouts" />
      <Stack.Screen name="store/customers" />
      <Stack.Screen name="store/promotions" />
      <Stack.Screen name="store/policies" />
      <Stack.Screen name="about" />
      <Stack.Screen name="data" />
      <Stack.Screen name="delete-account" />
    </Stack>
  );
}

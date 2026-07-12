import { Stack } from "expo-router";

export default function ShopLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" options={{ animation: "none" }} />
      <Stack.Screen name="all-products" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="category/[slug]" />
      <Stack.Screen name="checkout" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="orders" />
    </Stack>
  );
}

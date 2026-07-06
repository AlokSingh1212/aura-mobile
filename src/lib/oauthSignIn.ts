import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleOAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: "auragrammobile" }),
  });

  return { request, response, promptAsync };
}

export async function signInWithAppleNative() {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign-In is only available on iOS.");
  }
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    throw new Error("Apple did not return an identity token.");
  }
  const fullName = credential.fullName
    ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(" ")
    : undefined;
  return {
    identityToken: credential.identityToken,
    email: credential.email || undefined,
    fullName,
  };
}

export function isGoogleOAuthConfigured() {
  return !!(
    process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  );
}

export function isAppleOAuthAvailable() {
  return Platform.OS === "ios";
}

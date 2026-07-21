import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Lucide from "@expo/vector-icons/Ionicons";
import { homeSuspensionStyles as styles } from "@/components/home/homeSuspensionStyles";

type HomeSuspensionGateProps = {
  triggerHaptic: (style: "light" | "medium" | "success") => void;
  onLogOut: () => void;
};

export function HomeSuspensionGate({ triggerHaptic, onLogOut }: HomeSuspensionGateProps) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Lucide name="shield-half" size={24} color="#fb923c" />
          <Text style={styles.headerText}>AURA Guidelines & Safety</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Lucide name="ban-outline" size={72} color="#ff3b30" style={styles.icon} />
          <Text style={styles.title}>Your account has been suspended</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Why this happened</Text>
            <Text style={styles.cardText}>
              Your account was flagged for community guidelines violations regarding harassment, unwanted
              contact, fake profile representation, or abusive behaviour.
            </Text>
            <Text style={styles.cardText}>
              AURA is a trusted premium ecosystem for creators and collectors. Abusive or deceptive behaviors
              are not tolerated.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>What you can do</Text>
            <Text style={styles.cardText}>
              If you believe this is a mistake, you have 30 days from the suspension date to appeal this
              decision. You can submit an appeal or download your account data.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic("medium");
              onLogOut();
            }}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

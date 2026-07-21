import { useState, useEffect, useRef, useCallback } from "react";
import { Alert } from "react-native";
import { API_HOST } from "@/constants/api";
import { canStartAudioCall, canStartVideoCall } from "@/lib/settingsRuntime";
import { createRtcEngine, ChannelProfileType, ClientRoleType } from "@/components/agora";
import { authHeaders } from "@/lib/apiClient";

export type ChatCallState = "none" | "outgoing" | "incoming" | "active";

type UseChatCallsOptions = {
  visible: boolean;
  currentUserId: string;
  activeChat: any;
  triggerHaptic: (style: "light" | "medium" | "success" | "heavy") => void;
};

export function useChatCalls({
  visible,
  currentUserId,
  activeChat,
  triggerHaptic,
}: UseChatCallsOptions) {
  const [activeCall, setActiveCall] = useState<any>(null);
  const [callState, setCallState] = useState<ChatCallState>("none");
  const [callerInfo, setCallerInfo] = useState<any>(null);
  const [callAgoraToken, setCallAgoraToken] = useState("");
  const [callAgoraAppId, setCallAgoraAppId] = useState("");
  const [callJoined, setCallJoined] = useState(false);
  const [callRemoteUid, setCallRemoteUid] = useState<number | null>(null);

  const callEngineRef = useRef<any>(null);
  const activeCallRef = useRef<any>(null);
  activeCallRef.current = activeCall;

  const destroyCallRtcEngine = useCallback(async () => {
    if (callEngineRef.current) {
      try {
        await callEngineRef.current.leaveChannel();
        await callEngineRef.current.release();
      } catch {
        /* engine may already be torn down */
      }
      callEngineRef.current = null;
    }
    setCallJoined(false);
    setCallRemoteUid(null);
  }, []);

  const endCallRef = useRef<() => Promise<void>>(async () => {});

  const initCallRtcEngine = useCallback(
    async (appId: string, token: string, channelName: string, callType: string) => {
      if (!createRtcEngine) {
        setCallJoined(true);
        return;
      }
      try {
        const engine = createRtcEngine();
        callEngineRef.current = engine;
        await engine.initialize({
          appId: appId || "demo-app-id-placeholder",
          channelProfile: ChannelProfileType.CHANNEL_PROFILE_LIVE_BROADCASTING,
        });
        engine.registerEventHandler({
          onJoinChannelSuccess: () => {
            setCallJoined(true);
          },
          onUserJoined: (_connection: any, uid: number) => {
            setCallRemoteUid(uid);
            setCallState("active");
          },
          onUserOffline: () => {
            endCallRef.current();
          },
          onError: (err: number, msg: string) => {
            console.error("[Agora Call Error]:", err, msg);
          },
        });
        await engine.enableVideo();
        if (callType === "AUDIO") {
          await engine.muteLocalVideoStream(true);
        } else {
          await engine.startPreview();
        }
        await engine.setClientRole(ClientRoleType.CLIENT_ROLE_BROADCASTER);
        await engine.joinChannel(token, channelName, 0, {});
      } catch (e) {
        console.warn("Agora call engine init failed, falling back to simulator:", e);
        setCallJoined(true);
      }
    },
    []
  );

  const endCall = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call) return;
    triggerHaptic("medium");
    setCallState("none");
    try {
      await fetch(`${API_HOST}/api/mobile/chat/call`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          action: "end",
          callId: call.id,
        }),
      });
    } catch {
      /* best-effort hangup */
    }
    await destroyCallRtcEngine();
    setActiveCall(null);
  }, [destroyCallRtcEngine, triggerHaptic]);

  endCallRef.current = endCall;

  const startCall = useCallback(
    async (type: "AUDIO" | "VIDEO") => {
      if (!activeChat) return;
      if (type === "VIDEO" && !canStartVideoCall()) {
        Alert.alert(
          "Video calls disabled",
          "Turn on video calls in Settings → Messages and story replies."
        );
        return;
      }
      if (type === "AUDIO" && !canStartAudioCall()) {
        Alert.alert(
          "Voice calls disabled",
          "Turn on audio calls in Settings → Messages and story replies."
        );
        return;
      }
      triggerHaptic("heavy");
      const peerUserId =
        activeChat.type === "PRIVATE"
          ? activeChat.userOneId === currentUserId
            ? activeChat.userTwoId
            : activeChat.userOneId
          : activeChat.userId;
      if (!peerUserId) return;

      setCallState("outgoing");
      try {
        const res = await fetch(`${API_HOST}/api/mobile/chat/call`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            action: "initiate",
            callerId: currentUserId,
            receiverId: peerUserId,
            type,
          }),
        });
        const data = await res.json();
        if (data.success && data.call) {
          setActiveCall(data.call);
          setCallAgoraToken(data.tokens.callerToken);
          setCallAgoraAppId(data.tokens.appId);
          await initCallRtcEngine(
            data.tokens.appId,
            data.tokens.callerToken,
            data.tokens.channelName,
            type
          );
        } else {
          setCallState("none");
          Alert.alert("Call Failed", data.error || "Unable to start call.");
        }
      } catch (err) {
        console.warn("Error starting call:", err);
        setCallState("none");
      }
    },
    [activeChat, currentUserId, initCallRtcEngine, triggerHaptic]
  );

  const acceptCall = useCallback(async () => {
    if (!activeCallRef.current) return;
    triggerHaptic("success");
    try {
      const res = await fetch(`${API_HOST}/api/mobile/chat/call`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          action: "accept",
          callId: activeCallRef.current.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCallState("active");
        await initCallRtcEngine(
          callAgoraAppId,
          callAgoraToken,
          activeCallRef.current.channelName,
          activeCallRef.current.type
        );
      }
    } catch (err) {
      console.warn("Error accepting call:", err);
    }
  }, [callAgoraAppId, callAgoraToken, initCallRtcEngine, triggerHaptic]);

  const declineCall = useCallback(async () => {
    if (!activeCallRef.current) return;
    triggerHaptic("medium");
    setCallState("none");
    try {
      await fetch(`${API_HOST}/api/mobile/chat/call`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          action: "decline",
          callId: activeCallRef.current.id,
        }),
      });
    } catch {
      /* best-effort decline */
    }
    await destroyCallRtcEngine();
    setActiveCall(null);
  }, [destroyCallRtcEngine, triggerHaptic]);

  useEffect(() => {
    if (!visible || callState !== "none" || !currentUserId) return;
    const pollIncomingCall = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/mobile/chat/call`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            action: "poll",
            receiverId: currentUserId,
          }),
        });
        const data = await res.json();
        if (data.success && data.call) {
          triggerHaptic("heavy");
          setActiveCall(data.call);
          setCallerInfo(data.caller);
          setCallAgoraToken(data.token);
          setCallAgoraAppId(data.appId);
          setCallState("incoming");
        }
      } catch {
        /* polling is best-effort */
      }
    };
    pollIncomingCall();
    const interval = setInterval(pollIncomingCall, 3500);
    return () => clearInterval(interval);
  }, [visible, callState, currentUserId, triggerHaptic]);

  useEffect(() => {
    if (callState === "none" || !activeCall) return;
    const checkCallActiveStatus = async () => {
      try {
        const res = await fetch(`${API_HOST}/api/mobile/chat/call`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            action: "checkStatus",
            callId: activeCall.id,
          }),
        });
        const data = await res.json();
        if (data.success && (data.status === "ENDED" || data.status === "REJECTED")) {
          await destroyCallRtcEngine();
          setCallState("none");
          setActiveCall(null);
          Alert.alert("Call Ended", "The calling connection was terminated by peer.");
        }
      } catch {
        /* polling is best-effort */
      }
    };
    const interval = setInterval(checkCallActiveStatus, 3000);
    return () => clearInterval(interval);
  }, [callState, activeCall, destroyCallRtcEngine]);

  return {
    activeCall,
    callState,
    callerInfo,
    callJoined,
    callRemoteUid,
    startCall,
    acceptCall,
    declineCall,
    endCall,
  };
}

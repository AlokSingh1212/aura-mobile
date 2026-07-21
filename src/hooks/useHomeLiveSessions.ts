import { useEffect, useMemo, useState } from "react";
import { fetchActiveLiveSessions } from "@/lib/liveSessionApi";

type UseHomeLiveSessionsOptions = {
  currentUserId?: string;
  activeProfile?: any;
};

export function useHomeLiveSessions({ currentUserId, activeProfile }: UseHomeLiveSessionsOptions) {
  const [showLiveShowroom, setShowLiveShowroom] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [showroomMode, setShowroomMode] = useState<"lobby" | "viewer">("lobby");
  const [showroomMaisonId, setShowroomMaisonId] = useState("rare_raven");
  const [showroomMaisonName, setShowroomMaisonName] = useState("Rare Raven");
  const [showroomSessionId, setShowroomSessionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const sessions = await fetchActiveLiveSessions(currentUserId);
        setActiveSessions(sessions);
      } catch (e) {
        console.warn("Failed to fetch active live sessions:", e);
      }
    };

    loadSessions();
    const interval = setInterval(loadSessions, 8000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const myLiveSession = useMemo(
    () =>
      activeSessions.find(
        (session) =>
          session.maisonId === activeProfile?.username ||
          session.maisonId === currentUserId ||
          (activeProfile?.name && session.maisonName === activeProfile?.name)
      ),
    [activeSessions, activeProfile?.name, activeProfile?.username, currentUserId]
  );

  const isCurrentlyLive = !!myLiveSession;

  const otherLiveSessions = useMemo(
    () =>
      activeSessions.filter(
        (session) =>
          session.maisonId !== activeProfile?.username &&
          session.maisonId !== currentUserId &&
          !(activeProfile?.name && session.maisonName === activeProfile?.name)
      ),
    [activeSessions, activeProfile?.name, activeProfile?.username, currentUserId]
  );

  return {
    showLiveShowroom,
    setShowLiveShowroom,
    myLiveSession,
    isCurrentlyLive,
    otherLiveSessions,
    showroomMode,
    setShowroomMode,
    showroomMaisonId,
    setShowroomMaisonId,
    showroomMaisonName,
    setShowroomMaisonName,
    showroomSessionId,
    setShowroomSessionId,
  };
}

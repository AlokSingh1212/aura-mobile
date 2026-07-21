import { useEffect } from "react";

type UseHomeActivityPollingOptions = {
  activeProfileId?: string;
  fetchNotifications: (profileId: string) => void;
};

export function useHomeActivityPolling({ activeProfileId, fetchNotifications }: UseHomeActivityPollingOptions) {
  useEffect(() => {
    if (activeProfileId) {
      fetchNotifications(activeProfileId);
      const pollInterval = setInterval(() => {
        fetchNotifications(activeProfileId);
      }, 10000);
      return () => clearInterval(pollInterval);
    }
  }, [activeProfileId, fetchNotifications]);
}

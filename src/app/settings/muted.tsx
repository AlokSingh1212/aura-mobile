import { SettingsUserListScreen } from "@/components/settings/SettingsUserListScreen";
import { muteUser, unmuteUser } from "@/lib/socialGraph";

export default function MutedSettingsScreen() {
  return (
    <SettingsUserListScreen
      title="Muted accounts"
      kind="muted"
      addLabel="Add muted account"
      emptyTitle="No muted accounts"
      emptyBody="Mute accounts to hide their posts, stories and live notifications from your feed."
      intro="Muted accounts aren't notified. You can still visit their profile unless you've blocked them."
      removeLabel="Unmute"
      onAdd={muteUser}
      onRemove={unmuteUser}
    />
  );
}

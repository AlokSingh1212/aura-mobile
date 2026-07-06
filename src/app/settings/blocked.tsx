import { SettingsUserListScreen } from "@/components/settings/SettingsUserListScreen";
import { blockUser, unblockUser } from "@/lib/socialGraph";

export default function BlockedSettingsScreen() {
  return (
    <SettingsUserListScreen
      title="Blocked"
      kind="blocked"
      addLabel="Add blocked account"
      emptyTitle="No blocked accounts"
      emptyBody="When you block someone, they won't be able to find your profile, posts or stories on AURA."
      intro="People you block won't be notified. They can't message you or see your content."
      removeLabel="Unblock"
      onAdd={blockUser}
      onRemove={unblockUser}
    />
  );
}

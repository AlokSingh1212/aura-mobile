import { SettingsUserListScreen } from "@/components/settings/SettingsUserListScreen";
import { addCloseFriend, removeCloseFriend } from "@/lib/socialGraph";

export default function CloseFriendsSettingsScreen() {
  return (
    <SettingsUserListScreen
      title="Close Friends"
      kind="closeFriends"
      addLabel="Add to Close Friends"
      emptyTitle="No Close Friends yet"
      emptyBody="Share stories and drops with a smaller group. Only Close Friends see green-ring stories."
      intro="People aren't notified when you add or remove them from Close Friends."
      removeLabel="Remove"
      onAdd={addCloseFriend}
      onRemove={removeCloseFriend}
    />
  );
}

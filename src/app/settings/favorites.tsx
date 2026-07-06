import { SettingsUserListScreen } from "@/components/settings/SettingsUserListScreen";
import { addFavoriteAccount, removeFavoriteAccount } from "@/lib/socialGraph";

export default function FavoritesSettingsScreen() {
  return (
    <SettingsUserListScreen
      title="Favorites"
      kind="favorites"
      addLabel="Add to Favorites"
      emptyTitle="No favorites yet"
      emptyBody="Add accounts to Favorites to see their posts and live shows higher in your feed."
      intro="Favorites appear in a dedicated feed tab and get priority for live notifications."
      removeLabel="Remove"
      onAdd={addFavoriteAccount}
      onRemove={removeFavoriteAccount}
    />
  );
}

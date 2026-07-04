import { useCallback, useMemo, useState } from "react";
import type { CollabPartner, PhotoTag } from "@/lib/postComposerTypes";
import {
  collectPostPeople,
  shouldOpenPeopleSheet,
  type PostPerson,
} from "@/lib/postPeople";
import { openProfile } from "@/lib/postNavigation";
import { PostPeopleGlassSheet } from "@/components/post/PostPeopleGlassSheet";

export function usePostPeopleSheet(input: {
  authorUsername: string;
  authorName: string;
  authorLogo?: string | null;
  authorProfileId?: string;
  collab?: CollabPartner | null;
  collabs?: CollabPartner[];
  photoTags?: PhotoTag[];
}) {
  const people = useMemo(
    () => collectPostPeople(input),
    [
      input.authorUsername,
      input.authorName,
      input.authorLogo,
      input.authorProfileId,
      input.collab,
      input.collabs,
      input.photoTags,
    ]
  );

  const useSheet = shouldOpenPeopleSheet(people);
  const [visible, setVisible] = useState(false);

  const openSheet = useCallback(() => setVisible(true), []);
  const closeSheet = useCallback(() => setVisible(false), []);

  const navigatePerson = useCallback(
    (person: PostPerson) => {
      closeSheet();
      openProfile(person.username);
    },
    [closeSheet]
  );

  const onPersonPress = useCallback(
    (username: string) => {
      if (useSheet) {
        openSheet();
        return;
      }
      openProfile(username);
    },
    [useSheet, openSheet]
  );

  const onTagPress = useCallback(
    (tag: PhotoTag) => {
      if (useSheet) {
        openSheet();
        return;
      }
      openProfile(tag.username);
    },
    [useSheet, openSheet]
  );

  const PeopleSheet = (
    <PostPeopleGlassSheet
      visible={visible}
      people={people}
      onClose={closeSheet}
      onSelect={navigatePerson}
    />
  );

  return {
    people,
    useSheet,
    onPersonPress,
    onTagPress,
    openSheet,
    PeopleSheet,
  };
}

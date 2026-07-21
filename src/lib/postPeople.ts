import type { CollabPartner, PhotoTag } from "@/lib/postComposerTypes";

export type PostPersonRole = "author" | "collab" | "in_photo";

export interface PostPerson {
  profileId: string;
  username: string;
  name: string;
  logo?: string | null;
  roles: PostPersonRole[];
  collabStatus?: CollabPartner["status"];
}

export const PEOPLE_SHEET_THRESHOLD = 2;

export function shouldOpenPeopleSheet(people: PostPerson[]): boolean {
  return people.length > PEOPLE_SHEET_THRESHOLD;
}

function upsert(
  map: Map<string, PostPerson>,
  person: Omit<PostPerson, "roles"> & { role: PostPersonRole }
) {
  const key = person.profileId || person.username.toLowerCase();
  const existing = map.get(key);
  if (existing) {
    if (!existing.roles.includes(person.role)) {
      existing.roles.push(person.role);
    }
    if (person.logo && !existing.logo) existing.logo = person.logo;
    if (person.name && existing.name === existing.username) existing.name = person.name;
    return;
  }
  map.set(key, {
    profileId: person.profileId,
    username: person.username,
    name: person.name,
    logo: person.logo,
    roles: [person.role],
    collabStatus: person.collabStatus,
  });
}

/** Merge author, collab(s), and in-photo tags into a deduped people list. */
export function collectPostPeople(input: {
  authorUsername: string;
  authorName: string;
  authorLogo?: string | null;
  authorProfileId?: string;
  collab?: CollabPartner | null;
  collabs?: CollabPartner[];
  photoTags?: PhotoTag[];
}): PostPerson[] {
  const map = new Map<string, PostPerson>();

  upsert(map, {
    profileId: input.authorProfileId || input.authorUsername,
    username: input.authorUsername,
    name: input.authorName,
    logo: input.authorLogo,
    role: "author",
  });

  const collabList: CollabPartner[] = [];
  if (input.collab && input.collab.status === "accepted") {
    collabList.push(input.collab);
  }
  if (Array.isArray(input.collabs)) {
    for (const c of input.collabs) {
      if (c.status === "accepted" && !collabList.some((x) => x.profileId === c.profileId)) {
        collabList.push(c);
      }
    }
  }

  for (const c of collabList) {
    upsert(map, {
      profileId: c.profileId,
      username: c.username,
      name: c.name,
      logo: c.logo,
      role: "collab",
      collabStatus: c.status,
    });
  }

  for (const tag of input.photoTags || []) {
    upsert(map, {
      profileId: tag.profileId,
      username: tag.username,
      name: tag.name,
      logo: tag.logo,
      role: "in_photo",
    });
  }

  const authorKey = input.authorProfileId || input.authorUsername.toLowerCase();
  const rows = [...map.values()];
  rows.sort((a, b) => {
    const aAuthor = (a.profileId === authorKey || a.username === input.authorUsername) ? 0 : 1;
    const bAuthor = (b.profileId === authorKey || b.username === input.authorUsername) ? 0 : 1;
    if (aAuthor !== bAuthor) return aAuthor - bAuthor;
    return a.name.localeCompare(b.name);
  });
  return rows;
}

export function roleLabel(roles: PostPersonRole[]): string {
  if (roles.includes("author")) return "Author";
  if (roles.includes("collab") && roles.includes("in_photo")) return "Collab · In photo";
  if (roles.includes("collab")) return "Collab";
  return "In photo";
}

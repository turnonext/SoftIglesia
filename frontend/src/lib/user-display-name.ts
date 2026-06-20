type UserNameSource = {
  email?: string | null;
  profile?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  first_name?: string | null;
  last_name?: string | null;
};

export function userDisplayName(user?: UserNameSource | null): string {
  if (!user) return "—";

  const firstName = user.profile?.first_name ?? user.first_name;
  const lastName = user.profile?.last_name ?? user.last_name;
  const parts = [firstName, lastName].filter(Boolean);

  if (parts.length) {
    return parts.join(" ");
  }

  if (user.email) {
    return user.email.split("@")[0] ?? user.email;
  }

  return "—";
}

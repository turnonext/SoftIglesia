import { z } from "zod";

export const profileSchema = z.object({
  first_name: z.string().max(120).optional().or(z.literal("")),
  last_name: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(32).optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  locale: z.string().max(8).optional(),
  timezone: z.string().max(64).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export type UserProfileData = {
  user_id: string;
  email: string;
  role: string;
  tenant_id: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  bio?: string | null;
  locale?: string;
  timezone?: string;
  avatar_url?: string | null;
};

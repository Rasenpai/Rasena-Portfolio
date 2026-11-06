import { createClient } from "@supabase/supabase-js";

// Server only. Jangan pernah di-import dari komponen "use client".
// Nama file sengaja BUKAN supabase-admin.ts supaya tidak menimpa helper yang sudah ada di project.
// Service role bypass RLS, makanya key ini tidak boleh punya prefix NEXT_PUBLIC_.
export const supabaseService = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export const AVATAR_BUCKET = "comment-avatars";
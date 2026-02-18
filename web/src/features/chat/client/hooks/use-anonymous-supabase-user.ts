"use client";

import { createBrowserClient } from "@mirai-gikai/supabase";
import { useEffect, useState } from "react";

// Create a singleton Supabase client with persistent session
const supabase = createBrowserClient();

/**
 * Hook to ensure an anonymous Supabase user exists and return the user ID
 * This will automatically create an anonymous user if none exists
 */
export function useAnonymousSupabaseUser() {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const ensureAnonUser = async () => {
      try {
        // Check if user already exists
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          return;
        }

        // No valid session -> sign in anonymously
        const { data, error: signInError } =
          await supabase.auth.signInAnonymously();

        if (signInError) {
          console.error("Error creating anonymous user:", signInError);
          return;
        }

        if (data.user) {
          setUserId(data.user.id);
        }
      } catch (err) {
        console.error("Error ensuring anonymous user:", err);
      }
    };

    ensureAnonUser();
  }, []);

  return userId;
}

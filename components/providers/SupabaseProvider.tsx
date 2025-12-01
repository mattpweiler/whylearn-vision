"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface SupabaseContextValue {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(
  undefined
);

export const SupabaseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscribed = true;

    const ensureUserExists = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!subscribed) return;
        if (userError || !userData?.user) {
          throw userError ?? new Error("Missing user");
        }
      } catch {
        await supabase.auth.signOut();
        if (!subscribed) return;
        setSession(null);
      }
    };

    const setSessionWithValidation = (nextSession: Session | null) => {
      if (!subscribed) return;
      setSession(nextSession);
      if (!nextSession) return;
      void ensureUserExists();
    };

    const hydrate = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!subscribed) return;
      if (error) {
        await supabase.auth.signOut();
        setSession(null);
      } else {
        setSessionWithValidation(data.session ?? null);
      }
      setIsLoading(false);
    };
    hydrate();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSessionWithValidation(nextSession);
    });
    return () => {
      subscribed = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        session,
        user: session?.user ?? null,
        isLoading,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return ctx;
};

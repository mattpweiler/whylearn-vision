'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppExperience } from '@/components/AppExperience';
import { AppStateProvider } from '@/components/AppStateProvider';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { isSubscriptionActive } from '@/lib/stripe/utils';

export default function AppWorkspacePage() {
   const { session, isLoading, supabase } = useSupabase();
   const router = useRouter();

   useEffect(() => {
      if (!isLoading && !session) {
         router.replace('/auth/sign-in');
      }
   }, [isLoading, session, router]);

   useEffect(() => {
      const validateSubscription = async () => {
         if (!session) return;
         try {
            const response = await fetch('/api/stripe/subscription');
            if (!response.ok) return;
            const payload = (await response.json()) as {
               subscription: { status?: string | null; current_period_end?: string | null } | null;
               isActive: boolean;
            };
            if (
               !payload.isActive &&
               !isSubscriptionActive(
                  payload.subscription?.status,
                  payload.subscription?.current_period_end ?? null
               )
            ) {
               router.replace('/paywall');
            }
         } catch (err) {
            console.error('Subscription check failed', err);
         }
      };
      void validateSubscription();
   }, [router, session]);

   if (isLoading || !session) {
      return (
         <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
            Checking your session…
         </div>
      );
   }

   return (
      <AppStateProvider mode="supabase" supabaseClient={supabase} userId={session.user.id}>
         <AppExperience />
      </AppStateProvider>
   );
}

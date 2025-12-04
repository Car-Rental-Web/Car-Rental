import { useEffect } from "react";
import { supabase } from "../utils/supabase";
import { useAuthStore } from "../store/AuthStore";

export const useRestoreSession = () => {
  const login = useAuthStore((state) => state.login);
  const finishLoading = useAuthStore((state) => state.finishLoading);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        login(data.session.user);
      } else {
        finishLoading(); // No session, stop loading
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        login(session.user);
      } else {
        finishLoading();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [login, finishLoading]);
};

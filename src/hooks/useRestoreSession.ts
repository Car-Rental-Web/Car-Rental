import { useEffect } from "react";
import { supabase } from "../utils/supabase";
import { useAuthStore } from "../store/useAuthStore";

export const useRestoreSession = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const finishLoading = useAuthStore((state) => state.finishLoading);

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user); // ✅ now it's read
      } else {
        finishLoading();
      }
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user); // ✅ now it's read
      } else {
        finishLoading();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [setUser, finishLoading]);
};

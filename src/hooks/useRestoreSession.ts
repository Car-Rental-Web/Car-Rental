import { useEffect } from "react";
import { supabase } from "../utils/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

export const useRestoreSession = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const finishLoading = useAuthStore((state) => state.finishLoading);
  const navigate = useNavigate();

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user); 
        navigate('/dashboard');
      } else {
        finishLoading();
      }
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {

      if(event === "PASSWORD_RECOVERY"){
        useAuthStore.getState().setRecoveringPassword(true);
        return;
      }
      if(session?.user){
        setUser(session.user)
      } else {
        finishLoading();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [setUser, finishLoading,navigate]);
};

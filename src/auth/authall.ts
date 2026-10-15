import { toast } from "react-toastify";
import { supabase, supabaseLaundry, supabaseWater } from "../utils/supabase";

/**
 * One login for all three businesses.
 * Rental is the main login: if it fails, the whole login fails (same as before).
 * Then the same email/password signs in to laundry and water.
 * Returns the rental result, so it can replace supabase.auth.signInWithPassword().
 */
export const signInToAll = async (email: string, password: string) => {
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.error) return result;

  const others = await Promise.allSettled([
    supabaseLaundry.auth.signInWithPassword({ email, password }),
    supabaseWater.auth.signInWithPassword({ email, password }),
  ]);

  const names = ["Laundry", "Water"];
  others.forEach((outcome, i) => {
    const failed = outcome.status === "rejected" || outcome.value.error;
    if (failed) {
      console.error(
        `${names[i]} sign-in failed:`,
        outcome.status === "rejected" ? outcome.reason : outcome.value.error,
      );
      toast.warning(
        `Logged in, but the ${names[i]} business could not sign in. Its data may not load.`,
      );
    }
  });

  return result;
};

/** Log out of all three at once. */
export const signOutAll = async () => {
  await Promise.allSettled([
    supabase.auth.signOut(),
    supabaseLaundry.auth.signOut(),
    supabaseWater.auth.signOut(),
  ]);
};
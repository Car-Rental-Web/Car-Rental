import { supabase } from "./supabase";

const getPublicUrl = (bucket: string, path: string) => {
  if (!path) return undefined;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

export default getPublicUrl
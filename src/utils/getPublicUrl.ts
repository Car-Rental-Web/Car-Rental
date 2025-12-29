import { supabase } from "./supabase";

const getPublicUrl = (bucket: string, path: string) => {
  if (!path) return undefined;
  const {data} = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
};

export default getPublicUrl
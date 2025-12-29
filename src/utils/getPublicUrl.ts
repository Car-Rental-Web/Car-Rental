import { supabase } from "./supabase";

const getPublicUrl = (bucket: string, path: string | null | undefined) => {
  if (!path || typeof path !== "string") return "";
  // const parts = path.split('/')
  const {data} = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
};

export default getPublicUrl
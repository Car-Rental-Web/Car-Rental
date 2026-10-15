import { supabaseLaundry } from "../supabase";

const getPublicUrlLaundry = (bucket: string, path: string | null | undefined) => {
  if (!path || typeof path !== "string") return "";
  const { data } = supabaseLaundry.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export default getPublicUrlLaundry;

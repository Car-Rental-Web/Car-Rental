import { supabase } from "./supabase";

export const uploadFile = async (
  file: File,
  bucket: string,
  folder?: string
) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  return {
    path: filePath,
    bucket,
  };
};

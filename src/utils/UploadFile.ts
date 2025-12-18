import { supabase } from "./supabase";

export const uploadFile = async (
  file: File,
  bucket: string,
  folder?: string
) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file);
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
};

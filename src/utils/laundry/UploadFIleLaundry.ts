import { supabaseLaundry } from "../supabase";

export const uploadFileLaundry = async (
  file: File,
  bucket: string,
  folder?: string
) => {
  if (!file || !file.name) {
    console.error("Upload failed: No file or filename provided.");
    throw new Error("Invalid file object provided for upload.");
  }
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { error } = await supabaseLaundry.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  return {
    path: filePath,
    bucket,
  };
};

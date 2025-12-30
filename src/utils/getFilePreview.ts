import getPublicUrl from "./getPublicUrl";

const getFilePreview = (fileValue: any, bucket: string) => {
  if (!fileValue) return null;

  // Case 1: It's an existing path from the database (String)
  if (typeof fileValue === "string") {
    return getPublicUrl(bucket, fileValue);
  }

  // Case 2: It's a newly selected file (FileList)
  if (fileValue instanceof FileList && fileValue.length > 0) {
    return URL.createObjectURL(fileValue[0]);
  }

  return null;
};

export default getFilePreview;

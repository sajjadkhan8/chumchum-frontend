import axios from "axios";
import { logApiError, normalizeApiError } from "./errorUtils";

const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadImage = async (image) => {
  if (!image) {
    return null;
  }

  if (!cloudinaryCloudName || !cloudinaryUploadPreset) {
    throw normalizeApiError({
      message:
        "Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.",
    });
  }

  const formData = new FormData();
  formData.append("file", image);
  formData.append("upload_preset", cloudinaryUploadPreset);

  try {
    const { data } = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
      formData,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    return data;
  } catch (error) {
    throw logApiError(error);
  }
};


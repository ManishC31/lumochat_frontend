import { BACKEND_URL } from "@/config/backend";

export const getMessageOfConnection = async (connectionId: number, offset: number = 0, limit: number = 15) => {
  try {
    const response = await fetch(`${BACKEND_URL}/message/${connectionId}?offset=${offset}&limit=${limit}`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message || "Failed to fetch messages.";
      throw new Error(message);
    }

    return data;
  } catch (error) {
    throw new Error("Unexpected error while fetching messages.");
  }
};

export const getMediaOfConnection = async (connectionId: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/message/${connectionId}/media`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || "Failed to fetch media.");
    return data;
  } catch (error) {
    throw new Error("Unexpected error while fetching media.");
  }
};

export const sendMessage = async (formData: FormData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/message`, {
      method: "POST",
      credentials: "include",
      body: formData,
      // No Content-Type header: browser sets multipart/form-data with boundary automatically
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message || "Failed to send message.";
      throw new Error(message);
    }

    return data;
  } catch (error) {
    throw new Error("Unexpected error while sending message.");
  }
};

import { BACKEND_URL } from "@/config/backend";

export const updateUserAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await fetch(`${BACKEND_URL}/user/avatar`, {
    method: "PATCH",
    credentials: "include",
    body: formData,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "Failed to update avatar.");
  return data;
};

type UpdateUserType = {
  name: string;
  status: string;
};

export const getRequestsOfUser = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/connection/requests`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || data?.message || "Failed to fetch requests for user");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Unexpected error while fetching requests for user.");
  }
};

export const updateUserData = async (payload: UpdateUserType) => {
  try {
    const response = await fetch(`${BACKEND_URL}/user`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || data?.message || "Failed to update user details");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Unexpected error while updating user details.");
  }
};

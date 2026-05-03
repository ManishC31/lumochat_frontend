import { BACKEND_URL } from "@/config/backend";

export type NewConnectionRequest = {
  email: string;
};

export const getAllConnections = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/connection`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || data?.message || "Failed to fetch connections");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Unexpected error while fetching connections");
  }
};

export const acceptRequestConnection = async (connectionId: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/connection/accept-request/${connectionId}`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || data?.message || "Failed to accept connection request.");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Unexpected error while accepting connection request.");
  }
};

export const sendNewConnectionRequest = async (payload: NewConnectionRequest) => {
  try {
    const response = await fetch(`${BACKEND_URL}/connection`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || data?.message || "Failed to send new connection request");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Unexpected error while sending new connection request");
  }
};

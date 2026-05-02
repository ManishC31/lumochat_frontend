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
      const message = data.message || "Failed to fetch connections";
      throw new Error(message);
    }

    return data;
  } catch (error) {
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
      const message = data.message || "Failed to accept connection request.";
      throw new Error(message);
    }

    return data;
  } catch (error) {
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
      const message = data.message || "Failed to send new connection request";
      throw new Error(message);
    }

    return data;
  } catch (error) {
    throw new Error("Unexpected error while sending new connection request");
  }
};

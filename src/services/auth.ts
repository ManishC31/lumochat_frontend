import { BACKEND_URL } from "@/config/backend";

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserPayload {
  email: string;
  password: string;
}

export const registerNewUser = async (payload: RegisterUserPayload) => {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message || "Failed to register user.";
      throw new Error(message);
    }

    return data;
  } catch (error) {
    throw new Error("Unexpected error while registering user.");
  }
};

export const loginUser = async (payload: LoginUserPayload) => {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message || "Failed to login user.";
      throw new Error(message);
    }

    return {
      ...data,
      user: data?.user || data?.data?.user || data?.data || data,
    };
  } catch (error) {
    throw new Error("Unexpected error while logging in user.");
  }
};

export const fetchCurrentUser = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/user/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Not authenticated.");
    }

    // Returns { user, token } — token is used to restore localStorage on page reload
    const payload = data?.data ?? data;
    return { user: payload?.user ?? payload, token: payload?.token ?? null };
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await fetch(`${BACKEND_URL}/auth/signout`, {
      method: "GET",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
    });
  } catch {
    // ignore network errors; client-side cleanup will still happen
  }
};

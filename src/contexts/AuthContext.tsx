import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { loginUser, registerNewUser, fetchCurrentUser, logoutUser, LoginUserPayload, RegisterUserPayload } from "@/services/auth";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/config/backend";

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  image?: string;
  status?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (payload: LoginUserPayload) => Promise<void>;
  register: (payload: RegisterUserPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
  socket: Socket;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const sessionUser = await fetchCurrentUser();
        if (sessionUser && typeof sessionUser === "object") {
          setUser(sessionUser as AuthUser);
          setIsAuthenticated(true);
          connectSocket(sessionUser as AuthUser);
        }
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  // connectSocket intentionally omitted — it's stable and we only want this on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (payload: LoginUserPayload) => {
    try {
      const response = await loginUser(payload);
      const responseUser = response?.user || response?.data?.user || response?.data || response;

      if (!responseUser) {
        throw new Error("Login succeeded but user data was not returned.");
      }

      if (response?.token) {
        localStorage.setItem("chat_token", response.token);
      }
      setUser(responseUser);
      setIsAuthenticated(true);
      connectSocket(responseUser);
    } catch (error) {
      throw error;
    }
  };

  const register = async (payload: RegisterUserPayload) => {
    try {
      const response = await registerNewUser(payload);
      const responseUser = response?.user || response?.data?.user || response?.data || response;

      if (responseUser) {
        if (response?.token) {
          localStorage.setItem("chat_token", response.token);
        }
        setUser(responseUser);
        setIsAuthenticated(true);
        connectSocket(responseUser);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      localStorage.removeItem("chat_token");
      disconnectSocket();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = async () => {
    try {
      const sessionUser = await fetchCurrentUser();
      if (sessionUser && typeof sessionUser === "object") {
        setUser(sessionUser as AuthUser);
      }
    } catch {
      // silently ignore — user stays as-is
    }
  };

  const connectSocket = (connectedUser: AuthUser) => {
    if (socket) {
      socket.disconnect();
    }

    const token = localStorage.getItem("chat_token");

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: {
        token: token,
        userId: connectedUser.id,
        userEmail: connectedUser.email,
      },
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, refreshUser, loading, socket }}>{children}</AuthContext.Provider>;
};

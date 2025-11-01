"use client";

import Loader from "@/components/Loader";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export enum Role {
  User = "user",
  Admin = "admin",
}

interface AppProviderType {
  isLoading: boolean;
  authToken: string | null;
  role: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    password_confirmation: string
  ) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppProviderType | undefined>(undefined);
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const ME_ENDPOINT = `${API_URL}/me`;

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      setAuthToken(token);
      fetchSession();
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [authToken]);

  useEffect(() => {
    const token = Cookies.get("authToken") || null;
    const cookieRole = (Cookies.get("role") || "").toLowerCase();

    if (!token) {
      setIsLoading(false);
      router.push("/auth");
      return;
    }

    setAuthToken(token);

    if (cookieRole === Role.Admin || cookieRole === Role.User) {
      setRole(cookieRole as Role);
    }

    (async () => {
      try {
        const res = await axios.get(ME_ENDPOINT, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        });

        if (res.status === 200 && res.data) {
          const serverRole = String(res.data?.role || "").toLowerCase();
          if (serverRole === Role.Admin || serverRole === Role.User) {
            setRole(serverRole as Role);
            Cookies.set("role", serverRole, { expires: 7 });
          }
          setIsLoading(false);
          return;
        }

        if (res.status === 401) {
          Cookies.remove("authToken");
          Cookies.remove("role");
          setAuthToken(null);
          setRole(Role.User);
          setIsLoading(false);
          router.push("/auth");
          return;
        }
        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    })();
  }, [router]);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`${API_URL}/session`, {
        withCredentials: true,
      });
      setRole(response.data.role);
    } catch (error) {
      console.error("Failed to fetch session", error);
    }
  };

  const axiosInstance = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await axiosInstance.get("/sanctum/csrf-cookie");

      const token = decodeURIComponent(
        document.cookie
          .split("; ")
          .find((c) => c.startsWith("XSRF-TOKEN="))
          ?.split("=")[1] || ""
      );

      const response = await axiosInstance.post(
        "/api/login",
        { email, password },
        {
          headers: { "X-XSRF-TOKEN": token },
        }
      );

      if (response.data.status) {
        Cookies.set("authToken", response.data.token, { expires: 7 });
        toast.success("Login successful");
        setAuthToken(response.data.token);
        await fetchSession();
        router.push("/");
      } else {
        toast.error("Invalid login details");
      }
    } catch (error) {
      console.error(error);
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    password_confirmation: string
  ) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
        password_confirmation,
      });
      toast.success(response.data?.message || "Register success");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Register failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setRole(Role.User);
    Cookies.remove("authToken");
    Cookies.remove("role");
    setIsLoading(false);
    toast.success("User logged out");
    router.push("/auth");
  };

  const value = useMemo<AppProviderType>(
    () => ({ login, register, isLoading, authToken, role, logout }),
    [isLoading, authToken, role]
  );

  return (
    <AppContext.Provider value={value}>
      {isLoading ? <Loader /> : children}
    </AppContext.Provider>
  );
};

export const myAppHook = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("Context will be wrapped inside AppProvider");
  return context;
};

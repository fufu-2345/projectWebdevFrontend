"use client";

import React, { useState, useEffect } from "react";
import { myAppHook } from "@/context/AppProvider";
import Loader from "@/components/Loader";
import { useRouter } from "next/navigation";

interface formData {
  name?: string;
  email: string;
  password: string;
  password_confirmation?: string;
}

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState<formData>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const router = useRouter();
  const { login, register, authToken, isLoading } = myAppHook();

  if (isLoading) {
    return <Loader />;
  }

  useEffect(() => {
    if (authToken) {
      router.push("/");
      return;
    }
  }, [authToken, isLoading]);

  const handleOnChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const test1 = /.+@.{2,}/;
    const test2 = /.{1,}/;
    if (test1.test(formData.email) && test2.test(formData.password)) {
      if (isLogin) {
        try {
          await login(formData.email, formData.password);
        } catch (error) {
          console.log(`Authentication Error ${error}`);
        }
      } else {
        try {
          await register(
            formData.name!,
            formData.email,
            formData.password,
            formData.password_confirmation!
          );
        } catch (error) {
          console.log(`Authentication Error ${error}`);
        }
      }
    }
  };

  return (
    <main>
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h3 className="text-2xl font-semibold text-center mb-6">
            {isLogin ? "Login" : "Register"}
          </h3>
          <form onSubmit={handleFormSubmit}>
            {!isLogin && (
              <input
                className="form-input mb-4 p-3 w-full border border-gray-300 rounded-md"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleOnChangeInput}
                placeholder="Name"
                required
              />
            )}
            <input
              className="form-input mb-4 p-3 w-full border border-gray-300 rounded-md"
              name="email"
              type="email"
              value={formData.email}
              pattern=".+@.{2,}"
              onChange={handleOnChangeInput}
              placeholder="Email"
              required
            />
            <input
              className="form-input mb-4 p-3 w-full border border-gray-300 rounded-md"
              name="password"
              type="password"
              pattern=".{1,}"
              value={formData.password}
              onChange={handleOnChangeInput}
              placeholder="Password"
              required
            />
            {!isLogin && (
              <input
                className="form-input mb-4 p-3 w-full border border-gray-300 rounded-md"
                name="password_confirmation"
                type="password"
                value={formData.password_confirmation}
                onChange={handleOnChangeInput}
                placeholder="Confirm Password"
                required
              />
            )}
            <button
              className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600"
              type="submit"
            >
              {isLogin ? "Login" : "Register"}
            </button>
          </form>
          <p className="mt-3 text-center text-sm text-gray-600">
            {isLogin
              ? "Don't have an account ? "
              : "Already have an account ? "}
            <span
              className="hover:cursor-pointer"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Register" : "Login"}
            </span>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Auth;

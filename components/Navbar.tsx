"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { myAppHook } from "@/context/AppProvider";

const Navbar = () => {
  const { logout, authToken, role } = myAppHook();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isAdmin = String(role || "").toLowerCase() !== "user";

  const DesktopLinks = () =>
    authToken ? (
      <>
        <Link
          className="px-3 py-2 rounded-lg text-white hover:bg-blue-500/40 transition-colors"
          href="/"
        >
          Home
        </Link>

        {isAdmin && (
          <Link
            className="px-3 py-2 rounded-lg text-white hover:bg-blue-500/40 transition-colors"
            href="/dashboard"
          >
            Dashboard
          </Link>
        )}

        <Link
          className="px-3 py-2 rounded-lg text-white hover:bg-blue-500/40 transition-colors"
          href={role === "user" ? "/profile" : "/line"}
        >
          {role === "user" ? "Profile" : "Statistic"}
        </Link>
        <Link
          className="px-3 py-2 rounded-lg text-white hover:bg-blue-500/40 transition-colors"
          href={role === "user" ? "/cart" : "/promotion"}
        >
          {role === "user" ? "Cart" : "Promotion"}
        </Link>
        <button
          onClick={logout}
          className="ml-2 inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </>
    ) : (
      <>
        <Link
          className="px-3 py-2 rounded-lg text-white hover:bg-blue-500/40 transition-colors"
          href="/"
        >
          Home
        </Link>
        <Link
          className="px-3 py-2 rounded-lg text-white hover:bg-blue-500/40 transition-colors"
          href="/auth"
        >
          Login
        </Link>
      </>
    );

  const MobileLinks = () =>
    authToken ? (
      <>
        <Link
          className="block px-4 py-2 rounded-md hover:bg-blue-400/30"
          href="/"
        >
          Home
        </Link>

        {isAdmin && (
          <Link
            className="block px-4 py-2 rounded-md hover:bg-blue-400/30"
            href="/dashboard"
          >
            Dashboard
          </Link>
        )}

        <Link
          className="block px-4 py-2 rounded-md hover:bg-blue-400/30"
          href={role === "user" ? "/profile" : "/line"}
        >
          {role === "user" ? "Profile" : "Statistic"}
        </Link>
        <Link
          className="block px-4 py-2 rounded-md hover:bg-blue-400/30"
          href={role === "user" ? "/cart" : "/promotion"}
        >
          {role === "user" ? "Cart" : "Promotion"}
        </Link>
        <button
          onClick={logout}
          className="mt-2 w-full inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
        >
          Logout
        </button>
      </>
    ) : (
      <>
        <Link
          className="block px-4 py-2 rounded-md hover:bg-blue-400/30"
          href="/"
        >
          Home
        </Link>
        <Link
          className="block px-4 py-2 rounded-md hover:bg-blue-400/30"
          href="/auth"
        >
          Login
        </Link>
      </>
    );

  return (
    <nav className="bg-blue-600 text-white shadow">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link
            className="text-xl lg:text-2xl font-bold tracking-wide"
            href="/"
          >
            Random-Pen
          </Link>

          <button
            type="button"
            className="lg:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <div className="flex flex-col gap-1.5 h-5 w-6">
              <span className="block h-0.5 w-6 bg-white" />
              <span className="block h-0.5 w-6 bg-white" />
              <span className="block h-0.5 w-6 bg-white" />
            </div>
          </button>

          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            <DesktopLinks />
          </div>
        </div>
      </div>

      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-2 mb-3 rounded-xl bg-blue-500 p-2 shadow">
          <MobileLinks />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

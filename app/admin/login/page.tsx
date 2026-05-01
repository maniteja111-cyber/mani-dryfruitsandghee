"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const login = () => {
    if (
      email === "a" &&
      password === "a"
    ) {
      localStorage.setItem(
        "admin",
        "yes"
      );

      router.push("/admin");
    } else {
      alert("Invalid Login");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f7f7f7] p-6">

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-6">
          Admin Login
        </h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="border w-full p-3 rounded-xl mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="border w-full p-3 rounded-xl mb-5"
        />

        <button
          onClick={login}
          className="w-full bg-[#ffd862] py-3 rounded-xl font-bold"
        >
          Login
        </button>

      </div>

    </main>
  );
}
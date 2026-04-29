"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  const login = () => {
    if (
      email === "admin@mani.com" &&
      password === "Mani@123"
    ) {
      setLoggedIn(true);
    } else {
      alert("Invalid Login");
    }
  };

  const addProduct = async () => {
    const { error } = await supabase.from("products").insert([
      {
        name,
        price: Number(price),
        category,
        stock: 10,
      },
    ]);

    if (!error) {
      alert("Product Added");
      setName("");
      setPrice("");
      setCategory("");
    } else {
      alert("Error");
    }
  };

  if (!loggedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full border p-6 rounded-2xl shadow">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Admin Login
          </h1>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-3 w-full mb-4 rounded-lg"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-3 w-full mb-4 rounded-lg"
          />

          <button
            onClick={login}
            className="bg-[#ffd862] w-full py-3 rounded-xl font-semibold"
          >
            Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Admin Panel
      </h1>

      <input
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-3 w-full mb-4 rounded-lg"
      />

      <input
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="border p-3 w-full mb-4 rounded-lg"
      />

      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-3 w-full mb-4 rounded-lg"
      />

      <button
        onClick={addProduct}
        className="bg-[#ffd862] px-6 py-3 rounded-xl w-full font-semibold"
      >
        Add Product
      </button>
    </main>
  );
}
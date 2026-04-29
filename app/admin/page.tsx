"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [products, setProducts] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (loggedIn) loadProducts();
  }, [loggedIn]);

  const login = () => {
    if (email === "admin@mani.com" && password === "Mani@123") {
      setLoggedIn(true);
    } else {
      alert("Invalid Login");
    }
  };

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("id");
    setProducts(data || []);
  };

  const addProduct = async () => {
    await supabase.from("products").insert([
      {
        name,
        price: Number(price),
        category,
        stock: 10,
      },
    ]);

    setName("");
    setPrice("");
    setCategory("");
    loadProducts();
  };

  const deleteProduct = async (id: number) => {
    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  };

  const updatePrice = async (id: number, price: number) => {
    const newPrice = prompt("Enter new price", price.toString());

    if (!newPrice) return;

    await supabase
      .from("products")
      .update({ price: Number(newPrice) })
      .eq("id", id);

    loadProducts();
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
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Admin Dashboard
      </h1>

      <div className="grid md:grid-cols-4 gap-3 mb-8">
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-3 rounded-lg"
        />

        <input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-3 rounded-lg"
        />

        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-3 rounded-lg"
        />

        <button
          onClick={addProduct}
          className="bg-[#ffd862] rounded-lg font-semibold"
        >
          Add Product
        </button>
      </div>

      <div className="space-y-4">
        {products.map((item) => (
          <div
            key={item.id}
            className="border rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <h2 className="font-bold text-lg">{item.name}</h2>
              <p>{item.category}</p>
              <p>₹{item.price}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => updatePrice(item.id, item.price)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              >
                Edit Price
              </button>

              <button
                onClick={() => deleteProduct(item.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
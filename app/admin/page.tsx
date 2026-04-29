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

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");

  useEffect(() => {
    if (loggedIn) loadProducts();
  }, [loggedIn]);

  const login = () => {
    if (email === "a" && password === "a") {
      setLoggedIn(true);
    } else alert("Invalid Login");
  };

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("id");
    setProducts(data || []);
  };

  const addProduct = async () => {
    await supabase.from("products").insert([
      { name, price: Number(price), category, stock: 10 },
    ]);

    setName("");
    setPrice("");
    setCategory("");
    loadProducts();
  };

  const deleteProduct = async (id: number) => {
    const ok = confirm("Delete this product?");
    if (!ok) return;

    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.price.toString());
    setEditCategory(item.category);
  };

  const saveEdit = async () => {
    await supabase
      .from("products")
      .update({
        name: editName,
        price: Number(editPrice),
        category: editCategory,
      })
      .eq("id", editingId);

    alert("Updated Successfully");
    setEditingId(null);
    loadProducts();
  };

  if (!loggedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7f7f7] p-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Admin Login
          </h1>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mani.com"
                className="mt-2 w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#ffd862]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mani@123"
                className="mt-2 w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#ffd862]"
              />
            </label>

            <button
              onClick={login}
              className="w-full bg-[#ffd862] py-3 rounded-xl font-semibold hover:bg-[#f5c347] transition"
            >
              Sign In
            </button>
          </div>
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
        <input placeholder="Name" value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-3 rounded-lg" />

        <input placeholder="Price" value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-3 rounded-lg" />

        <input placeholder="Category" value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-3 rounded-lg" />

        <button onClick={addProduct}
          className="bg-[#ffd862] rounded-lg font-semibold">
          Add Product
        </button>
      </div>

      <div className="space-y-4">
        {products.map((item) => (
          <div key={item.id}
            className="border rounded-xl p-4">

            {editingId === item.id ? (
              <div className="grid md:grid-cols-4 gap-3">
                <input value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border p-2 rounded" />

                <input value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="border p-2 rounded" />

                <input value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="border p-2 rounded" />

                <button onClick={saveEdit}
                  className="bg-green-600 text-white rounded">
                  Save
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold">{item.name}</h2>
                  <p>{item.category}</p>
                  <p>₹{item.price}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                    Edit
                  </button>

                  <button
                    onClick={() => deleteProduct(item.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg">
                    Delete
                  </button>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>
    </main>
  );
}
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
    if (email === "admin@mani.com" && password === "Mani@123") {
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
    return <main className="p-10">Login Screen Same As Previous</main>;
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
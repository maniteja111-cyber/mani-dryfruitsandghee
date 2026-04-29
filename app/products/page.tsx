"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (data) setProducts(data);
    console.log(error);
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-4xl font-bold text-center mb-10">
        Our Products
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {products.map((item) => (
          <div
            key={item.id}
            className="border rounded-2xl p-6 text-center"
          >
            <div className="h-40 bg-[#fff5cc] rounded-xl mb-4"></div>

            <p>{item.category}</p>
            <h2 className="text-xl font-semibold">{item.name}</h2>
            <p className="font-bold my-2">₹{item.price}</p>

            <button className="bg-[#ffd862] px-5 py-2 rounded-xl">
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
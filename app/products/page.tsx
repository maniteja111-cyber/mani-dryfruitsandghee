"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function ProductsPage() {
  const params = useSearchParams();

  const start =
    params.get("category") || "";

  const [category, setCategory] =
    useState(start);

  const [products, setProducts] =
    useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("products")
      .select("*");

    setProducts(data || []);
  };

  const filtered =
    category === ""
      ? products
      : products.filter(
          (x) => x.category === category
        );

  return (
    <main className="max-w-7xl mx-auto p-6">

      <h1 className="text-4xl font-bold mb-6">
        Products
      </h1>

      <select
        value={category}
        onChange={(e) =>
          setCategory(e.target.value)
        }
        className="border p-3 rounded-xl mb-8"
      >
        <option value="">
          All Categories
        </option>

        <option value="Dry Fruits">
          Dry Fruits
        </option>

        <option value="Ghee">
          Ghee
        </option>

        <option value="Pickles">
          Pickles
        </option>

        <option value="Powders">
          Powders
        </option>

      </select>

      <div className="grid md:grid-cols-4 gap-6">

        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow p-4"
          >
            <img
              src={
                item.image_url ||
                "https://images.unsplash.com/photo-1606923829579-0cb981a83e2f?w=500"
              }
              className="h-44 w-full object-cover rounded-xl"
            />

            <h3 className="font-bold mt-3">
              {item.name}
            </h3>

            <p>{item.category}</p>

            <p className="font-bold text-xl">
              ₹{item.price_250 || item.price}
            </p>

            <Link
              href={`/products/${item.id}`}
              className="block text-center mt-4 bg-[#ffd862] py-2 rounded-xl font-bold"
            >
              View Details
            </Link>
          </div>
        ))}

      </div>

    </main>
  );
}
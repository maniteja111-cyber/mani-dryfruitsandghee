"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { addToCart } from "../lib/cart";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("id");

    setProducts(data || []);
  };

  return (
    <main className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">
        Our Products
      </h1>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((item) => (
          <Card key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}

function Card({ item }: any) {
  const [size, setSize] = useState("250g");

  const getPrice = () => {
    if (size === "500g")
      return item.price_500 || item.price;

    if (size === "1kg")
      return item.price_1kg || item.price;

    return item.price_250 || item.price;
  };

  const price = getPrice();

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-xl transition overflow-hidden relative">

      {item.discount > 0 && (
        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          {item.discount}% OFF
        </div>
      )}

      <img
        src={
          item.image_url ||
          "https://images.unsplash.com/photo-1606923829579-0cb981a83e2f?w=500"
        }
        className="h-52 w-full object-cover"
      />

      <div className="p-4">

        <h2 className="font-bold text-lg">
          {item.name}
        </h2>

        <p className="text-yellow-500">
          ⭐ 4.5
        </p>

        <select
          value={size}
          onChange={(e) =>
            setSize(e.target.value)
          }
          className="border p-2 rounded-xl w-full mt-3"
        >
          <option>250g</option>
          <option>500g</option>
          <option>1kg</option>
        </select>

        <div className="mt-3">
          {item.old_price && (
            <span className="line-through text-gray-400 mr-2">
              ₹{item.old_price}
            </span>
          )}

          <span className="text-2xl font-bold">
            ₹{price}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">

          <button
            onClick={() => {
              addToCart(item, size, price);
              alert("Added to cart");
            }}
            className="bg-[#ffd862] py-2 rounded-xl font-bold"
          >
            Add Cart
          </button>

          <Link
            href={`/products/${item.id}`}
            className="border py-2 rounded-xl text-center font-bold"
          >
            Details
          </Link>

        </div>

      </div>
    </div>
  );
}
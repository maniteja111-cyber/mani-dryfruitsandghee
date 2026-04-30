"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";

function ProductsContent() {
  const params = useSearchParams();

  const start = params.get("category") || "";

  const [category, setCategory] = useState(start);
  const [products, setProducts] = useState<any[]>([]);
  const [weights, setWeights] = useState<any>({});

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

  const filtered =
    category === ""
      ? products
      : products.filter(
          (x) => x.category === category
        );

  const getPrice = (item: any) => {
    const wt = weights[item.id] || "250g";

    if (wt === "500g")
      return item.price_500 || item.price;

    if (wt === "1kg")
      return item.price_1kg || item.price;

    return item.price_250 || item.price;
  };

  const addToCart = (item: any) => {
    const wt = weights[item.id] || "250g";
    const price = getPrice(item);

    const existing =
      JSON.parse(
        localStorage.getItem("cart") || "[]"
      );

    const found = existing.find(
      (x: any) =>
        x.id === item.id &&
        x.weight === wt
    );

    if (found) {
      found.qty += 1;
    } else {
      existing.push({
        id: item.id,
        name: item.name,
        image: item.image_url,
        category: item.category,
        weight: wt,
        price,
        qty: 1,
      });
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(existing)
    );

    alert("Added to cart");
  };

  return (
    <main className="max-w-7xl mx-auto p-6">

      <h1 className="text-4xl font-bold mb-6">
        Products
      </h1>

      <div className="flex gap-4 flex-wrap mb-8">

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          className="border p-3 rounded-xl"
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

        <Link
          href="/cart"
          className="bg-black text-white px-5 py-3 rounded-xl"
        >
          View Cart
        </Link>

      </div>

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

            <select
              value={
                weights[item.id] || "250g"
              }
              onChange={(e) =>
                setWeights({
                  ...weights,
                  [item.id]:
                    e.target.value,
                })
              }
              className="border p-2 rounded-lg w-full mt-3"
            >
              <option>
                250g
              </option>
              <option>
                500g
              </option>
              <option>
                1kg
              </option>
            </select>

            <p className="font-bold text-xl mt-3">
              ₹{getPrice(item)}
            </p>

            <button
              onClick={() =>
                addToCart(item)
              }
              className="w-full mt-3 bg-green-600 text-white py-2 rounded-xl font-bold"
            >
              Add to Cart
            </button>

            <Link
              href={`/products/${item.id}`}
              className="block text-center mt-3 bg-[#ffd862] py-2 rounded-xl font-bold"
            >
              View Details
            </Link>

          </div>
        ))}

      </div>

    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
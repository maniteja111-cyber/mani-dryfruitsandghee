"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
} from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { addToCart } from "../../lib/cart";

export default function Detail() {
  const params = useParams();
  const id = params.id;

  const [product, setProduct] =
    useState<any>(null);

  const [size, setSize] =
    useState("250g");

  const [price, setPrice] =
    useState(0);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } =
      await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    setProduct(data);

    if (data)
      setPrice(
        data.price_250 ||
          data.price
      );
  };

  const change = (
    val: string
  ) => {
    setSize(val);

    if (!product) return;

    if (val === "250g")
      setPrice(
        product.price_250 ||
          product.price
      );

    if (val === "500g")
      setPrice(
        product.price_500 ||
          product.price
      );

    if (val === "1kg")
      setPrice(
        product.price_1kg ||
          product.price
      );
  };

  if (!product)
    return (
      <main className="p-10">
        Loading...
      </main>
    );

  return (
    <main className="max-w-7xl mx-auto p-6">

      <div className="grid md:grid-cols-2 gap-10">

        <img
          src={
            product.image_url ||
            "https://images.unsplash.com/photo-1606923829579-0cb981a83e2f?w=500"
          }
          className="w-full h-[450px] object-cover rounded-2xl"
        />

        <div>

          <h1 className="text-4xl font-bold">
            {product.name}
          </h1>

          <p className="mt-2 text-yellow-500">
            ⭐ 4.5 Rating
          </p>

          <p className="mt-4 text-gray-600">
            Premium healthy
            product.
          </p>

          <select
            value={size}
            onChange={(e) =>
              change(
                e.target.value
              )
            }
            className="border p-3 rounded-xl mt-6 w-full"
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

          <p className="text-4xl font-bold mt-6">
            ₹{price}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-8">

            <button
              onClick={() =>
                addToCart(
                  product,
                  size,
                  price
                )
              }
              className="bg-[#ffd862] py-4 rounded-2xl font-bold"
            >
              Add To Cart
            </button>

            <Link
              href="/cart"
              className="border py-4 rounded-2xl text-center font-bold"
            >
              View Cart
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}
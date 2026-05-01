"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*");

    const rows = data || [];

    setFeatured(rows.filter((x) => x.featured));
    setOffers(rows.filter((x) => x.discount > 0));
    setLoading(false);
  };

  const card = (item: any) => (
    <div
      key={item.id}
      className="bg-white rounded-2xl shadow p-4"
    >
      <img
        src={
          item.image_url ||
          "https://images.unsplash.com/photo-1606923829579-0cb981a83e2f?w=500"
        }
        className="h-40 w-full object-cover rounded-xl"
      />

      <h3 className="font-bold mt-3">
        {item.name}
      </h3>

      <p className="font-bold text-xl">
        ₹{item.price_250 || item.price}
      </p>

      <Link
        href={`/products/${item.id}`}
        className="inline-block mt-3 bg-[#ffd862] px-4 py-2 rounded-xl font-bold"
      >
        View
      </Link>
    </div>
  );

  return (
    <main>

      <section className="bg-[#ffd862] py-20 px-6 text-center">
        <h1 className="text-5xl font-bold">
          Premium Dry Fruits & Pure Ghee
        </h1>

        <p className="mt-4 text-xl">
          Healthy products delivered to your doorstep
        </p>

        <Link
          href="/products"
          className="inline-block mt-8 bg-black text-white px-8 py-4 rounded-2xl font-bold"
        >
          Shop Now
        </Link>
      </section>

      <section className="max-w-7xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-8">
          Shop by Category
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

          <Link href="/products?category=Dry Fruits" className="bg-white shadow rounded-2xl p-8 text-center">
            <div className="text-5xl">🥜</div>
            <div className="font-bold mt-3">Dry Fruits</div>
          </Link>

          <Link href="/products?category=Ghee" className="bg-white shadow rounded-2xl p-8 text-center">
            <div className="text-5xl">🫙</div>
            <div className="font-bold mt-3">Ghee</div>
          </Link>

          <Link href="/products?category=Pickles" className="bg-white shadow rounded-2xl p-8 text-center">
            <div className="text-5xl">🥭</div>
            <div className="font-bold mt-3">Pickles</div>
          </Link>

          <Link href="/products?category=Powders" className="bg-white shadow rounded-2xl p-8 text-center">
            <div className="text-5xl">🌶️</div>
            <div className="font-bold mt-3">Powders</div>
          </Link>

        </div>
      </section>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#ffd862] border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      <section className="max-w-7xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-6">
          ⭐ Featured Products
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          {featured.map(card)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-6 text-red-500">
          🔥 Today’s Offers
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          {offers.map(card)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-8">
          Why Choose Us
        </h2>

        <div className="grid md:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl shadow">🚚 Fast Delivery</div>
          <div className="bg-white p-6 rounded-2xl shadow">🌿 Fresh Quality</div>
          <div className="bg-white p-6 rounded-2xl shadow">💯 Trusted Products</div>
          <div className="bg-white p-6 rounded-2xl shadow">📞 Quick Support</div>
        </div>
      </section>

    </main>
  );
}
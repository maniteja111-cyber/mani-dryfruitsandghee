"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminDashboard() {
  const [products, setProducts] = useState(0);
  const [featured, setFeatured] = useState(0);
  const [offers, setOffers] = useState(0);
  const [lowStock, setLowStock] = useState(0);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("products")
      .select("*");

    const rows = data || [];

    setProducts(rows.length);
    setFeatured(
      rows.filter((x) => x.featured).length
    );
    setOffers(
      rows.filter((x) => x.discount > 0).length
    );
    setLowStock(
      rows.filter((x) => x.stock <= 5).length
    );
  };

  const card = (
    title: string,
    value: number,
    color: string
  ) => (
    <div className="bg-white rounded-2xl shadow p-6">
      <p className="text-gray-500">
        {title}
      </p>

      <h2
        className={`text-4xl font-bold mt-2 ${color}`}
      >
        {value}
      </h2>
    </div>
  );

  return (
    <main>

      <h1 className="text-4xl font-bold mb-8">
        Dashboard
      </h1>

      <div className="grid md:grid-cols-4 gap-6">

        {card(
          "Total Products",
          products,
          "text-black"
        )}

        {card(
          "Featured",
          featured,
          "text-green-600"
        )}

        {card(
          "Offers Running",
          offers,
          "text-red-500"
        )}

        {card(
          "Low Stock",
          lowStock,
          "text-orange-500"
        )}

      </div>

      <div className="bg-white mt-10 rounded-2xl shadow p-8">
        <h2 className="text-2xl font-bold mb-4">
          Quick Actions
        </h2>

        <div className="grid md:grid-cols-3 gap-4">

          <a
            href="/admin/products"
            className="bg-[#ffd862] p-4 rounded-xl font-bold text-center"
          >
            Manage Products
          </a>

          <a
            href="/admin/categories"
            className="bg-[#ffd862] p-4 rounded-xl font-bold text-center"
          >
            Categories
          </a>

          <a
            href="/admin/coupons"
            className="bg-[#ffd862] p-4 rounded-xl font-bold text-center"
          >
            Coupons
          </a>

        </div>
      </div>

    </main>
  );
}
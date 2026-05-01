"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function InventoryPage() {
  const [rows, setRows] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } =
      await supabase
        .from("products")
        .select("*")
        .order("stock");

    setRows(data || []);
    setLoading(false);
  };

  const change = async (
    item: any,
    diff: number
  ) => {
    const next =
      Number(item.stock) + diff;

    if (next < 0) return;

    await supabase
      .from("products")
      .update({
        stock: next,
      })
      .eq("id", item.id);

    load();
  };

  return (
    <main className="p-6">

      <h1 className="text-4xl font-bold mb-8">
        Inventory
      </h1>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#ffd862] border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading inventory...</p>
        </div>
      )}

      <div className="grid gap-4">

        {rows.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow p-5 flex justify-between items-center"
          >
            <div>
              <h2 className="font-bold text-xl">
                {item.name}
              </h2>

              <p>
                {item.category}
              </p>

              <p
                className={
                  item.stock <= 5
                    ? "text-red-500 font-bold"
                    : ""
                }
              >
                Stock:
                {item.stock}
              </p>
            </div>

            <div className="flex gap-3">

              <button
                onClick={() =>
                  change(
                    item,
                    -1
                  )
                }
                className="bg-red-500 text-white px-4 py-2 rounded-xl"
              >
                -1
              </button>

              <button
                onClick={() =>
                  change(
                    item,
                    1
                  )
                }
                className="bg-green-600 text-white px-4 py-2 rounded-xl"
              >
                +1
              </button>

              <button
                onClick={() =>
                  change(
                    item,
                    10
                  )
                }
                className="bg-[#ffd862] px-4 py-2 rounded-xl font-bold"
              >
                +10
              </button>

            </div>
          </div>
        ))}

      </div>

    </main>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ProductsAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [sort]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order(sort, { ascending: false });

    setRows(data || []);
    setLoading(false);
  };

  const toggle = async (
    id: number,
    key: string,
    val: any
  ) => {
    await supabase
      .from("products")
      .update({ [key]: !val })
      .eq("id", id);

    load();
  };

  const del = async (id: number) => {
    if (!confirm("Delete product?")) return;

    await supabase
      .from("products")
      .delete()
      .eq("id", id);

    load();
  };

  const duplicate = async (item: any) => {
    const copy = { ...item };

    delete copy.id;

    await supabase
      .from("products")
      .insert([
        {
          ...copy,
          name: item.name + " Copy",
        },
      ]);

    load();
  };

  const bulkPrice = async () => {
    const percent = prompt(
      "Increase % ? Example 10"
    );

    if (!percent) return;

    for (const x of rows) {
      await supabase
        .from("products")
        .update({
          price_250: Math.round(
            (x.price_250 || 0) *
              (1 +
                Number(percent) /
                  100)
          ),
          price_500: Math.round(
            (x.price_500 || 0) *
              (1 +
                Number(percent) /
                  100)
          ),
          price_1kg: Math.round(
            (x.price_1kg || 0) *
              (1 +
                Number(percent) /
                  100)
          ),
        })
        .eq("id", x.id);
    }

    load();
  };

  const stock = async (
    item: any,
    key: string,
    diff: number
  ) => {
    const val = Math.max(
      (item[key] || 0) + diff,
      0
    );

    await supabase
      .from("products")
      .update({ [key]: val })
      .eq("id", item.id);

    load();
  };

  const filtered = rows.filter((x) =>
    x.name
      ?.toLowerCase()
      .includes(
        search.toLowerCase()
      )
  );

  return (
    <main className="p-6">

      <div className="flex flex-wrap gap-3 mb-6">

        {loading && (
          <div className="w-full text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#ffd862] border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        )}

        <input
          placeholder="Search products"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="border p-3 rounded-xl"
        />

        <select
          value={sort}
          onChange={(e) =>
            setSort(
              e.target.value
            )
          }
          className="border p-3 rounded-xl"
        >
          <option value="id">
            Latest
          </option>
          <option value="price_250">
            Price
          </option>
          <option value="stock_250">
            Stock
          </option>
        </select>

        <button
          onClick={bulkPrice}
          className="bg-black text-white px-5 rounded-xl"
        >
          Bulk Price %
        </button>

      </div>

      <div className="grid gap-4">

        {filtered.map((item: any) => (

          <div
            key={item.id}
            className="bg-white rounded-2xl shadow p-5 flex flex-col lg:flex-row justify-between gap-5"
          >

            <div className="flex gap-4">

              <img
                src={
                  item.image_url ||
                  "https://via.placeholder.com/100"
                }
                className="w-24 h-24 rounded-xl object-cover"
              />

              <div>

                <h2 className="font-bold text-xl">
                  {item.name}
                </h2>

                <p>
                  {item.category}
                </p>

                <p className="font-semibold mt-1">
                  ₹{item.price_250} /
                  ₹{item.price_500} /
                  ₹{item.price_1kg}
                </p>

                <div className="text-sm space-y-2 mt-3">

                  {[
                    [
                      "stock_250",
                      "250g",
                    ],
                    [
                      "stock_500",
                      "500g",
                    ],
                    [
                      "stock_1kg",
                      "1kg",
                    ],
                  ].map(
                    (x: any) => (
                      <div
                        key={x[0]}
                        className="flex items-center gap-2"
                      >
                        <span className="w-14">
                          {x[1]}
                        </span>

                        <button
                          onClick={() =>
                            stock(
                              item,
                              x[0],
                              -1
                            )
                          }
                          className="px-2 bg-gray-200 rounded"
                        >
                          -
                        </button>

                        <span className="min-w-8 text-center font-bold">
                          {item[
                            x[0]
                          ] || 0}
                        </span>

                        <button
                          onClick={() =>
                            stock(
                              item,
                              x[0],
                              1
                            )
                          }
                          className="px-2 bg-gray-200 rounded"
                        >
                          +
                        </button>
                      </div>
                    )
                  )}

                </div>

                {item.stock_250 <
                  5 && (
                  <p className="text-red-500 font-bold mt-2">
                    Low Stock
                  </p>
                )}

              </div>

            </div>

            <div className="grid gap-2 min-w-[180px]">

              <Link
                href={`/admin/products/${item.id}`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-center"
              >
                Edit
              </Link>

              <button
                onClick={() =>
                  toggle(
                    item.id,
                    "featured",
                    item.featured
                  )
                }
                className="bg-green-600 text-white px-4 py-2 rounded-xl"
              >
                {item.featured
                  ? "Unfeature"
                  : "Feature"}
              </button>

              <button
                onClick={() =>
                  toggle(
                    item.id,
                    "hidden",
                    item.hidden
                  )
                }
                className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
              >
                {item.hidden
                  ? "Show"
                  : "Hide"}
              </button>

              <button
                onClick={() =>
                  duplicate(
                    item
                  )
                }
                className="bg-blue-500 text-white px-4 py-2 rounded-xl"
              >
                Duplicate
              </button>

              <button
                onClick={() =>
                  del(item.id)
                }
                className="bg-red-500 text-white px-4 py-2 rounded-xl"
              >
                Delete
              </button>

            </div>

          </div>

        ))}

      </div>

    </main>
  );
}
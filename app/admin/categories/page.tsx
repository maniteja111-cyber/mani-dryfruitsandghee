"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CategoriesPage() {
  const [name, setName] =
    useState("");

  const [rows, setRows] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [editId, setEditId] =
    useState<number | null>(null);

  const [editName, setEditName] =
    useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } =
      await supabase
        .from("categories")
        .select("*")
        .order("id");

    setRows(data || []);
    setLoading(false);
  };

  const add = async () => {
    if (!name) return;

    await supabase
      .from("categories")
      .insert([{ name }]);

    setName("");
    load();
  };

  const startEdit = (item: any) => {
    setEditId(item.id);
    setEditName(item.name);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  const saveEdit = async () => {
    if (!editName || !editId) return;

    await supabase
      .from("categories")
      .update({ name: editName })
      .eq("id", editId);

    setEditId(null);
    setEditName("");
    load();
  };

  const del = async (id: number) => {
    const ok = confirm(
      "Delete category?"
    );

    if (!ok) return;

    await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    load();
  };

  return (
    <main className="p-6">

      <h1 className="text-4xl font-bold mb-8">
        Categories
      </h1>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#ffd862] border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6 mb-10">

        <h2 className="text-2xl font-bold mb-5">
          Add Category
        </h2>

        <div className="flex gap-4">

          <input
            placeholder="Category Name"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            className="border p-3 rounded-xl flex-1"
          />

          <button
            onClick={add}
            className="bg-[#ffd862] px-6 rounded-xl font-bold"
          >
            Add
          </button>

        </div>

      </div>

      <div className="grid gap-4">

        {rows.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow p-5 flex justify-between items-center"
          >
            {editId === item.id ? (
              <div className="flex gap-2 flex-1">
                <input
                  value={editName}
                  onChange={(e) =>
                    setEditName(e.target.value)
                  }
                  className="border p-2 rounded-xl flex-1"
                />
                <button
                  onClick={saveEdit}
                  className="bg-green-600 text-white px-3 py-1 rounded-xl"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-400 text-white px-3 py-1 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h2 className="font-bold text-xl">
                {item.name}
              </h2>
            )}

            <div className="flex gap-2">
              {editId !== item.id && (
                <button
                  onClick={() =>
                    startEdit(item)
                  }
                  className="bg-blue-500 text-white px-3 py-1 rounded-xl"
                >
                  Edit
                </button>
              )}
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
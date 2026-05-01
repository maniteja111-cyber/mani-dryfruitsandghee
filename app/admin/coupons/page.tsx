"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CouponsPage() {
  const [rows, setRows] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [code, setCode] =
    useState("");

  const [type, setType] =
    useState("percent");

  const [value, setValue] =
    useState("");

  const [editId, setEditId] =
    useState<number | null>(null);

  const [editCode, setEditCode] =
    useState("");

  const [editType, setEditType] =
    useState("percent");

  const [editValue, setEditValue] =
    useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } =
      await supabase
        .from("coupons")
        .select("*")
        .order("id");

    if (error) {
      console.error("Error loading coupons:", error);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  };

  const add = async () => {
    if (!code || !value) return;

    const { error } = await supabase
      .from("coupons")
      .insert([
        {
          code:
            code.toUpperCase(),
          type,
          value:
            Number(value),
          active: true,
        },
      ]);

    if (error) {
      console.error("Error adding coupon:", error);
      alert("Failed to add coupon: " + error.message);
      return;
    }

    setCode("");
    setValue("");
    load();
  };

  const toggle = async (
    item: any
  ) => {
    const { error } = await supabase
      .from("coupons")
      .update({
        active:
          !item.active,
      })
      .eq("id", item.id);

    if (error) {
      console.error("Error toggling coupon:", error);
      return;
    }
    load();
  };

  const startEdit = (item: any) => {
    setEditId(item.id);
    setEditCode(item.code);
    setEditType(item.type);
    setEditValue(item.value);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditCode("");
    setEditType("percent");
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editCode || !editValue || !editId) return;

    const { error } = await supabase
      .from("coupons")
      .update({
        code: editCode.toUpperCase(),
        type: editType,
        value: Number(editValue),
      })
      .eq("id", editId);

    if (error) {
      console.error("Error editing coupon:", error);
      alert("Failed to edit: " + error.message);
      return;
    }

    setEditId(null);
    setEditCode("");
    setEditType("percent");
    setEditValue("");
    load();
  };

  const del = async (id: number) => {
    const ok = confirm(
      "Delete coupon?"
    );

    if (!ok) return;

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting coupon:", error);
      return;
    }
    load();
  };

  return (
    <main className="p-6">

      <h1 className="text-4xl font-bold mb-8">
        Coupons
      </h1>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#ffd862] border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6 mb-10">

        <h2 className="text-2xl font-bold mb-5">
          Create Coupon
        </h2>

        <div className="grid md:grid-cols-4 gap-4">

          <input
            placeholder="WELCOME10"
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

          <select
            value={type}
            onChange={(e) =>
              setType(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          >
            <option value="percent">
              Percent
            </option>

            <option value="flat">
              Flat
            </option>
          </select>

          <input
            placeholder="Value"
            value={value}
            onChange={(e) =>
              setValue(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

          <button
            onClick={add}
            className="bg-[#ffd862] rounded-xl font-bold"
          >
            Add Coupon
          </button>

        </div>

      </div>

      <div className="grid gap-4">

        {rows.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow p-5 flex flex-col gap-3"
          >
            {editId === item.id ? (
              <>
                <div className="grid md:grid-cols-4 gap-4">
                  <input
                    placeholder="WELCOME10"
                    value={editCode}
                    onChange={(e) =>
                      setEditCode(e.target.value)
                    }
                    className="border p-3 rounded-xl"
                  />

                  <select
                    value={editType}
                    onChange={(e) =>
                      setEditType(e.target.value)
                    }
                    className="border p-3 rounded-xl"
                  >
                    <option value="percent">
                      Percent
                    </option>

                    <option value="flat">
                      Flat
                    </option>
                  </select>

                  <input
                    placeholder="Value"
                    value={editValue}
                    onChange={(e) =>
                      setEditValue(e.target.value)
                    }
                    className="border p-3 rounded-xl"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="bg-green-600 text-white px-3 py-2 rounded-xl"
                    >
                      Save
                    </button>

                    <button
                      onClick={cancelEdit}
                      className="bg-gray-400 text-white px-3 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-xl">
                    {item.code}
                  </h2>

                  <p>
                    {item.type} • {item.value}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      startEdit(item)
                    }
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      toggle(item)
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-xl"
                  >
                    {item.active
                      ? "Disable"
                      : "Enable"}
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
            )}

          </div>
        ))}

      </div>

    </main>
  );
}
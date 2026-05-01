"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function EditProduct() {
  const { id }: any =
    useParams();

  const router =
    useRouter();

  const [item, setItem] =
    useState<any>(null);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    const { data, error } =
      await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
      alert(error.message);
      return;
    }

    setItem(data);
  };

  const upload = async (
    e: any,
    key: string
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const fileName =
      Date.now() +
      "-" +
      file.name.replaceAll(
        " ",
        "-"
      );

    const { error } =
      await supabase.storage
        .from("products")
        .upload(
          fileName,
          file,
          {
            upsert: true,
          }
        );

    if (error) {
      alert(error.message);
      return;
    }

    const { data } =
      supabase.storage
        .from("products")
        .getPublicUrl(
          fileName
        );

    setItem({
      ...item,
      [key]:
        data.publicUrl,
    });
  };

  const save =
    async () => {
      setSaving(true);

      const payload = {
        name: item.name,
        category:
          item.category,

        price:
          Number(
            item.price_250
          ) || 0,

        price_250:
          Number(
            item.price_250
          ) || 0,

        price_500:
          Number(
            item.price_500
          ) || 0,

        price_1kg:
          Number(
            item.price_1kg
          ) || 0,

        stock_250:
          Number(
            item.stock_250
          ) || 0,

        stock_500:
          Number(
            item.stock_500
          ) || 0,

        stock_1kg:
          Number(
            item.stock_1kg
          ) || 0,

        image_url:
          item.image_url,
        image2:
          item.image2,
        image3:
          item.image3,
        image4:
          item.image4,
      };

      const { error } =
        await supabase
          .from("products")
          .update(
            payload
          )
          .eq("id", id);

      setSaving(false);

      if (error) {
        alert(
          error.message
        );
        return;
      }

      alert(
        "Saved Successfully"
      );

      router.push(
        "/admin/products"
      );
    };

  if (!item)
    return (
      <div className="p-8">
        Loading...
      </div>
    );

  return (
    <main className="max-w-5xl mx-auto p-6">

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-3xl font-bold">
          Edit Product
        </h1>

        <button
          onClick={() =>
            router.back()
          }
          className="border px-4 py-2 rounded-xl"
        >
          Back
        </button>

      </div>

      <div className="bg-white rounded-2xl shadow p-6">

       <div className="grid md:grid-cols-2 gap-4">

<input
 value={item.name || ""}
 onChange={(e)=>setItem({...item,name:e.target.value})}
 className="border p-3 rounded-xl"
 placeholder="Product Name"
/>

<input
 value={item.category || ""}
 onChange={(e)=>setItem({...item,category:e.target.value})}
 className="border p-3 rounded-xl"
 placeholder="Category"
/>

<input
 type="number"
 value={item.price_250 || ""}
 onChange={(e)=>setItem({...item,price_250:e.target.value})}
 className="border p-3 rounded-xl"
 placeholder="250g Price"
/>

<input
 type="number"
 value={item.stock_250 || ""}
 onChange={(e)=>setItem({...item,stock_250:e.target.value})}
 className="border p-3 rounded-xl"
 placeholder="250g Stock"
/>

<input
 type="number"
 value={item.price_500 || ""}
 onChange={(e)=>setItem({...item,price_500:e.target.value})}
 className="border p-3 rounded-xl"
 placeholder="500g Price"
/>

<input
 type="number"
 value={item.stock_500 || ""}
 onChange={(e)=>setItem({...item,stock_500:e.target.value})}
 className="border p-3 rounded-xl"
 placeholder="500g Stock"
/>

<input
 type="number"
 value={item.price_1kg || ""}
 onChange={(e)=>setItem({...item,price_1kg:e.target.value})}
 className="border p-3 rounded-xl"
 placeholder="1kg Price"
/>

<input
 type="number"
 value={item.stock_1kg || ""}
 onChange={(e)=>setItem({...item,stock_1kg:e.target.value})}
 className="border p-3 rounded-xl"
 placeholder="1kg Stock"
/>

</div>

      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-6">

        {[
          "image_url",
          "image2",
          "image3",
          "image4",
        ].map(
          (
            x: any,
            i
          ) => (
            <div
              key={x}
              className="bg-white rounded-2xl shadow p-4"
            >

              <p className="font-bold mb-3">
                Image {i + 1}
              </p>

              <img
                src={
                  item[x] ||
                  "https://via.placeholder.com/400x250"
                }
                className="w-full h-48 object-cover rounded-xl"
              />

              <input
                type="file"
                onChange={(
                  e
                ) =>
                  upload(
                    e,
                    x
                  )
                }
                className="mt-3 w-full"
              />

            </div>
          )
        )}

      </div>

      <button
        onClick={save}
        disabled={
          saving
        }
        className="mt-8 bg-[#ffd862] px-8 py-3 rounded-xl font-bold"
      >
        {saving
          ? "Saving..."
          : "Save Product"}
      </button>

    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminPage() {
  const [logged,setLogged]=useState(false);
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");

  const [products,setProducts]=useState<any[]>([]);
  const [coupons,setCoupons]=useState<any[]>([]);
  const [tab,setTab]=useState("products");

  const [editId,setEditId]=useState<number|null>(null);
  const [editName,setEditName]=useState("");
  const [editCat,setEditCat]=useState("");
  const [editPrice,setEditPrice]=useState("");
  const [editStock,setEditStock]=useState("");

  const [code,setCode]=useState("");
  const [value,setValue]=useState("");

  useEffect(()=>{
    if(logged) load();
  },[logged]);

  const login=()=>{
    if(email==="a" && pass==="a") setLogged(true);
    else alert("Wrong Login");
  };

  const load=async()=>{
    const {data:p}=await supabase.from("products").select("*").order("id");
    const {data:c}=await supabase.from("coupons").select("*").order("id",{ascending:false});

    setProducts(p||[]);
    setCoupons(c||[]);
  };

  const delProduct=async(id:number)=>{
    await supabase.from("products").delete().eq("id",id);
    load();
  };

  const startEdit=(x:any)=>{
    setEditId(x.id);
    setEditName(x.name);
    setEditCat(x.category);
    setEditPrice(String(x.price));
    setEditStock(String(x.stock));
  };

  const saveEdit=async()=>{
    await supabase.from("products")
      .update({
        name:editName,
        category:editCat,
        price:Number(editPrice),
        stock:Number(editStock)
      })
      .eq("id",editId);

    setEditId(null);
    load();
    alert("Updated");
  };

  const addCoupon=async()=>{
    const {error}=await supabase.from("coupons").insert([
      {
        code:code,
        type:"percent",
        value:Number(value),
        active:true
      }
    ]);

    if(error){
      alert("Coupon error");
      return;
    }

    setCode("");
    setValue("");
    load();
    alert("Coupon Added");
  };

  const delCoupon=async(id:number)=>{
    await supabase.from("coupons").delete().eq("id",id);
    load();
  };

  if(!logged){
    return(
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center">Admin Login</h1>

          <input
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="border p-3 w-full mb-4 rounded-xl"
          />

          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={(e)=>setPass(e.target.value)}
            className="border p-3 w-full mb-4 rounded-xl"
          />

          <button
            onClick={login}
            className="w-full bg-[#ffd862] py-3 rounded-xl font-bold"
          >
            Login
          </button>
        </div>
      </main>
    );
  }

  return(
    <main className="max-w-6xl mx-auto p-6">

      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      <div className="flex gap-3 mb-8">
        <button onClick={()=>setTab("products")} className="bg-[#ffd862] px-5 py-2 rounded-xl font-bold">Products</button>
        <button onClick={()=>setTab("coupons")} className="bg-[#ffd862] px-5 py-2 rounded-xl font-bold">Coupons</button>
      </div>

      {tab==="products" && (
        <div className="space-y-4">

          {products.map((x)=>(
            <div key={x.id} className="bg-white shadow rounded-2xl p-4">

              {editId===x.id ? (
                <div className="grid md:grid-cols-4 gap-3">

                  <input value={editName}
                    onChange={(e)=>setEditName(e.target.value)}
                    className="border p-2 rounded-xl"/>

                  <input value={editCat}
                    onChange={(e)=>setEditCat(e.target.value)}
                    className="border p-2 rounded-xl"/>

                  <input value={editPrice}
                    onChange={(e)=>setEditPrice(e.target.value)}
                    className="border p-2 rounded-xl"/>

                  <input value={editStock}
                    onChange={(e)=>setEditStock(e.target.value)}
                    className="border p-2 rounded-xl"/>

                  <button
                    onClick={saveEdit}
                    className="bg-green-500 text-white py-2 rounded-xl md:col-span-2">
                    Save
                  </button>

                </div>
              ) : (
                <div className="flex justify-between items-center">

                  <div>
                    <h3 className="font-bold">{x.name}</h3>
                    <p>{x.category}</p>
                    <p>₹{x.price} | Stock {x.stock}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={()=>startEdit(x)}
                      className="bg-blue-500 text-white px-4 rounded-xl">
                      Edit
                    </button>

                    <button
                      onClick={()=>delProduct(x.id)}
                      className="bg-red-500 text-white px-4 rounded-xl">
                      Delete
                    </button>
                  </div>

                </div>
              )}

            </div>
          ))}

        </div>
      )}

      {tab==="coupons" && (
        <div>

          <div className="grid md:grid-cols-3 gap-3 mb-6">

            <input
              placeholder="WELCOME10"
              value={code}
              onChange={(e)=>setCode(e.target.value)}
              className="border p-3 rounded-xl"
            />

            <input
              placeholder="10"
              value={value}
              onChange={(e)=>setValue(e.target.value)}
              className="border p-3 rounded-xl"
            />

            <button
              onClick={addCoupon}
              className="bg-green-500 text-white rounded-xl font-bold">
              Add Coupon
            </button>

          </div>

          <div className="space-y-3">

            {coupons.map((x)=>(
              <div key={x.id}
                className="bg-white shadow rounded-2xl p-4 flex justify-between">

                <div>
                  <h3 className="font-bold">{x.code}</h3>
                  <p>{x.value}% OFF</p>
                </div>

                <button
                  onClick={()=>delCoupon(x.id)}
                  className="bg-red-500 text-white px-4 rounded-xl">
                  Delete
                </button>

              </div>
            ))}

          </div>

        </div>
      )}

    </main>
  );
}
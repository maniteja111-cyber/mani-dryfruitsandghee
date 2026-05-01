"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminOrdersPage() {
  const [orders, setOrders] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [paymentFilter, setPaymentFilter] =
    useState("All");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("id", {
        ascending: false,
      });

    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (
    id:number,
    value:string
  ) => {
    await supabase
      .from("orders")
      .update({
        status:value
      })
      .eq("id", id);

    load();
  };

  const updatePayment = async (
    id:number,
    value:string
  ) => {
    await supabase
      .from("orders")
      .update({
        payment_status:value
      })
      .eq("id", id);

    load();
  };

  const saveNote = async (
    id:number,
    note:string
  ) => {
    await supabase
      .from("orders")
      .update({
        admin_note:note
      })
      .eq("id", id);
  };

  const del = async (
    id:number
  ) => {
    if(!confirm("Delete order?"))
      return;

    await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    load();
  };

  const filtered =
    orders.filter((x:any) => {

      const q =
        search.toLowerCase();

      const searchOk =
        x.customer_name
          ?.toLowerCase()
          .includes(q) ||
        x.phone
          ?.toLowerCase()
          .includes(q) ||
        String(x.id)
          .includes(search);

      const statusOk =
        statusFilter === "All"
          ? true
          : x.status === statusFilter;

      const payOk =
        paymentFilter === "All"
          ? true
          : x.payment_status === paymentFilter;

      const row =
        new Date(
          x.created_at
        );

      let fromOk = true;
      let toOk = true;

      if(fromDate){
        fromOk =
          row >=
          new Date(fromDate);
      }

      if(toDate){
        const end =
          new Date(toDate);
        end.setHours(
          23,59,59,999
        );

        toOk =
          row <= end;
      }

      return (
        searchOk &&
        statusOk &&
        payOk &&
        fromOk &&
        toOk
      );
    });

  const badge = (
    status:string
  ) => {
    const map:any = {
      Pending:
        "bg-yellow-100 text-yellow-700",
      Confirmed:
        "bg-blue-100 text-blue-700",
      Packed:
        "bg-purple-100 text-purple-700",
      Shipped:
        "bg-indigo-100 text-indigo-700",
      Delivered:
        "bg-green-100 text-green-700",
      Cancelled:
        "bg-red-100 text-red-700"
    };

    return (
      map[status] ||
      "bg-gray-100"
    );
  };

  const printInvoice = (
    item:any
  ) => {
    const rows =
      JSON.parse(
        item.items_json || "[]"
      );

    const html = `
<html>
<head>
<title>Invoice</title>
<style>
body{
font-family:Arial;
padding:20px;
}
h1{
margin:0;
}
table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}
td,th{
border:1px solid #ddd;
padding:8px;
text-align:left;
}
.total{
font-size:22px;
font-weight:bold;
margin-top:20px;
}
.logo{
font-size:28px;
font-weight:bold;
color:#111;
}
.small{
color:#555;
}
</style>
</head>
<body>
<div class="logo">
🥜 Mani Dryfruits & Ghee
</div>

<p class="small">
Premium Healthy Foods
</p>

<hr/>

<h2>Invoice #${item.id}</h2>

<p>
Customer:
${item.customer_name}
</p>

<p>
Phone:
${item.phone}
</p>

<p>
Address:
${item.address}
</p>

<p>
Date:
${new Date(
item.created_at
).toLocaleString()}
</p>

<table>
<tr>
<th>Item</th>
<th>Qty</th>
<th>Price</th>
</tr>

${rows.map((x:any)=>
`
<tr>
<td>
${x.name} (${x.gram})
</td>
<td>
${x.qty}
</td>
<td>
₹${x.price}
</td>
</tr>
`
).join("")}

</table>

<p>
Coupon:
${item.coupon_code || "None"}
</p>

<p>
Discount:
₹${item.discount}
</p>

<p class="total">
Total:
₹${item.total}
</p>

<p>
Status:
${item.status}
</p>

<script>
window.onload=()=>{
window.print();
}
</script>

</body>
</html>
`;

    const w =
      window.open(
        "",
        "_blank"
      );

    if(w){
      w.document.write(
        html
      );
      w.document.close();
    }
  };

  return (
    <main className="p-6 max-w-7xl mx-auto">

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#ffd862] border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-5 mb-8">

        <h1 className="text-3xl font-bold mb-4">
          Orders Management
        </h1>

        <div className="grid md:grid-cols-5 gap-3">

          <input
            placeholder="Search id / name / phone"
            value={search}
            onChange={(e)=>
              setSearch(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

          <select
            value={statusFilter}
            onChange={(e)=>
              setStatusFilter(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Confirmed</option>
            <option>Packed</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e)=>
              setPaymentFilter(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Paid</option>
            <option>Failed</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e)=>
              setFromDate(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e)=>
              setToDate(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

        </div>

      </div>

      <div className="space-y-6">

        {filtered.map(
          (item:any) => {

            const rows =
              JSON.parse(
                item.items_json ||
                "[]"
              );

            const wa =
`https://wa.me/91${item.phone}?text=Hello ${item.customer_name}, your order #${item.id} is ${item.status}.`;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow p-6"
              >

                <div className="flex flex-wrap justify-between gap-3 mb-5">

                  <div>
                    <h2 className="text-2xl font-bold">
                      Order #{item.id}
                    </h2>

                    <p>
                      {item.customer_name}
                    </p>

                    <p>
                      {item.phone}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.address}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(
                        item.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap h-fit">

                    <span
                      className={`px-4 py-2 rounded-full font-bold ${badge(item.status)}`}
                    >
                      {item.status}
                    </span>

                    <span
                      className={`px-4 py-2 rounded-full font-bold ${
                        item.payment_status==="Paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {item.payment_status}
                    </span>

                  </div>

                </div>

                <div className="grid md:grid-cols-3 gap-6">

                  <div>
                    <h3 className="font-bold mb-2">
                      Items
                    </h3>

                    {rows.map(
                      (x:any,i:number)=>(
                        <p key={i}>
                          {x.name} ({x.gram}) × {x.qty}
                        </p>
                      )
                    )}

                    <p className="mt-3 text-sm text-blue-600 font-semibold">
                      Coupon:
                      {" "}
                      {item.coupon_code || "None"}
                    </p>
                  </div>

                  <div>
                    <p>
                      Subtotal:
                      ₹{item.subtotal}
                    </p>

                    <p>
                      Discount:
                      ₹{item.discount}
                    </p>

                    <p className="text-xl font-bold mt-2">
                      Total:
                      ₹{item.total}
                    </p>
                  </div>

                  <div className="space-y-3">

                    <select
                      value={item.status}
                      onChange={(e)=>
                        updateStatus(
                          item.id,
                          e.target.value
                        )
                      }
                      className="border p-2 rounded-xl w-full"
                    >
                      <option>Pending</option>
                      <option>Confirmed</option>
                      <option>Packed</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </select>

                    <select
                      value={item.payment_status}
                      onChange={(e)=>
                        updatePayment(
                          item.id,
                          e.target.value
                        )
                      }
                      className="border p-2 rounded-xl w-full"
                    >
                      <option>Pending</option>
                      <option>Paid</option>
                      <option>Failed</option>
                    </select>

                    <textarea
                      defaultValue={
                        item.admin_note || ""
                      }
                      placeholder="Admin note..."
                      onBlur={(e)=>
                        saveNote(
                          item.id,
                          e.target.value
                        )
                      }
                      className="border p-3 rounded-xl w-full h-24"
                    />

                    <a
                      href={wa}
                      target="_blank"
                      className="block text-center bg-green-500 text-white py-2 rounded-xl"
                    >
                      WhatsApp
                    </a>

                    <button
                      onClick={()=>
                        printInvoice(item)
                      }
                      className="w-full bg-black text-white py-2 rounded-xl"
                    >
                      Print Invoice
                    </button>

                    <button
                      onClick={()=>
                        del(item.id)
                      }
                      className="w-full bg-red-500 text-white py-2 rounded-xl"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>
            );
          }
        )}

      </div>

    </main>
  );
}
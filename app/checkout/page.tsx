"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] =
    useState<any[]>([]);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [payment, setPayment] =
    useState("COD");

  const [coupon, setCoupon] =
    useState("");

  const [msg, setMsg] =
    useState("");

  const [discount, setDiscount] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    const rows = JSON.parse(
      localStorage.getItem("cart") ||
        "[]"
    );

    setCart(rows);
  }, []);

  const subtotal = cart.reduce(
    (sum, x) =>
      sum + x.price * x.qty,
    0
  );

  const delivery =
    subtotal >= 999 ? 0 : 49;

  const total =
    subtotal +
    delivery -
    discount;

  const applyCoupon =
    async () => {
      if (!coupon) return;

      const { data } =
        await supabase
          .from("coupons")
          .select("*")
          .eq(
            "code",
            coupon.toUpperCase()
          )
          .eq("active", true)
          .single();

      if (!data) {
        setMsg(
          "Invalid Coupon"
        );
        setDiscount(0);
        return;
      }

      let value = 0;

      if (
        data.type ===
        "percent"
      ) {
        value = Math.floor(
          (subtotal *
            data.value) /
            100
        );
      } else {
        value = data.value;
      }

      setDiscount(value);
      setMsg(
        "Coupon Applied ✅"
      );
    };

  const placeOrder =
    async () => {
      if (
        !name ||
        !phone ||
        !address
      ) {
        alert(
          "Fill all details"
        );
        return;
      }

      setLoading(true);

       const { data, error } =
  await supabase
    .from("orders")
    .insert([
      {
        customer_name: name,
        phone: phone,
        address: address,
        items_json:
          JSON.stringify(cart),
        subtotal:
          subtotal,
        discount:
          discount,
        total: total,
        status:
          "Pending",
        payment_status:
          payment === "COD"
            ? "Pending"
            : "Paid",
      },
    ])
    .select();

if (error) {
  alert(error.message);
  setLoading(false);
  return;
}

      localStorage.removeItem(
        "cart"
      );

      router.push(
        "/order-success"
      );
    };

  return (
    <main className="max-w-6xl mx-auto p-6">

      <h1 className="text-4xl font-bold mb-8">
        Checkout
      </h1>

      <div className="grid md:grid-cols-2 gap-8">

        <div className="bg-white rounded-2xl shadow p-6 space-y-4">

          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            className="border p-3 rounded-xl w-full"
          />

          <input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            className="border p-3 rounded-xl w-full"
          />

          <textarea
            placeholder="Full Address"
            value={address}
            onChange={(e) =>
              setAddress(
                e.target.value
              )
            }
            className="border p-3 rounded-xl w-full h-28"
          />

          <select
            value={payment}
            onChange={(e) =>
              setPayment(
                e.target.value
              )
            }
            className="border p-3 rounded-xl w-full"
          >
            <option>
              COD
            </option>
            <option>
              Online
            </option>
          </select>

          <div className="flex gap-3">

            <input
              placeholder="Coupon Code"
              value={coupon}
              onChange={(e) =>
                setCoupon(
                  e.target.value
                )
              }
              className="border p-3 rounded-xl w-full"
            />

            <button
              onClick={
                applyCoupon
              }
              className="bg-[#ffd862] px-5 rounded-xl font-bold"
            >
              Apply
            </button>

          </div>

          {msg && (
            <p className="font-semibold">
              {msg}
            </p>
          )}

        </div>

        <div className="bg-white rounded-2xl shadow p-6 h-fit">

          <h2 className="text-2xl font-bold mb-5">
            Order Summary
          </h2>

          <div className="space-y-3">

            {cart.map(
              (
                item: any,
                i: number
              ) => (
                <div
                  key={i}
                  className="flex justify-between"
                >
                  <span>
                    {item.name} ×{" "}
                    {
                      item.qty
                    }
                  </span>

                  <span>
                    ₹
                    {item.price *
                      item.qty}
                  </span>
                </div>
              )
            )}

            <hr />

            <div className="flex justify-between">
              <span>
                Subtotal
              </span>
              <span>
                ₹
                {subtotal}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Delivery
              </span>
              <span>
                {delivery ===
                0
                  ? "Free"
                  : `₹${delivery}`}
              </span>
            </div>

            <div className="flex justify-between text-green-600">
              <span>
                Discount
              </span>
              <span>
                -₹
                {discount}
              </span>
            </div>

            <hr />

            <div className="flex justify-between font-bold text-xl">
              <span>
                Total
              </span>
              <span>
                ₹{total}
              </span>
            </div>

          </div>

          <button
            onClick={
              placeOrder
            }
            disabled={
              loading
            }
            className="w-full mt-6 bg-[#ffd862] py-3 rounded-xl font-bold text-lg"
          >
            {loading
              ? "Placing..."
              : "Place Order"}
          </button>

        </div>

      </div>

    </main>
  );
}
"use client";

import { useEffect, useState } from "react";

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [coupon, setCoupon] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(data);
  }, []);

  const save = (items: any[]) => {
    setCart(items);
    localStorage.setItem("cart", JSON.stringify(items));
  };

  const remove = (index: number) => {
    const items = [...cart];
    items.splice(index, 1);
    save(items);
  };

  const qtyChange = (index: number, type: string) => {
    const items = [...cart];

    if (type === "plus") items[index].qty += 1;
    if (type === "minus" && items[index].qty > 1)
      items[index].qty -= 1;

    save(items);
  };

  const subtotal = cart.reduce(
    (sum, x) => sum + x.price * x.qty,
    0
  );

  const delivery = subtotal >= 500 ? 0 : 50;

  let discount = 0;

  const applyCoupon = () => {
    if (coupon === "WELCOME10") {
      setMessage("Coupon Applied ✅");
    } else {
      setMessage("Invalid Coupon ❌");
    }
  };

  if (coupon === "WELCOME10") {
    discount = subtotal * 0.1;
  }

  const total = subtotal + delivery - discount;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Your Cart</h1>

      <div className="space-y-4">
        {cart.map((item, index) => (
          <div
            key={index}
            className="border rounded-2xl p-4 flex justify-between"
          >
            <div>
              <h2 className="font-bold">{item.name}</h2>
              <p>{item.size}</p>
              <p>₹{item.price}</p>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={() => qtyChange(index, "minus")}
                className="border px-3 py-1 rounded"
              >
                -
              </button>

              <span>{item.qty}</span>

              <button
                onClick={() => qtyChange(index, "plus")}
                className="border px-3 py-1 rounded"
              >
                +
              </button>

              <button
                onClick={() => remove(index)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 border rounded-2xl p-6">
        <div className="flex gap-3 mb-3">
          <input
            placeholder="Coupon Code"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="border p-3 rounded-xl w-full"
          />

          <button
            onClick={applyCoupon}
            className="bg-[#ffd862] px-6 rounded-xl font-bold"
          >
            Apply
          </button>
        </div>

        <p className="mb-4 font-semibold">{message}</p>

        <p>Subtotal: ₹{subtotal}</p>
        <p>Delivery: {delivery === 0 ? "Free" : `₹${delivery}`}</p>
        <p>Discount: ₹{discount}</p>

        <p className="text-3xl font-bold mt-4">
          Total: ₹{total}
        </p>

        <button className="w-full mt-6 bg-[#ffd862] py-4 rounded-2xl font-bold">
          Checkout
        </button>
      </div>
    </main>
  );
}
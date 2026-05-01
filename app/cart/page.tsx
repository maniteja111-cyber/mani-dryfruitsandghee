"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const [cart, setCart] =
    useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    let rows = JSON.parse(
      localStorage.getItem("cart") ||
        "[]"
    );

    rows = rows.map((x: any) => ({
      ...x,
      gram:
        x.gram || "250g",
      qty:
        Number(x.qty) || 1,
      price:
        Number(x.price) || 0,
    }));

    localStorage.setItem(
      "cart",
      JSON.stringify(rows)
    );

    setCart(rows);
  };

  const saveCart = (rows: any[]) => {
    localStorage.setItem(
      "cart",
      JSON.stringify(rows)
    );

    setCart(rows);
  };

  const qty = (
    id: number,
    gram: string,
    diff: number
  ) => {
    const rows = cart.map((x) =>
      x.id === id &&
      x.gram === gram
        ? {
            ...x,
            qty:
              x.qty + diff < 1
                ? 1
                : x.qty + diff,
          }
        : x
    );

    saveCart(rows);
  };

  const del = (
    id: number,
    gram: string
  ) => {
    const ok = confirm(
      "Remove item?"
    );

    if (!ok) return;

    const rows = cart.filter(
      (x) =>
        !(
          x.id === id &&
          x.gram === gram
        )
    );

    saveCart(rows);
  };

  const clearCart = () => {
    const ok = confirm(
      "Clear full cart?"
    );

    if (!ok) return;

    saveCart([]);
  };

  const totalQty = cart.reduce(
    (sum, x) =>
      sum + x.qty,
    0
  );

  const subtotal = cart.reduce(
    (sum, x) =>
      sum + x.price * x.qty,
    0
  );

  const delivery =
    subtotal >= 999
      ? 0
      : cart.length > 0
      ? 49
      : 0;

  const total =
    subtotal + delivery;

  return (
    <main className="max-w-6xl mx-auto p-6">

      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">

        <h1 className="text-4xl font-bold">
          Cart
        </h1>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="bg-red-500 text-white px-5 py-2 rounded-xl"
          >
            Clear Cart
          </button>
        )}

      </div>

      {cart.length === 0 && (
        <div className="bg-white rounded-2xl shadow p-10 text-center">

          <h2 className="text-2xl font-bold mb-3">
            Your cart is empty
          </h2>

          <Link
            href="/products"
            className="inline-block mt-3 bg-[#ffd862] px-6 py-3 rounded-xl font-bold"
          >
            Continue Shopping
          </Link>

        </div>
      )}

      {cart.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-5">

            {cart.map((item, index) => (
              <div
                key={`${item.id}-${item.gram}-${index}`}
                className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row justify-between gap-5"
              >
                <div className="flex gap-4">

                  <img
                    src={
                      item.image_url ||
                      "https://images.unsplash.com/photo-1606923829579-0cb981a83e2f?w=500"
                    }
                    className="w-24 h-24 object-cover rounded-xl"
                  />

                  <div>
                    <h2 className="font-bold text-xl">
                      {item.name}
                    </h2>

                    <p className="text-gray-500">
                      {item.gram}
                    </p>

                    <p className="font-bold text-lg mt-2">
                      ₹{item.price}
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-3 flex-wrap">

                  <button
                    onClick={() =>
                      qty(
                        item.id,
                        item.gram,
                        -1
                      )
                    }
                    className="bg-gray-200 px-3 py-1 rounded-lg"
                  >
                    -
                  </button>

                  <span className="font-bold min-w-[20px] text-center">
                    {item.qty}
                  </span>

                  <button
                    onClick={() =>
                      qty(
                        item.id,
                        item.gram,
                        1
                      )
                    }
                    className="bg-gray-200 px-3 py-1 rounded-lg"
                  >
                    +
                  </button>

                  <button
                    onClick={() =>
                      del(
                        item.id,
                        item.gram
                      )
                    }
                    className="bg-red-500 text-white px-4 py-2 rounded-xl"
                  >
                    Remove
                  </button>

                </div>
              </div>
            ))}

          </div>

          <div className="bg-white rounded-2xl shadow p-6 h-fit sticky top-24">

            <h2 className="text-2xl font-bold mb-5">
              Order Summary
            </h2>

            <div className="space-y-3 text-lg">

              <div className="flex justify-between">
                <span>Items</span>
                <span>
                  {totalQty}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  ₹{subtotal}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Delivery</span>
                <span>
                  {delivery === 0
                    ? "Free"
                    : `₹${delivery}`}
                </span>
              </div>

              <hr />

              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>
                  ₹{total}
                </span>
              </div>

            </div>

            {delivery === 0 ? (
              <p className="text-green-600 mt-4 text-sm font-semibold">
                🎉 Free Delivery Applied
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-4">
                Add more for free delivery above ₹999
              </p>
            )}

            <Link
              href="/checkout"
              className="block text-center mt-6 bg-[#ffd862] py-3 rounded-xl font-bold text-lg"
            >
              Proceed Checkout
            </Link>

            <Link
              href="/products"
              className="block text-center mt-3 border py-3 rounded-xl font-semibold"
            >
              Continue Shopping
            </Link>

          </div>

        </div>
      )}

    </main>
  );
}
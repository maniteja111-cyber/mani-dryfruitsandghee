"use client";

import Link from "next/link";

export default function OrderSuccessPage() {
  return (
    <main className="max-w-4xl mx-auto p-8 text-center">

      <div className="bg-white rounded-3xl shadow p-10">

        <div className="text-6xl mb-5">
          ✅
        </div>

        <h1 className="text-4xl font-bold mb-4">
          Order Placed Successfully
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Thank you for shopping with
          Mani Dryfruits & Ghee Stores.
        </p>

        <div className="grid md:grid-cols-2 gap-4">

          <Link
            href="/products"
            className="bg-[#ffd862] py-3 rounded-xl font-bold"
          >
            Continue Shopping
          </Link>

          <Link
            href="/"
            className="border py-3 rounded-xl font-bold"
          >
            Go Home
          </Link>

        </div>

      </div>

    </main>
  );
}
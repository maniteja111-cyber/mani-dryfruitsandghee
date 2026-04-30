"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="bg-[#ffd862] py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="font-semibold mb-2">
              100% Fresh • Trusted Quality
            </p>

            <h1 className="text-5xl font-bold leading-tight">
              Premium Dry Fruits
              <br />
              & Pure Ghee
            </h1>

            <p className="mt-5 text-lg">
              Healthy products delivered to your doorstep
              at best prices.
            </p>

            <Link
              href="/products"
              className="inline-block mt-8 bg-black text-white px-8 py-4 rounded-2xl font-bold"
            >
              Shop Now
            </Link>
          </div>

          <div className="text-8xl text-center">
            🥜🫙
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-8">
          Shop by Category
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            ["🥜", "Dry Fruits"],
            ["🫙", "Ghee"],
            ["🥭", "Pickles"],
            ["🌶️", "Powders"],
          ].map((x, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow p-8 text-center"
            >
              <div className="text-5xl">{x[0]}</div>
              <div className="font-bold mt-3">{x[1]}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-8">
          Why Choose Us
        </h2>

        <div className="grid md:grid-cols-4 gap-5">
          {[
            "🚚 Fast Delivery",
            "🌿 Fresh Quality",
            "💯 Trusted Products",
            "📞 Quick Support",
          ].map((x, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow p-6 text-center font-semibold"
            >
              {x}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
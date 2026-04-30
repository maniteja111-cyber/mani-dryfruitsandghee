"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "./lib/supabase";

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    loadProducts();

    const seen = localStorage.getItem("welcome_seen");
    if (!seen) {
      setShowPopup(true);
      localStorage.setItem("welcome_seen", "yes");
    }
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    setProducts(data || []);
  };

  const featured = products.filter((x) => x.featured === true);
  const offers = products.filter((x) => x.discount > 0);

  return (
    <main className="bg-[#fffdf5] min-h-screen">

      {/* Welcome Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center shadow-2xl">
            <h2 className="text-3xl font-bold mb-3">🎉 Welcome Offer</h2>
            <p className="text-lg mb-2">Flat 10% OFF First Order</p>
            <p className="font-bold text-2xl text-green-600 mb-5">
              Code: WELCOME10
            </p>

            <button
              onClick={() => setShowPopup(false)}
              className="bg-[#ffd862] px-6 py-3 rounded-xl font-bold"
            >
              Shop Now
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold">
            Mani Dryfruits & Ghee
          </h1>

          <div className="flex gap-3">
            <Link
              href="/products"
              className="px-4 py-2 rounded-xl bg-[#ffd862] font-semibold"
            >
              Shop
            </Link>

            <Link
              href="/cart"
              className="px-4 py-2 rounded-xl border font-semibold"
            >
              Cart
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-[#ffd862] to-yellow-300 rounded-3xl p-8 md:p-14 shadow-lg">
          <div className="grid md:grid-cols-2 gap-8 items-center">

            <div>
              <p className="font-semibold mb-2">100% Fresh • Trusted Quality</p>

              <h2 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
                Premium Dry Fruits <br /> & Pure Ghee
              </h2>

              <p className="text-lg mb-6">
                Healthy products delivered to your doorstep at best prices.
              </p>

              <Link
                href="/products"
                className="inline-block bg-black text-white px-8 py-4 rounded-2xl font-bold"
              >
                Shop Now
              </Link>
            </div>

            <div className="text-center text-8xl">
              🥜🫙
            </div>

          </div>
        </div>
      </section>

      {/* Category Section */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <h3 className="text-3xl font-bold mb-6">Shop by Category</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

          {[
            ["Dry Fruits", "🥜"],
            ["Ghee", "🫙"],
            ["Pickles", "🥭"],
            ["Powders", "🌶️"],
          ].map((item) => (
            <Link
              key={item[0]}
              href="/products"
              className="bg-white rounded-2xl p-6 text-center shadow hover:shadow-lg transition"
            >
              <div className="text-5xl mb-3">{item[1]}</div>
              <div className="font-bold text-lg">{item[0]}</div>
            </Link>
          ))}

        </div>
      </section>

      {/* Today's Offers */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-bold">🔥 Today’s Offers</h3>

          <Link href="/products" className="font-semibold">
            View All →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">

          {offers.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow overflow-hidden"
            >
              <div className="relative">
                <img
                  src={
                    item.image_url ||
                    "https://images.unsplash.com/photo-1606923829579-0cb981a83e2f?w=500"
                  }
                  className="h-48 w-full object-cover"
                />

                <span className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {item.discount}% OFF
                </span>
              </div>

              <div className="p-4">
                <h4 className="font-bold text-lg">{item.name}</h4>
                <p className="text-gray-500">{item.category}</p>

                <div className="mt-2">
                  <span className="text-xl font-bold">₹{item.price}</span>

                  {item.old_price && (
                    <span className="line-through text-gray-400 ml-2">
                      ₹{item.old_price}
                    </span>
                  )}
                </div>

                <Link
                  href="/products"
                  className="block mt-4 bg-[#ffd862] text-center py-2 rounded-xl font-semibold"
                >
                  Buy Now
                </Link>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <h3 className="text-3xl font-bold mb-6">⭐ Featured Products</h3>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">

          {featured.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow overflow-hidden"
            >
              <img
                src={
                  item.image_url ||
                  "https://images.unsplash.com/photo-1606923829579-0cb981a83e2f?w=500"
                }
                className="h-48 w-full object-cover"
              />

              <div className="p-4">
                <h4 className="font-bold text-lg">{item.name}</h4>

                <p className="text-gray-500">{item.category}</p>

                <div className="mt-2 font-bold text-xl">
                  ₹{item.price}
                </div>

                {item.offer_tag && (
                  <div className="mt-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-lg inline-block">
                    {item.offer_tag}
                  </div>
                )}

                <Link
                  href="/products"
                  className="block mt-4 border text-center py-2 rounded-xl font-semibold"
                >
                  View Product
                </Link>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 pb-14">
        <div className="bg-white rounded-3xl shadow p-8">
          <h3 className="text-3xl font-bold mb-8 text-center">
            Why Choose Us
          </h3>

          <div className="grid md:grid-cols-4 gap-6 text-center">

            <div>
              <div className="text-5xl mb-3">🚚</div>
              <p className="font-bold">Fast Delivery</p>
            </div>

            <div>
              <div className="text-5xl mb-3">🌿</div>
              <p className="font-bold">Fresh Quality</p>
            </div>

            <div>
              <div className="text-5xl mb-3">💯</div>
              <p className="font-bold">Trusted Products</p>
            </div>

            <div>
              <div className="text-5xl mb-3">📞</div>
              <p className="font-bold">Quick Support</p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8 text-center">
        <p className="text-lg font-semibold">
          Mani Dryfruits & Ghee Stores
        </p>

        <p className="text-sm text-gray-400 mt-2">
          Healthy Shopping Starts Here
        </p>
      </footer>

    </main>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    load();

    const timer = setInterval(load, 500);
    return () => clearInterval(timer);
  }, []);

  const load = () => {
    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const total = cart.reduce(
      (sum: number, x: any) => sum + x.qty,
      0
    );

    setCount(total);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">

        <Link
          href="/"
          className="text-2xl font-bold"
        >
          Mani Dryfruits
        </Link>

        <nav className="flex gap-5 font-semibold items-center">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>

          <Link
            href="/cart"
            className="relative"
          >
            Cart

            {count > 0 && (
              <span className="absolute -top-3 -right-4 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </Link>
        </nav>

      </div>
    </header>
  );
}
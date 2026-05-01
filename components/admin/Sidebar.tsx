"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const path = usePathname();

  const menu = [
    ["Dashboard", "/admin"],
    ["Products", "/admin/products"],
    ["Categories", "/admin/categories"],
    ["Orders", "/admin/orders"],
    ["Coupons", "/admin/coupons"],
    ["Inventory", "/admin/inventory"],
    ["Reports", "/admin/reports"],
  ];

  return (
    <aside className="w-64 bg-black text-white min-h-screen p-5">

      <h1 className="text-2xl font-bold mb-8">
        Mani Admin
      </h1>

      <div className="space-y-3">

        {menu.map(([name, url]) => (
          <Link
            key={url}
            href={url}
            className={`block px-4 py-3 rounded-xl ${
              path === url
                ? "bg-[#ffd862] text-black font-bold"
                : "hover:bg-gray-800"
            }`}
          >
            {name}
          </Link>
        ))}

      </div>

    </aside>
  );
}
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../../components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const path = usePathname();

  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (path === "/admin/login") {
      setOk(true);
      return;
    }

    const logged =
      localStorage.getItem("admin") === "yes";

    if (!logged) {
      router.push("/admin/login");
    } else {
      setOk(true);
    }
  }, [path]);

  if (!ok) return null;

  if (path === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex">

      <Sidebar />

      <main className="flex-1 bg-[#f8f8f8] min-h-screen p-6">
        {children}
      </main>

    </div>
  );
}
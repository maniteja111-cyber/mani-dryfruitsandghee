import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./contexts/CartContext";
import AuthProvider from "@/components/AuthProvider";
import { prisma } from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function getSettings() {
  try {
    const settings = await prisma.setting.findMany()
    return settings.reduce((acc: Record<string, string>, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {})
  } catch {
    return {}
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const siteName = settings.siteName || "MANI DRY FRUITS, PICKLES AND GHEE STORES"
  const description = settings.description || "Healthy products delivered to your doorstep. Contact: +91 9515019393 | email: manidgs9393@gmail.com"
  const logo = settings.logo || ""

  const icon = logo
    ? {
        rel: "icon",
        type: "image/png",
        url: logo.startsWith("http") ? logo : logo.startsWith("/") ? logo : `/uploads/${logo}`,
      }
    : undefined

  return {
    title: siteName,
    description,
    icons: icon ? [icon] : undefined,
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

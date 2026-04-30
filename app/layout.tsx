import "./globals.css";
import Header from "../components/Header";

export const metadata = {
  title: "Mani Dryfruits & Ghee",
  description:
    "Premium Dry Fruits, Ghee, Pickles & Powders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#fafafa]">

        <Header />

        {children}

        <footer className="bg-black text-white mt-16">
          <div className="max-w-7xl mx-auto p-8 grid md:grid-cols-3 gap-8">

            <div>
              <h3 className="font-bold text-xl mb-3">
                Mani Dryfruits
              </h3>
              <p>
                Healthy Shopping Starts Here
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-3">
                Quick Links
              </h3>

              <p>Home</p>
              <p>Products</p>
              <p>Cart</p>
            </div>

            <div>
              <h3 className="font-bold mb-3">
                Contact
              </h3>

              <p>📞 +91 XXXXX XXXXX</p>
              <p>📍 Hyderabad</p>
            </div>

          </div>

          <div className="text-center py-4 border-t border-gray-700">
            © 2026 Mani Dryfruits & Ghee Stores
          </div>
        </footer>

      </body>
    </html>
  );
}
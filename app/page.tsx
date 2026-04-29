export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      
      {/* Navbar */}
      <nav className="bg-[#ffd862] p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Mani Dryfruits & Ghee</h1>
          <div className="space-x-4 hidden md:block">
            <a href="#">Home</a>
            <a href="#">Products</a>
            <a href="#">Cart</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#fff5cc] py-16 px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Premium Dry Fruits & Pure Ghee
        </h2>
        <p className="text-lg mb-6">
          Fresh | Healthy | Trusted Quality
        </p>
        <button className="bg-[#ffd862] px-6 py-3 rounded-xl font-semibold shadow">
          Shop Now
        </button>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto py-12 px-6">
        <h3 className="text-3xl font-bold mb-8 text-center">Categories</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {["Dry Fruits", "Pickles", "Powders", "Ghee"].map((item) => (
            <div
              key={item}
              className="bg-[#fff9e6] p-6 rounded-2xl shadow text-center font-semibold hover:scale-105 transition"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-12 px-6">
        <h3 className="text-3xl font-bold mb-8 text-center">
          Featured Products
        </h3>

        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { name: "Premium Badam", price: "₹799" },
            { name: "Cow Ghee 1L", price: "₹999" },
            { name: "Cashew Nuts", price: "₹699" },
          ].map((product) => (
            <div
              key={product.name}
              className="bg-white rounded-2xl shadow p-6 text-center"
            >
              <div className="h-40 bg-[#fff5cc] rounded-xl mb-4"></div>
              <h4 className="text-xl font-semibold">{product.name}</h4>
              <p className="text-lg my-2">{product.price}</p>
              <button className="bg-[#ffd862] px-4 py-2 rounded-lg font-medium">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#ffd862] mt-12 p-6 text-center font-medium">
        © 2026 Mani Dryfruits and Ghee Stores
      </footer>
    </main>
  );
}
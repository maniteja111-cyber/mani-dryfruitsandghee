export default function ProductsPage() {
  const products = [
    { name: "Premium Almonds", price: "₹799", category: "Dry Fruits" },
    { name: "Cashew Nuts", price: "₹699", category: "Dry Fruits" },
    { name: "Cow Ghee 1L", price: "₹999", category: "Ghee" },
    { name: "Mango Pickle", price: "₹249", category: "Pickles" },
    { name: "Turmeric Powder", price: "₹199", category: "Powders" },
    { name: "Pista Premium", price: "₹899", category: "Dry Fruits" },
  ];

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <h1 className="text-4xl font-bold text-center mb-10">
        Our Products
      </h1>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {products.map((item) => (
          <div
            key={item.name}
            className="bg-white border rounded-2xl shadow-md p-6 text-center hover:shadow-xl transition"
          >
            <div className="h-40 bg-[#fff5cc] rounded-xl mb-4"></div>

            <p className="text-sm text-gray-500">{item.category}</p>
            <h2 className="text-xl font-semibold mt-1">{item.name}</h2>
            <p className="text-lg font-bold my-2">{item.price}</p>

            <button className="bg-[#ffd862] px-5 py-2 rounded-xl font-medium">
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
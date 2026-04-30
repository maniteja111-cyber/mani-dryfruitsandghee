export function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

export function saveCart(cart: any[]) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

export function addToCart(product: any, size: string, price: number) {
  const cart = getCart();

  const existing = cart.find(
    (x: any) =>
      x.id === product.id &&
      x.size === size
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      image_url: product.image_url,
      size,
      price,
      qty: 1,
    });
  }

  saveCart(cart);
}
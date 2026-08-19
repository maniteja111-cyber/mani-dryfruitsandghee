export function getCartItemId(productId: string, selectedVariant?: any): string {
  if (!selectedVariant) return productId
  const variantKey = selectedVariant.id || selectedVariant.size
  if (!variantKey) return productId
  return `${productId}-${variantKey}`
}

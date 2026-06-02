// lib/whatsapp.ts

interface OrderItem {
  product?: { name: string }
  quantity: number
  price: number
  variant?: any
}

interface OrderForMessage {
  id: string
  name: string
  total: number
  couponCode?: string | null
  discount?: number | null
  orderItems: OrderItem[]
}

export function generateOrderConfirmationMessage(order: OrderForMessage, whatsappNumber: string) {
  const itemsText = order.orderItems
    .map((item) => {
      let variantText = ''
      if (item.variant?.size) {
        variantText = ` (${item.variant.size})`
        if (item.variant.weightGrams) variantText += ` - ${item.variant.weightGrams}g`
        if (item.variant.pieces) variantText += ` - ${item.variant.pieces} pc`
      }
      return `• ${item.product?.name || 'Item'}${variantText} × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(0)}`
    })
    .join('\n')

  let message = `Hi ${order.name},\n\n`
  message += `Thank you for your order! 🙏\n\n`
  message += `Order ID: #${order.id.slice(0, 8)}\n`
  message += `Total: ₹${order.total}\n`

  if (order.couponCode) {
    message += `Coupon Applied: ${order.couponCode} (You saved ₹${order.discount || 0})\n`
  }

  message += `\nItems:\n${itemsText}\n\n`
  message += `We will process your order shortly.\n`
  message += `For any queries, just reply to this message on WhatsApp.\n\n`
  message += `Team - Mani Dry Fruits, Pickles & Ghee`

  return message
}

export function generateStatusUpdateMessage(order: { id: string; name: string }, newStatus: string, whatsappNumber: string) {
  const statusText: Record<string, string> = {
    confirmed: "has been *confirmed* and is being prepared for dispatch.",
    shipped: "has been *shipped*! 🚚\nTracking details will be shared shortly.",
    delivered: "has been *delivered* successfully! 🎉\nThank you for shopping with us.",
    cancelled: "has been *cancelled*."
  }

  const message = statusText[newStatus] || `status has been updated to *${newStatus}*.`

  return `Hi ${order.name},\n\n` +
         `Your order #${order.id.slice(0, 8)} ${message}\n\n` +
         `For any questions, reply here.\n\n` +
         `Team - Mani Dry Fruits, Pickles & Ghee`
}

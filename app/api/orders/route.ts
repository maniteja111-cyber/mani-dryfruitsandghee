import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Razorpay from 'razorpay'
import { generateOrderConfirmationMessage } from '@/lib/whatsapp'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
})

export async function POST(req: NextRequest) {
  try {
  const { items, total, paymentMethod: originalPaymentMethod, name, phone, address, city, state, pincode, couponCode, discount } = await req.json()

  // === Stock Validation (before creating order) ===
  for (const item of items) {
    const realProductId = item.productId || item.id.split('-')[0]
    const product = await prisma.product.findUnique({ where: { id: realProductId } })

    if (!product) {
      return NextResponse.json({ error: `Product not found` }, { status: 400 })
    }

    const measurementType = product.measurementType || 'quantity'
    const variant = item.selectedVariant || {}

    let required = 0
    if (measurementType === 'weight') {
      // Try weightGrams first, then parse from size (e.g., "250g" -> 250)
      if (variant.weightGrams) {
        required = variant.weightGrams * (item.quantity || 1)
      } else if (variant.size) {
        const match = variant.size.match(/(\d+)\s*(g|kg|gm)/i)
        if (match) {
          let weight = parseInt(match[1])
          if (match[2].toLowerCase() === 'kg') weight = weight * 1000
          required = weight * (item.quantity || 1)
        }
      }
    } else {
      required = (variant.pieces || 1) * (item.quantity || 1)
    }

    if (required > product.stock) {
      const stockDisplay = product.stock >= 1000 ? `${product.stock / 1000}kg` : `${product.stock}g`
      return NextResponse.json({ 
        error: `Not enough stock for "${product.name}". Only ${stockDisplay} available.` 
      }, { status: 400 })
    }
  }

  // Find or create user
  let user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    user = await prisma.user.create({
      data: { phone, name: `User ${phone.slice(-4)}` } // Default name
    })
  }

  let paymentMethod = originalPaymentMethod
  let razorpayOrderId: string | undefined
  if (paymentMethod === 'razorpay') {
    // Check if Razorpay keys are configured (not placeholder)
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your-razorpay-key-id') {
      const options = {
        amount: total * 100, // Razorpay expects amount in paisa
        currency: 'INR',
        receipt: `order_${Date.now()}`
      }
      const order = await razorpay.orders.create(options)
      razorpayOrderId = order.id
    } else {
      // For demo, skip Razorpay integration if keys not configured
      console.log('Razorpay keys not configured, proceeding with COD flow')
      paymentMethod = 'cod' // Fallback to COD
    }
  }

    // Create order first
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total,
        paymentMethod,
        razorpayOrderId,
        name,
        phone,
        address,
        city,
        state,
        pincode,
        couponCode: couponCode || null,
        discount: discount || 0,
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId || item.id.split('-')[0],
            quantity: item.quantity,
            price: item.discountPrice || item.price,
            variant: item.selectedVariant || null   // Save which size/variant was chosen
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })

    // === Stock deduction ===
    for (const item of items) {
      const realProductId = item.productId || item.id.split('-')[0]
      const product = await prisma.product.findUnique({ where: { id: realProductId } })
      if (!product) continue

      const measurementType = product.measurementType || 'quantity'
      const variant = item.selectedVariant || {}

      let deduction = 0
      if (measurementType === 'weight') {
        // Try weightGrams first, then parse from size (e.g., "250g" -> 250)
        if (variant.weightGrams) {
          deduction = variant.weightGrams * (item.quantity || 1)
        } else if (variant.size) {
          const match = variant.size.match(/(\d+)\s*(g|kg|gm)/i)
          if (match) {
            let weight = parseInt(match[1])
            if (match[2].toLowerCase() === 'kg') weight = weight * 1000
            deduction = weight * (item.quantity || 1)
          }
        }
      } else {
        deduction = (variant.pieces || 1) * (item.quantity || 1)
      }

      if (deduction > 0) {
        await prisma.product.update({
          where: { id: realProductId },
          data: { stock: Math.max(0, product.stock - deduction) }
        })
      }
    }

    // Generate WhatsApp message for admin
    const settings = await prisma.setting.findMany()
    const settingsObj = settings.reduce((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {} as Record<string, string>)

    const whatsappNumber = settingsObj.whatsappNumber || '919515019393'
    const whatsappMessage = generateOrderConfirmationMessage(order, whatsappNumber)

    return NextResponse.json({
      ...order,
      whatsappMessage
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
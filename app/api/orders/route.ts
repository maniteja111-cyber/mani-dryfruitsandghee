import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Razorpay from 'razorpay'
import { generateOrderConfirmationMessage } from '@/lib/whatsapp'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email'

const razorpay = (() => {
  try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && 
        process.env.RAZORPAY_KEY_ID !== 'your-razorpay-key-id') {
      return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      })
    }
  } catch {}
  return null
})()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, total, paymentMethod: originalPaymentMethod, name, phone, email, address, city, state, pincode, couponCode, discount, pointsRedeemed } = body

  // === Stock Validation (before creating order) ===
  for (const item of items) {
    const realProductId = item.productId || item.id.split('-')[0]
    const product = await prisma.product.findUnique({ where: { id: realProductId } })

    if (!product) {
      return NextResponse.json({ error: `Product not found` }, { status: 400 })
    }

    const variant = item.selectedVariant || {}

    let required = 0
    if (variant.size) {
      const match = variant.size.match(/(\d+)\s*(g|kg|gm)/i)
      if (match) {
        let weight = parseInt(match[1])
        if (match[2].toLowerCase() === 'kg') weight = weight * 1000
        required = weight * (item.quantity || 1)
      }
    } else {
      required = (variant.pieces || 1) * (item.quantity || 1)
    }

    const stockGrams = product.stockGrams
    if (required > 0 && required > stockGrams) {
      const stockDisplay = stockGrams >= 1000 ? `${stockGrams / 1000}kg` : `${stockGrams}g`
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
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your-razorpay-key-id' && razorpay) {
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
        email: email || `${phone}@temp.null`,
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
            variant: item.selectedVariant ? JSON.stringify(item.selectedVariant) : null
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

    // Deduct loyalty points if used
    if (pointsRedeemed > 0 && user) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { loyaltyPoints: { decrement: pointsRedeemed } }
        }),
        prisma.loyaltyTransaction.create({
          data: {
            userId: user.id,
            points: -pointsRedeemed,
            type: 'redeemed',
            description: `Redeemed ${pointsRedeemed} points for ₹${(pointsRedeemed / 100) * 50} discount`
          }
        })
      ]).catch(() => {})
    }

    // Award loyalty points for purchase (10 pts per ₹100)
    if (user && total >= 100) {
      const pointsToAdd = Math.floor(total / 100) * 10
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { loyaltyPoints: { increment: pointsToAdd } }
        }),
        prisma.loyaltyTransaction.create({
          data: {
            userId: user.id,
            points: pointsToAdd,
            type: 'purchase',
            description: `Earned ${pointsToAdd} points for ₹${total} purchase`
          }
        })
      ]).catch(() => {})

      // First purchase bonus (50 points)
      if (!user.firstPurchase) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { firstPurchase: true, loyaltyPoints: { increment: 50 } }
          }),
          prisma.loyaltyTransaction.create({
            data: {
              userId: user.id,
              points: 50,
              type: 'first_purchase',
              description: 'First purchase bonus'
            }
          })
        ]).catch(() => {})
      }
    }

    // === Stock deduction ===
    for (const item of items) {
      const realProductId = item.productId || item.id.split('-')[0]
      const product = await prisma.product.findUnique({ where: { id: realProductId } })
      if (!product) continue

      const variant = item.selectedVariant || {}

      let deduction = 0
      if (variant.size) {
        const match = variant.size.match(/(\d+)\s*(g|kg|gm)/i)
        if (match) {
          let weight = parseInt(match[1])
          if (match[2].toLowerCase() === 'kg') weight = weight * 1000
          deduction = weight * (item.quantity || 1)
        }
      } else {
        deduction = (variant.pieces || 1) * (item.quantity || 1)
      }

      if (deduction > 0) {
        await prisma.product.update({
          where: { id: realProductId },
          data: { stockGrams: Math.max(0, product.stockGrams - deduction) }
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

    // Track coupon usage
    if (couponCode && user) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } })
      if (coupon) {
        await prisma.$transaction([
          prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } }
          }),
          prisma.couponUsage.create({
            data: {
              couponId: coupon.id,
              userId: user.id,
              orderId: order.id
            }
          })
        ]).catch(() => {})
      }
    }

// Send emails in background (don't block response)
     const orderItemsForEmail = items.map((item: any) => ({
       name: item.name || `Product ${item.productId}`,
       quantity: item.quantity,
       price: item.price
     }))

     const sendEmails = settingsObj.sendOrderEmails !== 'false'

     if (sendEmails) {
       Promise.allSettled([
         sendOrderConfirmationEmail({
           customerName: name,
           customerEmail: email,
           orderId: order.id,
           items: orderItemsForEmail,
           total,
           address,
           city,
           state,
           pincode,
           paymentMethod
         }),
         sendAdminOrderNotification({
           customerName: name,
           customerEmail: email,
           customerPhone: phone,
           orderId: order.id,
           items: orderItemsForEmail,
           total,
           address,
           city,
           state,
           pincode,
           paymentMethod
         })
       ]).catch(() => {})
     }

    return NextResponse.json({
      ...order,
      whatsappMessage
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
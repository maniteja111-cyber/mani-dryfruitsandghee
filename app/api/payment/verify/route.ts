import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_secret) {
      return NextResponse.json({ error: 'Razorpay secret not configured' }, { status: 500 })
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Payment verified successfully
    // Update the order in database
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          status: 'confirmed', // or 'paid'
          paymentMethod: 'razorpay'
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment verified successfully' 
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

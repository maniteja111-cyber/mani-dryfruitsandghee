import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_SETTINGS: Record<string, string> = {
  aboutUsContent: `MANI DRY FRUITS & GHEE STORES is a premium retailer specializing in organic dry fruits, 
artisanal pickles, and pure ghee. Established with a commitment to quality and 
authenticity, we source our products directly from trusted farmers.

Our Mission
To provide customers with the highest quality natural foods that promote health 
and wellness, while supporting sustainable farming practices.

Why Choose Us
• 100% Organic and Natural Products
• Direct from Farm to Table
• No Preservatives or Artificial Additives
• Fast and Safe Delivery Across India
• Hassle-free Returns and Exchanges`,
  shippingPolicyContent: `We deliver premium dry fruits, pickles, and ghee across India with care and hygiene.

Shipping Areas: We ship to all major cities and towns across India.

Delivery Time: Typically 2-5 business days depending on location.

Shipping Charges: Free shipping on orders above ₹999. Standard shipping charge of ₹50 applies for orders below ₹999.

Packaging: All products are carefully packed in hygienic, tamper-proof packaging.

Order Tracking: You will receive a tracking number via SMS and email once your order is dispatched.`,
  refundPolicyContent: `We want you to be completely satisfied with your purchase. If you are not satisfied for any reason, we offer a 30-day money-back guarantee.

Eligibility for Refund:
• Products must be unused and in original packaging
• Request must be made within 30 days of delivery
• Products should not be expired or damaged

How to Request a Refund: Contact us at +91 9515019393 with your order details.

Refund Processing: Refunds will be processed within 5-7 business days.

Return Shipping: We will provide a prepaid return shipping label for eligible returns.`,
  privacyPolicyContent: `Last updated: June 2024

Information We Collect: We collect information you provide directly to us, including name, phone number, email, address, and order details.

How We Use Your Information:
• Process and fulfill your orders
• Send you order confirmations and updates
• Provide customer support
• Improve our products and services

Data Security: We take reasonable measures to protect your personal information.

Contact Us: If you have questions, please contact us at +91 9515019393.`,
  termsAndConditionsContent: `Last updated: June 2024

Acceptance of Terms: By accessing or using our website, you agree to be bound by these Terms and Conditions.

Product Information: We strive to provide accurate product information.

Orders: All orders are subject to our acceptance.

Payment: All payments are processed securely.

Limitation of Liability: Our liability is limited to the purchase price of the product.

Governing Law: These terms are governed by the laws of India.`,
  sendOrderEmails: 'true'
}

export async function GET() {
  try {
    const settings = await prisma.setting.findMany()
    const existingKeys = new Set(settings.map(s => s.key))
    
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      if (!existingKeys.has(key)) {
        await prisma.setting.create({ data: { key, value } })
        settings.push({ id: `new-${key}`, key, value })
      }
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json()

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Update setting error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
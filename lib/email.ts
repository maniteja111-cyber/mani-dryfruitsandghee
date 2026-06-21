import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'manidgs9393@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

const ADMIN_EMAIL = 'manidgs9393@gmail.com'

interface ContactEmailData {
  name: string
  email: string
  phone: string
  message: string
}

interface OrderEmailData {
  customerName: string
  customerEmail: string
  orderId: string
  items: Array<{ name: string; quantity: number; price: number; variant?: any }>
  total: number
  address: string
  city: string
  state: string
  pincode: string
  paymentMethod: string
}

export async function sendContactConfirmationEmail(customerEmail: string, customerName: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: '"MANI Store" <manidgs9393@gmail.com>',
      to: customerEmail,
      subject: 'We received your message - MANI DRY FRUITS',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="color: #d97706;">Thank you for contacting us!</h1>
          <p>Dear ${customerName},</p>
          <p>We have received your message. Our team will get back to you within <strong>24 hours</strong>.</p>
          <p>If your query is urgent, feel free to reach us on WhatsApp: <strong>9515019393</strong></p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>MANI DRY FRUITS, PICKLES AND GHEE STORES</strong><br>
            📞 9515019393 | ✉️ manidgs9393@gmail.com
          </p>
        </div>
      `
    })
    return true
  } catch (error) {
    console.error('Failed to send contact confirmation email:', error)
    return false
  }
}

export async function sendContactEmail(data: ContactEmailData): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: '"MANI Store" <manidgs9393@gmail.com>',
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `New Contact Form Submission from ${data.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message}</p>
        <hr>
        <p style="font-size: 12px; color: #666;">Reply to this email to respond to the customer directly.</p>
      `
    })
    return true
  } catch (error) {
    console.error('Failed to send contact email:', error)
    return false
  }
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  try {
    const itemsList = data.items.map(item => {
      const v = item.variant ? (typeof item.variant === 'string' ? JSON.parse(item.variant) : item.variant) : null
      let variantText = ''
      if (v?.size) variantText = ` (${v.size})`
      if (v?.weightGrams) variantText += ` - ${v.weightGrams}g`
      if (v?.pieces) variantText += ` - ${v.pieces} pc`
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}${variantText}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Rs.${item.price}</td>
        </tr>
      `
    }).join('')

    await transporter.sendMail({
      from: '"MANI Store" <manidgs9393@gmail.com>',
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderId}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="color: #d97706;">Thank you for your order! 🎉</h1>
          <p>Dear ${data.customerName},</p>
          <p>Your order has been confirmed. Here are your order details:</p>

          <h2 style="color: #333;">Order Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 8px; text-align: left;">Item (Variant)</th>
                <th style="padding: 8px; text-align: left;">Qty</th>
                <th style="padding: 8px; text-align: left;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <p style="font-size: 18px; font-weight: bold; margin-top: 16px;">
            Total: Rs.${data.total}
          </p>

          <h2 style="color: #333;">Delivery Address</h2>
          <p>${data.address}, ${data.city}, ${data.state} - ${data.pincode}</p>

          <div style="background: #fef3c7; padding: 12px; border-radius: 8px; margin: 16px 0;">
            <h3 style="color: #92400e; margin-top: 0;">📱 How to Track Your Order</h3>
            <p style="margin: 8px 0;">1. Save this Order ID: <strong>${data.orderId}</strong></p>
            <p style="margin: 8px 0;">2. Visit <a href="https://manidryfruitsandghee.in/my-orders">/my-orders</a> and enter your phone number</p>
            <p style="margin: 8px 0;">3. We'll update you via SMS and email</p>
          </div>

          <p style="color: #666; margin-top: 24px;">
            Payment Method: <strong>${data.paymentMethod}</strong>
          </p>

          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            Thank you for shopping with MANI DRY FRUITS, PICKLES AND GHEE STORES!<br>
            Contact: 9515019393 | manidgs9393@gmail.com
          </p>
        </div>
      `
    })
    return true
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    return false
  }
}

export async function sendAdminOrderNotification(data: OrderEmailData & { customerPhone: string }): Promise<boolean> {
  try {
    const itemsList = data.items.map(item => {
      const v = item.variant ? (typeof item.variant === 'string' ? JSON.parse(item.variant) : item.variant) : null
      let variantText = ''
      if (v?.size) variantText = ` (${v.size})`
      if (v?.weightGrams) variantText += ` - ${v.weightGrams}g`
      if (v?.pieces) variantText += ` - ${v.pieces} pc`
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}${variantText}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">Rs.${item.price}</td>
        </tr>
      `
    }).join('')

    await transporter.sendMail({
      from: '"MANI Store" <manidgs9393@gmail.com>',
      to: ADMIN_EMAIL,
      subject: `New Order Placed - ${data.orderId}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="color: #d97706;">New Order Received 🎉</h1>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Email:</strong> ${data.customerEmail}</p>
          <p><strong>Phone:</strong> ${data.customerPhone}</p>

          <h2 style="color: #333;">Order Items</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 8px; text-align: left;">Item (Variant)</th>
                <th style="padding: 8px; text-align: left;">Qty</th>
                <th style="padding: 8px; text-align: left;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <p style="font-size: 18px; font-weight: bold; margin-top: 16px;">
            Total: Rs.${data.total}
          </p>

          <h2 style="color: #333;">Delivery Address</h2>
          <p>${data.address}, ${data.city}, ${data.state} - ${data.pincode}</p>
          <p>Payment: <strong>${data.paymentMethod}</strong></p>
        </div>
      `
    })
    return true
  } catch (error) {
    console.error('Failed to send admin order notification:', error)
    return false
  }
}

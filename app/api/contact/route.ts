import { NextRequest, NextResponse } from 'next/server'
import { sendContactEmail, sendContactConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message } = await req.json()

    if (!name || !email || !phone || !message) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    // Send emails in background without blocking response
    Promise.allSettled([
      sendContactEmail({ name, email, phone, message }),
      sendContactConfirmationEmail(email, name)
    ]).catch(() => {})

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully' 
    })
  } catch (error) {
    console.error('Contact error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

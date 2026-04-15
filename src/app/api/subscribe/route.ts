import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import { welcomeEmail } from '@/lib/email/templates'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 },
      )
    }

    const existing = await prisma.newsletterSubscription.findUnique({ where: { email } })

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { error: 'This email is already subscribed to our newsletter' },
          { status: 400 },
        )
      }
      await prisma.newsletterSubscription.update({
        where: { email },
        data: {
          isActive: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      })
    } else {
      await prisma.newsletterSubscription.create({ data: { email } })
    }

    try {
      const template = welcomeEmail({ ctaHref: 'https://farmcon.in/auth/signup' })
      await transporter.sendMail({
        from: `"FarmCon" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
    }

    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter', email },
      { status: 200 },
    )
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 },
    )
  }
}

'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'

const OAUTH_ERRORS: Record<string, string> = {
  OAuthSignin: 'Error signing in with Google. Please try again.',
  OAuthCallback: 'Error during Google authentication. Please try again.',
  OAuthCreateAccount: 'Could not create account with Google.',
  EmailCreateAccount: 'Could not create account.',
  Callback: 'Error in authentication callback. Please try again.',
  OAuthAccountNotLinked: 'This Google account is not linked. Please sign in with your original method first.',
  AccessDenied: 'Access denied. You cancelled the Google sign-in.',
  default: 'An error occurred during sign in. Please try again.',
}

function LoginContent() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  useEffect(() => {
    const ref = searchParams.get('ref')
    const coupon = searchParams.get('coupon')
    if (ref) setReferralCode(ref)
    if (coupon) setCouponCode(coupon)
  }, [searchParams])

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(OAUTH_ERRORS[errorParam] || OAUTH_ERRORS.default)
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any
      localStorage.setItem('token', 'nextauth-' + user.id)
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        phone: user.phone,
        name: user.name,
        loyaltyPoints: user.loyaltyPoints,
        referralCode: user.referralCode,
        firstPurchase: user.firstPurchase
      }))
      window.dispatchEvent(new Event('userLogin'))
      router.push('/')
    }
  }, [status, session, router])

  const handleSendOtp = async () => {
    if (!phone || !/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
    setLoading(true)
    setError('')

    try {
      if (referralCode) {
        const refCheck = await fetch(`/api/referrals?check=${encodeURIComponent(referralCode)}`)
        if (refCheck.ok) {
          const refData = await refCheck.json()
          if (!refData.valid) {
            setError('Invalid referral code')
            setLoading(false)
            return
          }
        }
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, referredBy: referralCode })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.otp) setOtp(data.otp)
        setStep('otp')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to send OTP')
      }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, referredBy: referralCode, couponCode })
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        window.dispatchEvent(new Event('userLogin'))

        if (data.welcomeCoupon && data.user.phone !== '9999999999') {
          alert(`Welcome! Your referral coupon is: ${data.welcomeCoupon}\nUse this for 15% off orders above ₹200`)
        }

        if (data.user.phone === '9999999999') {
          router.push('/admin')
        } else {
          router.push('/')
        }
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid OTP')
      }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">🎁</div>
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'phone' ? 'Login / Register' : 'Enter OTP'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Earn loyalty points on every purchase!</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {referralCode && step === 'phone' && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            <p className="font-medium">🎉 You were referred!</p>
            <p className="text-xs mt-1">Code: <code className="font-bold">{referralCode}</code> — Get 15% off your first order!</p>
          </div>
        )}

        {couponCode && step === 'phone' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
            <p className="font-medium">🎟️ Coupon: <code className="font-bold">{couponCode}</code></p>
          </div>
        )}

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Enter 10-digit phone number" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
            <button onClick={handleSendOtp} disabled={loading} className="w-full py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            <button
              onClick={async () => {
                setGoogleLoading(true)
                setError('')
                try {
                  await signIn('google', {
                    callbackUrl: searchParams.get('callbackUrl') || '/',
                    redirect: true
                  })
                } catch {
                  setError('Failed to sign in with Google. Please try again.')
                } finally {
                  setGoogleLoading(false)
                }
              }}
              disabled={googleLoading}
              className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.57-3.09 3.57-5.09z"/>
                <path fill="#34A853" d="M12 22c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 22 12 22z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center">OTP sent to <strong>{phone}</strong></p>
            <div>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit OTP" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-center text-lg tracking-widest" maxLength={6} />
            </div>
            <button onClick={handleVerifyOtp} disabled={loading} className="w-full py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm">
              ← Change phone number
            </button>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-sm mb-2 text-gray-700">🎁 Earn Rewards</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <p>📅 Daily login: <strong>5 points</strong></p>
            <p>🛒 10 points per ₹100 spent</p>
            <p>🎁 First purchase: <strong>50 bonus</strong></p>
            <p>👥 Refer friends: <strong>100 points each</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>}>
      <LoginContent />
    </Suspense>
  )
}
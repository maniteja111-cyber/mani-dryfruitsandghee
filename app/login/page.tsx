'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    const coupon = searchParams.get('coupon')
    if (ref) setReferralCode(ref)
    if (coupon) setCouponCode(coupon)
  }, [searchParams])

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

        {/* Rewards info */}
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

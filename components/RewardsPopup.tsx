'use client'

import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'

interface RewardsPopupProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess?: (user: any) => void
}

export default function RewardsPopup({ isOpen, onClose, onLoginSuccess }: RewardsPopupProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search)
      const ref = urlParams.get('ref')
      const coupon = urlParams.get('coupon')
      if (ref) setReferralCode(ref)
      if (coupon) setCouponCode(coupon)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const resetForm = () => {
    setStep('phone')
    setPhone('')
    setOtp('')
    setName('')
    setEmail('')
    setError('')
    setSuccess('')
    setDailyBonusClaimed(false)
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const currentUrl = window.location.pathname + window.location.search
      await signIn('google', {
        callbackUrl: `/login?callbackUrl=${encodeURIComponent(currentUrl || '/')}`,
        redirect: true
      })
    } catch {
      setError('Failed to sign in with Google. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!phone || !/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
    setLoading(true)
    setError('')
    try {
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
        setSuccess(data.isNewUser ? 'Welcome! You earned 5 daily login points!' : 'Login successful! +5 daily bonus points!')
        setDailyBonusClaimed(true)
        if (onLoginSuccess) onLoginSuccess(data.user)
        setTimeout(() => {
          if (data.welcomeCoupon) {
            alert(`Welcome! Your referral coupon is: ${data.welcomeCoupon}\nUse this for 15% off orders above ₹200`)
          }
          onClose()
          resetForm()
        }, 1500)
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid OTP')
      }
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button onClick={() => { onClose(); resetForm(); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl z-10">&times;</button>

          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-t-2xl p-6 text-center">
            <div className="text-4xl mb-2">🎁</div>
            <h2 className="text-2xl font-bold text-white">Loyalty Rewards</h2>
            <p className="text-yellow-100 text-sm mt-1">Login or Register to earn points!</p>
          </div>

          <div className="p-6">
            {success ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-green-600 font-semibold text-lg">{success}</p>
                {dailyBonusClaimed && <p className="text-sm text-gray-500 mt-2">Redirecting...</p>}
              </div>
            ) : (
              <>
                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

                {/* Referral banner */}
                {referralCode && step === 'phone' && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    <p className="font-medium">🎉 You were referred!</p>
                    <p className="text-xs mt-1">Code: <code className="font-bold">{referralCode}</code> — Get 15% off your first order!</p>
                  </div>
                )}

                {step === 'phone' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Enter 10-digit phone number" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg" />
                    </div>
                    <button onClick={handleSendOtp} disabled={loading} className="w-full py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 transition">
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
                      type="button"
                      onClick={handleGoogleSignIn}
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
                )}

                {step === 'otp' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 text-center">OTP sent to <strong>{phone}</strong></p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                      <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit OTP" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg text-center tracking-widest" maxLength={6} />
                    </div>
                    <button onClick={handleVerifyOtp} disabled={loading} className="w-full py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 transition">
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm">
                      ← Change phone number
                    </button>
                  </div>
                )}

                {/* Rewards info */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-sm mb-3 text-gray-700">Ways to Earn Points</h3>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2"><span className="text-yellow-500">📅</span> Daily login: 5 points</div>
                    <div className="flex items-center gap-2"><span className="text-green-500">🛒</span> 10 points per ₹100 spent</div>
                    <div className="flex items-center gap-2"><span className="text-blue-500">🎁</span> First purchase: 50 bonus points</div>
                    <div className="flex items-center gap-2"><span className="text-purple-500">👥</span> Refer a friend: 100 points</div>
                  </div>
                  <hr className="my-3" />
                  <h3 className="font-semibold text-sm mb-2 text-gray-700">Redeem Rewards</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>100 pts = ₹50 off</div>
                    <div>250 pts = ₹150 off</div>
                    <div>500 pts = ₹350 off</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

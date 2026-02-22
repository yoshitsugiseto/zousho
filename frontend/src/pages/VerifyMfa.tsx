import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, Smartphone } from 'lucide-react'

export function VerifyMfa() {
    const navigate = useNavigate()
    const [verifyCode, setVerifyCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        const checkAal = async () => {
            const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
            if (data?.currentLevel === 'aal2') {
                navigate('/')
            }
            if (data?.currentLevel === 'aal1' && data?.nextLevel === 'aal1') {
                // MFAが未設定なのでSetupAccountへ
                navigate('/setup')
            }
        }
        checkAal()
    }, [navigate])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg('')
        setLoading(true)

        try {
            const factors = await supabase.auth.mfa.listFactors()
            if (factors.error) throw factors.error

            const totpFactor = factors.data.totp[0]
            if (!totpFactor) throw new Error('No TOTP factor found')

            const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
            if (challenge.error) throw challenge.error

            const verify = await supabase.auth.mfa.verify({
                factorId: totpFactor.id,
                challengeId: challenge.data.id,
                code: verifyCode
            })
            if (verify.error) throw verify.error

            navigate('/')
        } catch (err: any) {
            console.error('Verify error:', err)
            setErrorMsg('認証コードが正しくありません')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
                <div className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-blue-600" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        2段階認証
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        認証アプリで生成された6桁のコードを入力してください。
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleVerify}>
                    {errorMsg && (
                        <div className="bg-red-50 text-red-500 p-3 rounded text-sm text-center border border-red-100">
                            {errorMsg}
                        </div>
                    )}

                    <div>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Smartphone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg text-center tracking-widest py-3 border"
                                placeholder="000000"
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading || verifyCode.length !== 6}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? '認証中...' : '認証する'}
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            別のアカウントでログインする
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

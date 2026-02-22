import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, Smartphone } from 'lucide-react'

export function SetupAccount() {
    const navigate = useNavigate()
    const [step, setStep] = useState<1 | 2>(1) // 1: パスワード設定, 2: MFA自動設定

    // パスワード用
    const [password, setPassword] = useState('')
    const [passwordConfirm, setPasswordConfirm] = useState('')
    const [pwdLoading, setPwdLoading] = useState(false)
    const [pwdError, setPwdError] = useState('')

    // MFA用
    const [factorId, setFactorId] = useState('')
    const [qrCode, setQrCode] = useState('')
    const [secret, setSecret] = useState('')
    const [verifyCode, setVerifyCode] = useState('')
    const [mfaLoading, setMfaLoading] = useState(false)
    const [mfaError, setMfaError] = useState('')

    useEffect(() => {
        // すでにMFA登録済みなら早期リダイレクト（念のため）
        const checkMfa = async () => {
            const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
            if (data?.nextLevel === 'aal2') {
                navigate('/')
            }
        }
        checkMfa()
    }, [navigate])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setPwdError('')

        if (password !== passwordConfirm) {
            setPwdError('パスワードが一致しません')
            return
        }

        if (password.length < 6) {
            setPwdError('パスワードは6文字以上で入力してください')
            return
        }

        setPwdLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })
            if (error) throw error

            // パスワード設定完了、MFA設定へ
            setStep(2)
            await setupMfa()
        } catch (error: any) {
            console.error(error)
            setPwdError(error.message || 'パスワードの更新に失敗しました')
        } finally {
            setPwdLoading(false)
        }
    }

    const setupMfa = async () => {
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp'
            })
            if (error) throw error

            setFactorId(data.id)
            setQrCode(data.totp.qr_code)
            setSecret(data.totp.secret)
        } catch (error) {
            console.error('Failed to enroll MFA:', error)
            setMfaError('2段階認証の初期化に失敗しました')
        }
    }

    const handleVerifyMfa = async (e: React.FormEvent) => {
        e.preventDefault()
        setMfaError('')
        setMfaLoading(true)

        try {
            const challenge = await supabase.auth.mfa.challenge({ factorId })
            if (challenge.error) throw challenge.error

            const verify = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.data.id,
                code: verifyCode
            })
            if (verify.error) throw verify.error

            // 成功したらダッシュボードへ戻る
            navigate('/')
        } catch (error: any) {
            console.error('Verify error:', error)
            setMfaError('認証コードが正しくありません')
        } finally {
            setMfaLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
                <div className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-blue-600" />
                    <h2 className="mt-6 text-2xl font-bold text-gray-900">
                        {step === 1 ? 'アカウントの初期設定' : '2段階認証の設定'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {step === 1
                            ? 'システムを利用する前にパスワードを設定してください。'
                            : 'Google Authenticator等のアプリでQRコードを読み取ってください。'}
                    </p>
                </div>

                {step === 1 && (
                    <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
                        {pwdError && (
                            <div className="bg-red-50 text-red-500 p-3 rounded text-sm text-center border border-red-100">
                                {pwdError}
                            </div>
                        )}
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="新しいパスワード (6文字以上)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="パスワード（確認用）"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={pwdLoading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {pwdLoading ? '保存中...' : 'パスワードを設定して次へ'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <div className="mt-8 space-y-6">
                        {mfaError && (
                            <div className="bg-red-50 text-red-500 p-3 rounded text-sm text-center border border-red-100">
                                {mfaError}
                            </div>
                        )}

                        <div className="flex flex-col items-center justify-center space-y-4">
                            {qrCode ? (
                                <div className="p-2 bg-white border-2 border-dashed border-gray-300 rounded-lg">
                                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                </div>
                            ) : (
                                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                            <div className="text-sm text-center text-gray-500">
                                <p>QRコードが読み取れない場合は</p>
                                <p className="font-mono bg-gray-100 p-1 mt-1 rounded text-xs break-all">
                                    {secret}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleVerifyMfa} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 text-center mb-2">
                                    アプリに表示された6桁のコードを入力
                                </label>
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
                            <button
                                type="submit"
                                disabled={mfaLoading || verifyCode.length !== 6}
                                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {mfaLoading ? '検証中...' : '認証して設定を完了'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}

"use client"

import { signIn, useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { API_URL } from "@/lib/api"

export default function RegisterPage() {
    const router = useRouter()
    const { data: session, status } = useSession()

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (status === "loading") return
        if (!session?.accessToken) return

        const signingIn = sessionStorage.getItem("signingIn")
        if (!signingIn) return

        sessionStorage.removeItem("signingIn")

        fetch(`${API_URL}/auth/google`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                access_token: session.accessToken,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.access_token) {
                    localStorage.setItem(
                        "token",
                        data.access_token
                    )

                    router.push("/dashboard")
                }
            })
            .catch(() => {
                alert("Google signup failed")
            })
    }, [session, status, router])

    const handleGoogleSignup = () => {
        localStorage.removeItem("token")

        sessionStorage.setItem(
            "signingIn",
            "true"
        )

        signIn("google")
    }

    const handleRegister = async (
        e: React.FormEvent
    ) => {
        e.preventDefault()

        try {
            setLoading(true)

            const response = await fetch(
                `${API_URL}/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                    }),
                }
            )

            const data = await response.json()

            if (!response.ok) {
                alert(
                    data.detail ||
                    "Registration failed"
                )
                return
            }

            localStorage.setItem(
                "token",
                data.access_token
            )

            router.push("/dashboard")
        } catch (error) {
            console.error(error)
            alert("Registration failed")
        } finally {
            setLoading(false)
        }
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center">
                <p className="text-[#6e7682]">
                    Loading...
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <span
                        className="font-bold text-2xl text-[#16191d]"
                        style={{
                            fontFamily:
                                "var(--font-display)",
                        }}
                    >
                        ResumeX
                    </span>
                </div>

                <div className="bg-white border border-[#e3e1da] rounded-2xl p-8">
                    <h1
                        className="text-2xl font-bold text-[#16191d] mb-1"
                        style={{
                            fontFamily:
                                "var(--font-display)",
                        }}
                    >
                        Create account
                    </h1>

                    <p className="text-[#6e7682] text-sm mb-8">
                        Start building your resume
                    </p>

                    {/* Google Signup */}
                    <button
                        onClick={handleGoogleSignup}
                        className="w-full flex items-center justify-center gap-3 border border-[#e3e1da] rounded-xl py-3 px-4 hover:border-[#6e7682] hover:bg-[#fafaf7] transition-colors"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>

                        <span className="text-sm font-medium text-[#16191d]">
                            Sign up with Google
                        </span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center my-6">
                        <div className="flex-1 border-t border-[#e3e1da]" />
                        <span className="px-3 text-xs text-[#6e7682]">
                            OR
                        </span>
                        <div className="flex-1 border-t border-[#e3e1da]" />
                    </div>

                    {/* Email Registration */}
                    <form
                        onSubmit={handleRegister}
                        className="space-y-4"
                    >
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            className="w-full border border-[#e3e1da] rounded-xl px-4 py-3 outline-none focus:border-[#16191d]"
                            required
                        />

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            className="w-full border border-[#e3e1da] rounded-xl px-4 py-3 outline-none focus:border-[#16191d]"
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            className="w-full border border-[#e3e1da] rounded-xl px-4 py-3 outline-none focus:border-[#16191d]"
                            required
                            minLength={6}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#16191d] text-white rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading
                                ? "Creating account..."
                                : "Register"}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6 text-[#6e7682]">
                        Already have an account?{" "}
                        <a
                            href="/login"
                            className="font-medium text-[#16191d]"
                        >
                            Login
                        </a>
                    </p>

                    <p className="text-center text-xs text-[#6e7682] mt-6">
                        By creating an account, you agree
                        to our terms of service.
                    </p>
                </div>
            </div>
        </div>
    )
}
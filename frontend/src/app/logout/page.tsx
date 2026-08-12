"use client"

import { signOut } from "next-auth/react"
import { useEffect } from "react"

export default function LogoutPage() {
  useEffect(() => {
    localStorage.removeItem("token")
    signOut({ callbackUrl: "/login?logged_out=true" })
  }, [])

  return (
    <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center">
      <p className="text-[#6e7682]">Signing out...</p>
    </div>
  )
}
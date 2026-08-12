"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"

interface TokenPayload {
  name: string
  email: string
}

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Builder", href: "/builder" },
  { label: "Buddy", href: "/buddy" },
  { label: "Analyzer", href: "/analyzer" },
]

export default function AppNav() {
  const pathname = usePathname()
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    const decoded = jwtDecode<TokenPayload>(token)
    setUserName(decoded.name)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    sessionStorage.clear()
    document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.href = "/"
  }

  return (
    <nav className="border-b border-[#e3e1da] bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <span
          className="font-bold text-lg text-[#16191d] tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ResumeX
        </span>
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-[#16191d] text-white"
                  : "text-[#6e7682] hover:text-[#16191d] hover:bg-[#f1f0eb]"
                  }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {userName && (
          <span className="text-sm text-[#6e7682]">{userName}</span>
        )}
        <button
          onClick={handleLogout}
          className="text-sm text-[#6e7682] hover:text-[#16191d] border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
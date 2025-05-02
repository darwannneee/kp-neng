"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Ambil adminId dari localStorage di sisi klien
    const adminId = localStorage.getItem("adminId")

    if (!adminId) {
      router.push("/admin/login")
    }
  }, [router])

  return <>{children}</>
}
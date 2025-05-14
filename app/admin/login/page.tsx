"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLogin() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const adminId = localStorage.getItem("adminId")
    if (adminId) {
      router.push("/admin/products")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    })

    if (!res.ok) {
      setError("Invalid credentials")
      return
    }

    const { adminId } = await res.json()
    localStorage.setItem("adminId", adminId)
    router.push("/admin/products")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Login Admin</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Username atau Email</label>
            <input
              type="text"
              value={username || email}
              onChange={(e) => {
                setUsername(e.target.value)
                setEmail(e.target.value)
              }}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  )
}
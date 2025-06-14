"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

export default function Login() {
  const [email, setEmail] = useState("")
  const [passcode, setPasscode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Update the handleSubmit function to handle errors better
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!email || !passcode) {
        throw new Error("Email and passcode are required")
      }

      try {
        const supabase = createClient()

        // Check if user exists with this email and passcode
        const { data, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .eq("passcode", passcode)
          .single()

        if (fetchError || !data) {
          // For development without a database, allow a test login
          if (process.env.NODE_ENV === "development" && email === "test@example.com" && passcode === "test") {
            localStorage.setItem(
              "user",
              JSON.stringify({
                id: "test-user-id",
                name: "Test User",
                email: "test@example.com",
                isCreator: true,
              }),
            )
            router.push("/dashboard")
            return
          }

          throw new Error("Invalid email or passcode")
        }

        // Store user info in local storage
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: data.id,
            name: data.name,
            email: data.email,
            isCreator: data.is_creator,
          }),
        )

        // Redirect to dashboard
        router.push("/dashboard")
      } catch (dbError: any) {
        console.error("Database error:", dbError)

        // For development without a database, allow a test login
        if (process.env.NODE_ENV === "development" && email === "test@example.com" && passcode === "test") {
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: "test-user-id",
              name: "Test User",
              email: "test@example.com",
              isCreator: true,
            }),
          )
          router.push("/dashboard")
          return
        }

        throw new Error("Failed to connect to the database. Please check your configuration.")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Failed to login. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl font-bold text-orange-500">Project</span>
            <span className="text-2xl font-bold text-blue-500">Pilot</span>
          </div>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your email and passcode to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passcode">Passcode</Label>
              <Input
                id="passcode"
                type="password"
                placeholder="Enter your passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-500 hover:underline">
              Register
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

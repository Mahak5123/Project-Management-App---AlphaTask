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
import { generatePasscode } from "@/lib/utils"

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [passcode, setPasscode] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!name || !email) {
        throw new Error("Name and email are required")
      }

      const newPasscode = generatePasscode()
      setPasscode(newPasscode)

      const supabase = createClient()

      const { data: existingUsers, error: countError } = await supabase.from("users").select("count").single()

      if (countError) {
        throw countError
      }

      const isCreator = !existingUsers || existingUsers.count === 0

      const { error: insertError, data: insertData } = await supabase
        .from("users")
        .insert([
          {
            name,
            email,
            passcode: newPasscode,
            is_creator: isCreator,
          },
        ])
        .select()

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-4">
      <Card className="w-full max-w-md shadow-2xl bg-white/10 backdrop-blur-md border border-white/10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-3xl font-extrabold text-[#22d3ee]">AlphaTask</h1>
          </div>
          <CardTitle className="text-2xl text-center text-slate-100">Create an account</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Enter your information to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="bg-green-50/10 border-green-200/20">
                <AlertDescription className="text-green-400">
                  Account created successfully! Your passcode is:
                </AlertDescription>
              </Alert>
              <div className="p-4 bg-white/10 rounded-md text-center text-slate-100">
                <p className="text-2xl font-mono tracking-wider">{passcode}</p>
              </div>
              <p className="text-sm text-slate-400 text-center">
                Please save this passcode. You will need it to log in.
              </p>
              <Button className="w-full bg-[#22d3ee] text-black hover:bg-[#0ec2da]" onClick={() => router.push("/login")}>
                Continue to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-100">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-100">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#22d3ee] text-black hover:bg-[#0ec2da]" disabled={loading}>
                {loading ? "Creating Account..." : "Register"}
              </Button>
            </form>
          )}
        </CardContent>

        {!success && (
          <CardFooter className="flex justify-center">
            <div className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-[#22d3ee] hover:underline">
                Login
              </Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

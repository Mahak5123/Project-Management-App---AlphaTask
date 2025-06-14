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

      // Generate a passcode
      const newPasscode = generatePasscode()
      setPasscode(newPasscode)

      try {
        console.log("Creating Supabase client...")
        const supabase = createClient()
        console.log("Supabase client created successfully")

        // Check if this is the first user (creator)
        console.log("Checking for existing users...")
        const { data: existingUsers, error: countError } = await supabase.from("users").select("count").single()

        if (countError) {
          console.error("Error checking existing users:", countError)
          throw countError
        }

        console.log("Existing users check result:", existingUsers)
        const isCreator = !existingUsers || existingUsers.count === 0

        // Insert the new user
        console.log("Inserting new user:", { name, email, isCreator })
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
          console.error("Error inserting user:", insertError)
          throw insertError
        }

        console.log("User inserted successfully:", insertData)
        setSuccess(true)
      } catch (dbError: any) {
        console.error("Database error:", dbError)
        throw new Error(`Database error: ${dbError.message || "Unknown error"}`)
      }
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "Failed to register. Please try again.")
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
          <CardTitle className="text-2xl text-center">Create an account</CardTitle>
          <CardDescription className="text-center">Enter your information to get started</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  Account created successfully! Your passcode is:
                </AlertDescription>
              </Alert>
              <div className="p-4 bg-gray-100 rounded-md text-center">
                <p className="text-2xl font-mono tracking-wider">{passcode}</p>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Please save this passcode. You will need it to log in.
              </p>
              <Button className="w-full" onClick={() => router.push("/login")}>
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
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Register"}
              </Button>
            </form>
          )}
        </CardContent>
        {!success && (
          <CardFooter className="flex justify-center">
            <div className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-500 hover:underline">
                Login
              </Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"

export interface User {
  email: string
  verified: boolean
}

export function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get("authToken")?.value || null
}

export function verifyAuthToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    return {
      email: decoded.email,
      verified: decoded.verified,
    }
  } catch (error) {
    return null
  }
}

export function createAuthToken(user: User): string {
  return jwt.sign(user, process.env.JWT_SECRET || "fallback-secret", { expiresIn: "7d" })
}

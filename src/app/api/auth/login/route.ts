import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, clinicName, clinicAddress, clinicPhone } = await request.json()
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } })
    
    if (existingUser) {
      // Login existing user
      const isValid = await bcrypt.compare(password, existingUser.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }
      
      // Set cookie
      const cookieStore = await cookies()
      cookieStore.set('session', existingUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      return NextResponse.json({
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          clinicName: existingUser.clinicName,
          clinicAddress: existingUser.clinicAddress,
          clinicPhone: existingUser.clinicPhone
        }
      })
    }
    
    // Create new user (first time setup)
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        clinicName,
        clinicAddress,
        clinicPhone
      }
    })
    
    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        clinicName: user.clinicName,
        clinicAddress: user.clinicAddress,
        clinicPhone: user.clinicPhone
      }
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

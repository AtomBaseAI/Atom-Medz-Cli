import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session')?.value
    
    if (!sessionId) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    
    const user = await db.user.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        email: true,
        name: true,
        clinicName: true,
        clinicAddress: true,
        clinicPhone: true
      }
    })
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}

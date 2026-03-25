import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session')?.value
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await request.json()
    const user = await db.user.update({
      where: { id: sessionId },
      data: {
        name: data.name,
        clinicName: data.clinicName,
        clinicAddress: data.clinicAddress,
        clinicPhone: data.clinicPhone
      },
      select: {
        id: true,
        email: true,
        name: true,
        clinicName: true,
        clinicAddress: true,
        clinicPhone: true
      }
    })
    
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

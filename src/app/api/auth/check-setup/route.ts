import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const userCount = await db.user.count()
    return NextResponse.json({ hasUser: userCount > 0 })
  } catch {
    return NextResponse.json({ hasUser: false })
  }
}

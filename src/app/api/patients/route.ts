import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    
    const where = search ? {
      OR: [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } }
      ]
    } : {}
    
    const patients = await db.patient.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { bills: true }
        }
      }
    })
    
    return NextResponse.json({ patients })
  } catch (error) {
    console.error('Fetch patients error:', error)
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const patient = await db.patient.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        bloodGroup: data.bloodGroup || null,
        allergies: data.allergies || null,
        notes: data.notes || null
      }
    })
    
    return NextResponse.json({ patient })
  } catch (error) {
    console.error('Create patient error:', error)
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
  }
}

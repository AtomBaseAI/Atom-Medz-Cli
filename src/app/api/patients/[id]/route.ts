import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const patient = await db.patient.findUnique({
      where: { id },
      include: {
        bills: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: { select: { bills: true } }
      }
    })
    
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    
    return NextResponse.json({ patient })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const patient = await db.patient.update({
      where: { id },
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
    console.error('Update patient error:', error)
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Delete associated bills first
    await db.bill.deleteMany({ where: { patientId: id } })
    
    await db.patient.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete patient error:', error)
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 })
  }
}

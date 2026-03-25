import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Direct import to avoid caching issues
const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const offer = await prisma.offer.update({
      where: { id },
      data: {
        name: data.name,
        percentage: parseFloat(data.percentage),
        active: data.active
      }
    })
    
    return NextResponse.json({ offer })
  } catch (error) {
    console.error('Update offer error:', error)
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.offer.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete offer error:', error)
    return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 })
  }
}

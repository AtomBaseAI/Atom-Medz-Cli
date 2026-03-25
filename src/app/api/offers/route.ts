import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Direct Prisma client instantiation for offers API
const prisma = new PrismaClient()

export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ offers })
  } catch (error) {
    console.error('Fetch offers error:', error)
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const offer = await prisma.offer.create({
      data: {
        name: data.name,
        percentage: parseFloat(data.percentage),
        active: data.active ?? true
      }
    })
    
    return NextResponse.json({ offer })
  } catch (error) {
    console.error('Create offer error:', error)
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
  }
}

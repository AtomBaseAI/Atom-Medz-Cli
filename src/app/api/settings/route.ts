import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Direct Prisma client instantiation for settings API
const prisma = new PrismaClient()

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          taxEnabled: false,
          gstNumber: '',
          cgstPercentage: 0,
          sgstPercentage: 0,
          offersEnabled: false
        }
      })
    }
    
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Fetch settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          taxEnabled: data.taxEnabled ?? false,
          gstNumber: data.gstNumber || '',
          cgstPercentage: data.cgstPercentage ?? 0,
          sgstPercentage: data.sgstPercentage ?? 0,
          offersEnabled: data.offersEnabled ?? false
        }
      })
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          taxEnabled: data.taxEnabled,
          gstNumber: data.gstNumber ?? settings.gstNumber,
          cgstPercentage: data.cgstPercentage ?? settings.cgstPercentage,
          sgstPercentage: data.sgstPercentage ?? settings.sgstPercentage,
          offersEnabled: data.offersEnabled
        }
      })
    }
    
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

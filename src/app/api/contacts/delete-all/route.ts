import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (password !== 'kk2bva6a') {
      return NextResponse.json({ error: 'Password errata' }, { status: 401 });
    }
    
    await prisma.contact.deleteMany({});
    
    return NextResponse.json({ success: true, message: 'Database svuotato' });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  id: string;
}

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { id } = params;

    const theme = await prisma.theme.findUnique({
      where: { id },
    });

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(theme);
  } catch (error) {
    console.error('Failed to fetch theme:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { id } = params;

    const theme = await prisma.theme.findUnique({
      where: { id },
    });

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    await prisma.theme.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete theme:', error);
    return NextResponse.json(
      { error: 'Failed to delete theme' },
      { status: 500 }
    );
  }
} 
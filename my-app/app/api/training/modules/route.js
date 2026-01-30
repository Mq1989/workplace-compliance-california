import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import TrainingModule from '@/lib/models/TrainingModule';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const modules = await TrainingModule.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json(modules);
  } catch (error) {
    console.error('Error fetching training modules:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

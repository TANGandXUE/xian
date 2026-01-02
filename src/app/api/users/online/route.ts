import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { RawUser } from '@/entities/user/model';
import { processUsers } from '@/entities/user/api';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    const fileContents = await fs.readFile(dataPath, 'utf8');
    const rawUsers: RawUser[] = JSON.parse(fileContents);
    const processedUsers = processUsers(rawUsers);

    return NextResponse.json({
      success: true,
      data: processedUsers,
    });
  } catch (error) {
    console.error('Failed to load users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load users' },
      { status: 500 }
    );
  }
}

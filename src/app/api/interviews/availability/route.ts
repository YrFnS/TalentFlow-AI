// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

// In-memory store for availability settings (per interviewerId)
// In production this would be persisted in a database
const availabilityStore: Record<string, {
  interviewerId: string;
  interviewerName: string;
  slots: Array<{
    dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
  }>;
  slotDuration: number;  // minutes
  bufferBetween: number; // minutes
  timezone: string;
}> = {};

// Seed with default availability
availabilityStore['interviewer-1'] = {
  interviewerId: 'interviewer-1',
  interviewerName: 'Sarah Chen',
  slots: [
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 1, startTime: '14:00', endTime: '17:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 3, startTime: '10:00', endTime: '13:00' },
    { dayOfWeek: 3, startTime: '15:00', endTime: '17:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 4, startTime: '14:00', endTime: '16:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '11:00' },
  ],
  slotDuration: 30,
  bufferBetween: 15,
  timezone: 'Asia/Riyadh',
};

// GET: Get interviewer availability settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const interviewerId = searchParams.get('interviewerId') || 'interviewer-1';

    const availability = availabilityStore[interviewerId];

    if (!availability) {
      // Return default empty availability
      return NextResponse.json({
        interviewerId,
        interviewerName: '',
        slots: [],
        slotDuration: 30,
        bufferBetween: 15,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Failed to fetch availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

// POST: Set/update availability
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interviewerId, interviewerName, slots, slotDuration, bufferBetween, timezone } = body;

    if (!interviewerId) {
      return NextResponse.json(
        { error: 'interviewerId is required' },
        { status: 400 }
      );
    }

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: 'At least one availability slot is required' },
        { status: 400 }
      );
    }

    const availability = {
      interviewerId,
      interviewerName: interviewerName || '',
      slots: slots.map((s: { dayOfWeek: number; startTime: string; endTime: string }) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      slotDuration: slotDuration || 30,
      bufferBetween: bufferBetween || 15,
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    availabilityStore[interviewerId] = availability;

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Failed to save availability:', error);
    return NextResponse.json(
      { error: 'Failed to save availability' },
      { status: 500 }
    );
  }
}

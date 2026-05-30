// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

// In-memory slot store reference (shared with slots route)
// Since we can't import from slots route directly in Next.js App Router,
// we maintain our own copy here. In production, this would use a database.
interface SchedulingSlot {
  id: string;
  interviewerId: string;
  interviewerName: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'available' | 'booked';
  bookedBy: { name: string; email: string } | null;
  token: string;
  jobTitle: string;
  companyName: string;
  location: string;
}

// Shared store - in production this would be database
const bookingStore: Record<string, SchedulingSlot> = {};

// Seed the same mock data as slots route
function seedMockSlots() {
  const now = new Date();
  const interviewerId = 'interviewer-1';
  const interviewerName = 'Sarah Chen';
  const jobTitle = 'Senior Frontend Engineer';
  const companyName = 'TechVision Inc.';
  const location = 'Google Meet — link will be sent after booking';

  const daysToAdd = [1, 2, 3, 4, 5];
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00'];

  daysToAdd.forEach((dayOffset, idx) => {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) date.setDate(date.getDate() + 1);
    if (dayOfWeek === 6) date.setDate(date.getDate() + 2);

    const timeStr = times[idx % times.length];
    const [hours, minutes] = timeStr.split(':').map(Number);

    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(slotDate);
    endDate.setMinutes(endDate.getMinutes() + 30);

    const slotId = `slot-mock-${idx + 1}`;
    const token = `tok-${Date.now()}-${idx}`;

    bookingStore[slotId] = {
      id: slotId,
      interviewerId,
      interviewerName,
      startTime: slotDate.toISOString(),
      endTime: endDate.toISOString(),
      duration: 30,
      status: 'available',
      bookedBy: null,
      token,
      jobTitle,
      companyName,
      location,
    };
  });
}

seedMockSlots();

// POST: Candidate books a slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slotId, candidateName, candidateEmail } = body;

    if (!slotId || !candidateName || !candidateEmail) {
      return NextResponse.json(
        { error: 'slotId, candidateName, and candidateEmail are required' },
        { status: 400 }
      );
    }

    const slot = bookingStore[slotId];

    if (!slot) {
      // Try to find by token
      const tokenSlot = Object.values(bookingStore).find(s => s.token === slotId);
      if (!tokenSlot) {
        return NextResponse.json(
          { error: 'Slot not found' },
          { status: 404 }
        );
      }
    }

    const targetSlot = bookingStore[slotId];

    if (!targetSlot) {
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }

    if (targetSlot.status === 'booked') {
      return NextResponse.json(
        { error: 'This slot has already been booked' },
        { status: 409 }
      );
    }

    // Mark as booked
    targetSlot.status = 'booked';
    targetSlot.bookedBy = {
      name: candidateName,
      email: candidateEmail,
    };

    return NextResponse.json({
      success: true,
      slot: targetSlot,
    });
  } catch (error) {
    console.error('Failed to book slot:', error);
    return NextResponse.json(
      { error: 'Failed to book slot' },
      { status: 500 }
    );
  }
}

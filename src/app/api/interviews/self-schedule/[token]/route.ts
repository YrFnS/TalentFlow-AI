import { NextRequest, NextResponse } from 'next/server';

// In-memory slot store reference - mirrors the slots store
// In production this would use a database
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

const tokenStore: Record<string, SchedulingSlot> = {};

// Seed the same mock data
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

    const slot: SchedulingSlot = {
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

    tokenStore[token] = slot;
    tokenStore[slotId] = slot;
  });
}

seedMockSlots();

// GET: Verify scheduling token and return slot details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find slot by token
    const slot = tokenStore[token];

    if (!slot) {
      return NextResponse.json(
        { error: 'Invalid or expired scheduling link' },
        { status: 404 }
      );
    }

    // Return slot details (including available slots for the same interviewer)
    const interviewerSlots = Object.values(tokenStore).filter(
      (s) => s.interviewerId === slot.interviewerId && s.status === 'available'
    );

    return NextResponse.json({
      slot: {
        id: slot.id,
        interviewerName: slot.interviewerName,
        jobTitle: slot.jobTitle,
        companyName: slot.companyName,
        location: slot.location,
        status: slot.status,
        bookedBy: slot.bookedBy,
      },
      availableSlots: interviewerSlots.map((s) => ({
        id: s.id,
        token: s.token,
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.duration,
        status: s.status,
      })),
    });
  } catch (error) {
    console.error('Failed to verify token:', error);
    return NextResponse.json(
      { error: 'Failed to verify scheduling link' },
      { status: 500 }
    );
  }
}

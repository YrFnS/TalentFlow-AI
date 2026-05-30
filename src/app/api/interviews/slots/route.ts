import { NextRequest, NextResponse } from 'next/server';

// In-memory slot store
// In production this would be persisted in a database
interface SchedulingSlot {
  id: string;
  interviewerId: string;
  interviewerName: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  duration: number;  // minutes
  status: 'available' | 'booked';
  bookedBy: { name: string; email: string } | null;
  token: string; // unique token for self-scheduling link
  jobTitle: string;
  companyName: string;
  location: string;
}

const slotsStore: Record<string, SchedulingSlot> = {};

// Seed some mock slots for demo
function seedMockSlots() {
  const now = new Date();
  const interviewerId = 'interviewer-1';
  const interviewerName = 'Sarah Chen';
  const jobTitle = 'Senior Frontend Engineer';
  const companyName = 'TechVision Inc.';
  const location = 'Google Meet — link will be sent after booking';

  // Generate 5 available slots across the next 5 business days
  const daysToAdd = [1, 2, 3, 4, 5]; // next 5 days
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00'];

  daysToAdd.forEach((dayOffset, idx) => {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) date.setDate(date.getDate() + 1); // Sunday -> Monday
    if (dayOfWeek === 6) date.setDate(date.getDate() + 2); // Saturday -> Monday

    const timeStr = times[idx % times.length];
    const [hours, minutes] = timeStr.split(':').map(Number);

    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(slotDate);
    endDate.setMinutes(endDate.getMinutes() + 30);

    const slotId = `slot-mock-${idx + 1}`;
    const token = `tok-${Date.now()}-${idx}`;

    slotsStore[slotId] = {
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

// Initialize mock data
seedMockSlots();

// Export for use in self-schedule route
export { slotsStore };

// Helper to generate slots from availability
function generateSlotsFromAvailability(
  interviewerId: string,
  daysToGenerate: number
): SchedulingSlot[] {
  // Import availability from the availability store
  // Since we can't directly import, we'll use a simplified approach
  const defaultSlots = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 1, startTime: '14:00', endTime: '17:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 3, startTime: '10:00', endTime: '13:00' },
    { dayOfWeek: 3, startTime: '15:00', endTime: '17:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 4, startTime: '14:00', endTime: '16:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '11:00' },
  ];

  const slotDuration = 30;
  const bufferBetween = 15;
  const interviewerName = 'Sarah Chen';
  const jobTitle = 'Senior Frontend Engineer';
  const companyName = 'TechVision Inc.';
  const location = 'Google Meet — link will be sent after booking';

  const newSlots: SchedulingSlot[] = [];
  const now = new Date();
  now.setDate(now.getDate() + 1); // Start from tomorrow

  for (let d = 0; d < daysToGenerate; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const dayOfWeek = date.getDay();

    const daySlots = defaultSlots.filter(s => s.dayOfWeek === dayOfWeek);
    for (const slot of daySlots) {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);

      let current = new Date(date);
      current.setHours(startH, startM, 0, 0);

      const end = new Date(date);
      end.setHours(endH, endM, 0, 0);

      while (current.getTime() + slotDuration * 60000 <= end.getTime()) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + slotDuration * 60000);
        const slotId = `slot-gen-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const token = `tok-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        const newSlot: SchedulingSlot = {
          id: slotId,
          interviewerId,
          interviewerName,
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          duration: slotDuration,
          status: 'available',
          bookedBy: null,
          token,
          jobTitle,
          companyName,
          location,
        };

        slotsStore[slotId] = newSlot;
        newSlots.push(newSlot);

        current = new Date(slotEnd.getTime() + bufferBetween * 60000);
      }
    }
  }

  return newSlots;
}

// GET: Get available slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const interviewerId = searchParams.get('interviewerId') || 'interviewer-1';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const generate = searchParams.get('generate');
    const daysToGenerate = parseInt(searchParams.get('days') || '14', 10);

    // If generate flag is set, generate new slots
    if (generate === 'true') {
      const newSlots = generateSlotsFromAvailability(interviewerId, daysToGenerate);
      return NextResponse.json({ generated: newSlots.length, slots: newSlots });
    }

    // Filter existing slots
    let slots = Object.values(slotsStore).filter(
      (s) => s.interviewerId === interviewerId
    );

    if (fromDate) {
      const from = new Date(fromDate);
      slots = slots.filter((s) => new Date(s.startTime) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      slots = slots.filter((s) => new Date(s.startTime) <= to);
    }

    // Sort by start time
    slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Failed to fetch slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slots' },
      { status: 500 }
    );
  }
}

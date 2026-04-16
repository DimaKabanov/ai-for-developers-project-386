const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

export interface TestEventType {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
}

export interface BookingData {
  eventTypeId: string;
  startTime: string;
  guestName: string;
  guestEmail: string;
  guestNote?: string;
}

export async function createEventType(data: TestEventType): Promise<TestEventType> {
  const response = await fetch(`${API_BASE_URL}/admin/event-types`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create event type: ${response.status}`);
  }

  return response.json();
}

export async function deleteEventType(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/event-types/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete event type: ${response.status}`);
  }
}

export async function createBooking(data: BookingData): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/public/event-types/${data.eventTypeId}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startTime: data.startTime,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestNote: data.guestNote,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create booking: ${response.status}`);
  }

  return response.json();
}

export async function getAvailableSlots(eventTypeId: string): Promise<Array<{
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}>> {
  const response = await fetch(`${API_BASE_URL}/public/event-types/${eventTypeId}/slots`);

  if (!response.ok) {
    throw new Error(`Failed to fetch slots: ${response.status}`);
  }

  return response.json();
}

export async function findAvailableSlot(eventTypeId: string, dayOffset = 1): Promise<{
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}> {
  const slots = await getAvailableSlots(eventTypeId);

  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + dayOffset);
  const targetDateStr = targetDate.toISOString().split('T')[0];

  const availableSlot = slots.find(slot => {
    const slotDate = slot.startTime.split('T')[0];
    return slotDate === targetDateStr && slot.isAvailable;
  });

  if (!availableSlot) {
    throw new Error(`No available slots found for event type ${eventTypeId} on ${targetDateStr}`);
  }

  return availableSlot;
}

export async function cleanupTestEventType(id: string): Promise<void> {
  try {
    await deleteEventType(id);
  } catch {
    // Ignore errors during cleanup
  }
}

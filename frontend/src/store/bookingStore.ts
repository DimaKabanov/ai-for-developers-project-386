import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BookingState {
  // Slot selection
  eventTypeId: string | null;
  slotId: string | null;
  selectedDate: string | null; // ISO date string
  selectedTime: string | null; // ISO datetime string

  // Guest info
  guestName: string;
  guestEmail: string;
  guestNote: string;

  // Actions
  setSlotSelection: (data: {
    eventTypeId: string;
    slotId: string;
    selectedDate: string;
    selectedTime: string;
  }) => void;
  setGuestInfo: (data: { guestName: string; guestEmail: string; guestNote: string }) => void;
  reset: () => void;
  hasSlotSelection: () => boolean;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      // Initial state
      eventTypeId: null,
      slotId: null,
      selectedDate: null,
      selectedTime: null,
      guestName: '',
      guestEmail: '',
      guestNote: '',

      // Set slot selection from calendar page
      setSlotSelection: ({ eventTypeId, slotId, selectedDate, selectedTime }) =>
        set({
          eventTypeId,
          slotId,
          selectedDate,
          selectedTime,
        }),

      // Set guest info from confirmation form
      setGuestInfo: ({ guestName, guestEmail, guestNote }) =>
        set({
          guestName,
          guestEmail,
          guestNote,
        }),

      // Reset all state after successful booking
      reset: () =>
        set({
          eventTypeId: null,
          slotId: null,
          selectedDate: null,
          selectedTime: null,
          guestName: '',
          guestEmail: '',
          guestNote: '',
        }),

      // Check if slot is selected
      hasSlotSelection: () => {
        const state = get();
        return !!(state.eventTypeId && state.slotId && state.selectedTime);
      },
    }),
    {
      name: 'booking-storage',
    }
  )
);

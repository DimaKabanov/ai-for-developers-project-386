import type { EventTypeSummary, Owner, Slot, Booking, CreateBookingRequest } from '../types/api';

const API_BASE_URL = 'http://localhost:3000';

/**
 * API клиент для работы с бэкендом
 */
export const apiClient = {
  /**
   * Получить список доступных типов событий
   */
  async fetchEventTypes(): Promise<EventTypeSummary[]> {
    const response = await fetch(`${API_BASE_URL}/public/event-types`);

    if (!response.ok) {
      throw new Error(`Failed to fetch event types: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Получить список типов событий для admin
   */
  async fetchAdminEventTypes(): Promise<EventTypeSummary[]> {
    const response = await fetch(`${API_BASE_URL}/admin/event-types`);

    if (!response.ok) {
      throw new Error(`Failed to fetch admin event types: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Получить информацию о владельце календаря
   */
  async fetchOwner(): Promise<Owner> {
    const response = await fetch(`${API_BASE_URL}/public/owner`);

    if (!response.ok) {
      throw new Error(`Failed to fetch owner: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Получить доступные слоты для выбранного типа события
   */
  async fetchAvailableSlots(eventTypeId: string): Promise<Slot[]> {
    const response = await fetch(`${API_BASE_URL}/public/event-types/${eventTypeId}/slots`);

    if (!response.ok) {
      throw new Error(`Failed to fetch slots: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Создать бронирование
   */
  async createBooking(eventTypeId: string, data: CreateBookingRequest): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/public/event-types/${eventTypeId}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create booking: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Создать новый тип события (admin)
   */
  async createEventType(data: {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
  }): Promise<EventTypeSummary> {
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
  },

  /**
   * Обновить тип события (admin)
   */
  async updateEventType(
    eventTypeId: string,
    data: {
      name: string;
      description: string;
      durationMinutes: number;
    }
  ): Promise<EventTypeSummary> {
    const response = await fetch(`${API_BASE_URL}/admin/event-types/${eventTypeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update event type: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Удалить тип события (admin)
   */
  async deleteEventType(eventTypeId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/event-types/${eventTypeId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete event type: ${response.status}`);
    }
  },

  /**
   * Получить список предстоящих встреч (admin)
   */
  async fetchUpcomingBookings(): Promise<Booking[]> {
    const response = await fetch(`${API_BASE_URL}/admin/bookings`);

    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.status}`);
    }

    return response.json();
  },
};

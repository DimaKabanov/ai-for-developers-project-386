import "@typespec/http";

using TypeSpec.Http;

namespace CalendarBooking;

/** Статус бронирования */
enum BookingStatus {
  /** Бронирование подтверждено */
  confirmed,

  /** Бронирование отменено */
  cancelled,
}

/** Бронирование слота гостем.
 *  На одно и то же время не может существовать двух бронирований,
 *  даже если они относятся к разным типам событий.
 */
model Booking {
  /** Уникальный идентификатор бронирования */
  id: string;

  /** Идентификатор типа события */
  eventTypeId: string;

  /** Название типа события (денормализовано для удобства отображения) */
  eventTypeName: string;

  /** Дата и время начала встречи (ISO 8601) */
  startTime: utcDateTime;

  /** Дата и время окончания встречи (ISO 8601) */
  endTime: utcDateTime;

  /** Имя гостя */
  guestName: string;

  /** Email гостя */
  guestEmail: string;

  /** Примечание гостя (опционально) */
  guestNote?: string;

  /** Статус бронирования */
  status: BookingStatus;

  /** Дата и время создания бронирования (ISO 8601) */
  createdAt: utcDateTime;
}

/** Тело запроса для создания бронирования гостем */
model CreateBookingRequest {
  /** Дата и время начала желаемого слота (ISO 8601).
   *  Должна входить в окно ближайших 14 дней от текущей даты.
   *  Если слот уже занят, сервер вернёт 409 Conflict.
   */
  startTime: utcDateTime;

  /** Имя гостя (обязательно) */
  guestName: string;

  /** Email гостя (обязательно) */
  guestEmail: string;

  /** Примечание к встрече (опционально) */
  guestNote?: string;
}

/** Ошибка конфликта при попытке забронировать уже занятый слот */
model BookingConflictError {
  /** Код ошибки */
  code: "SLOT_ALREADY_BOOKED";

  /** Человекочитаемое сообщение */
  message: string;

  /** Начало занятого слота */
  conflictingStartTime: utcDateTime;
}

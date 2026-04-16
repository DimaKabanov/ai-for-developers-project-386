import "@typespec/http";

using TypeSpec.Http;

namespace CalendarBooking;

/** Тип события, созданный владельцем календаря.
 *  Определяет категорию встречи с её названием, описанием и длительностью.
 */
model EventType {
  /** Уникальный идентификатор типа события */
  id: string;

  /** Название типа события, отображаемое гостям */
  name: string;

  /** Описание типа события */
  description: string;

  /** Длительность встречи в минутах */
  durationMinutes: int32;
}

/** Тело запроса для создания типа события */
model CreateEventTypeRequest {
  /** Уникальный идентификатор (задаётся владельцем) */
  id: string;

  /** Название типа события */
  name: string;

  /** Описание типа события */
  description: string;

  /** Длительность встречи в минутах */
  durationMinutes: int32;
}

/** Тело запроса для обновления типа события */
model UpdateEventTypeRequest {
  /** Название типа события */
  name: string;

  /** Описание типа события */
  description: string;

  /** Длительность встречи в минутах */
  durationMinutes: int32;
}

/** Публичное представление типа события для гостей.
 *  Содержит только данные, необходимые для выбора встречи.
 */
model EventTypeSummary {
  /** Уникальный идентификатор типа события */
  id: string;

  /** Название типа события */
  name: string;

  /** Описание типа события */
  description: string;

  /** Длительность встречи в минутах */
  durationMinutes: int32;
}

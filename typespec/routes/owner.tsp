import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace CalendarBooking;

/**
 * Административные маршруты для владельца календаря.
 * Авторизация отсутствует — владелец единственный и предзадан в системе.
 *
 * Сценарии владельца:
 * 1. Создать тип события (POST /admin/event-types)
 * 2. Посмотреть список всех типов событий (GET /admin/event-types)
 * 3. Посмотреть список предстоящих бронирований (GET /admin/bookings)
 */
@route("/admin")
@tag("Owner")
namespace OwnerRoutes {

  /**
   * Управление типами событий.
   */
  @route("/event-types")
  namespace EventTypeManagement {

    /**
     * Создать новый тип события.
     * Владелец задаёт id, название, описание и длительность в минутах.
     */
    @post
    @summary("Создать тип события")
    op createEventType(
      @body body: CreateEventTypeRequest,
    ): {
      @statusCode statusCode: 201;
      @body eventType: EventType;
    } | {
      /** Тип события с таким id уже существует */
      @statusCode statusCode: 409;
      @body error: { code: "EVENT_TYPE_ID_CONFLICT"; message: string };
    } | {
      @statusCode statusCode: 422;
      @body error: { code: "VALIDATION_ERROR"; message: string; details: string[] };
    };

    /**
     * Получить список всех типов событий.
     */
    @get
    @summary("Список типов событий")
    op listEventTypes(): {
      @statusCode statusCode: 200;
      @body eventTypes: EventType[];
    };
  }

  /**
   * Просмотр бронирований.
   */
  @route("/bookings")
  namespace BookingManagement {

    /**
     * Получить список предстоящих бронирований по всем типам событий.
     * Бронирования отсортированы по startTime (ближайшие первыми).
     * Возвращаются только бронирования со статусом confirmed и startTime >= now.
     */
    @get
    @summary("Список предстоящих бронирований")
    op listUpcomingBookings(): {
      @statusCode statusCode: 200;
      @body bookings: Booking[];
    };
  }
}

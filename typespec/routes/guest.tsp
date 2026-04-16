import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace CalendarBooking;

/**
 * Публичные маршруты для гостей. Авторизация не требуется.
 * Гость не создаёт аккаунт и не входит в систему.
 *
 * Сценарии гостя:
 * 1. Просмотреть список видов брони (GET /public/event-types)
 * 2. Получить доступные слоты для выбранного типа события (GET /public/event-types/{id}/slots)
 *    — слоты возвращаются только в окне ближайших 14 дней
 *    — слот помечен isAvailable: false если занят (независимо от типа события)
 * 3. Создать бронирование на выбранный слот (POST /public/event-types/{id}/bookings)
 *    — 409 Conflict если слот уже занят
 */
@route("/public")
@tag("Guest")
namespace GuestRoutes {
  /**
   * Публичный профиль владельца календаря.
   */
  @route("/owner")
  namespace OwnerProfile {
    @get
    @summary("Информация о владельце календаря")
    op getPublicInfo(): {
      @statusCode statusCode: 200;
      @body owner: Owner;
    };
  }


  /**
   * Просмотр типов событий.
   */
  @route("/event-types")
  namespace EventTypeBrowse {

    /**
     * Получить список доступных видов брони.
     * Гость видит название, описание и длительность каждого типа.
     */
    @get
    @summary("Список видов брони")
    op listEventTypes(): {
      @statusCode statusCode: 200;
      @body eventTypes: EventTypeSummary[];
    };

    /**
     * Получить доступные временные слоты для выбранного типа события.
     *
     * Правила формирования слотов:
     * - Окно: [текущая дата, текущая дата + 14 дней]
     * - Рабочие часы: 09:00-18:00 UTC
     * - Шаг сетки слотов равен durationMinutes выбранного типа события
     * - endTime каждого слота = startTime + durationMinutes типа события
     * - Слот недоступен (isAvailable: false), если на этот временной
     *   промежуток уже существует хотя бы одно бронирование любого типа.
     */
    @get
    @route("/{id}/slots")
    @summary("Доступные слоты на ближайшие 14 дней")
    op listAvailableSlots(
      @path id: string,
    ): {
      @statusCode statusCode: 200;
      @body slots: Slot[];
    } | {
      /** Тип события с указанным id не найден */
      @statusCode statusCode: 404;
      @body error: { code: "EVENT_TYPE_NOT_FOUND"; message: string };
    };

    /**
     * Создать бронирование на выбранный слот.
     *
     * Правила:
     * - startTime должен быть в пределах ближайших 14 дней.
     * - startTime должен совпадать с началом слота из сетки:
     *   рабочие часы 09:00-18:00 UTC, шаг = durationMinutes выбранного типа.
     * - Слот считается занятым если любое бронирование пересекается
     *   по времени с [startTime, startTime + durationMinutes], вне зависимости
     *   от типа события.
     * - При конфликте возвращается 409 Conflict.
     */
    @post
    @route("/{id}/bookings")
    @summary("Создать бронирование")
    op createBooking(
      @path id: string,
      @body body: CreateBookingRequest,
    ): {
      @statusCode statusCode: 201;
      @body booking: Booking;
    } | {
      /** Тип события с указанным id не найден */
      @statusCode statusCode: 404;
      @body error: { code: "EVENT_TYPE_NOT_FOUND"; message: string };
    } | {
      /**
       * Слот уже занят другим бронированием.
       * Происходит даже если конфликтующее бронирование — другого типа события.
       */
      @statusCode statusCode: 409;
      @body error: BookingConflictError;
    } | {
      /**
       * Ошибка валидации:
       * - startTime находится за пределами окна 14 дней
       * - startTime в прошлом
       * - startTime не соответствует сетке слотов (рабочие часы/шаг)
       * - отсутствуют обязательные поля guestName или guestEmail
       */
      @statusCode statusCode: 422;
      @body error: { code: "VALIDATION_ERROR"; message: string; details: string[] };
    };
  }
}

require 'singleton'
require 'securerandom'

class CalendarStore
  include Singleton

  WINDOW_DAYS = 14

  def initialize
    @mutex = Mutex.new
    reset_for_tests!
  end

  def reset_for_tests!
    @mutex.synchronize do
      @owner = {
        'id' => 'tota-owner',
        'name' => 'Tota'
      }
      @event_types = {}
      @bookings = []
      seed_event_types_internal
    end
  end

  def owner
    @owner.dup
  end

  def list_event_types
    @mutex.synchronize { @event_types.values.map(&:dup) }
  end

  def find_event_type(event_type_id)
    @mutex.synchronize { @event_types[event_type_id]&.dup }
  end

  def create_event_type(attrs)
    @mutex.synchronize do
      return nil if @event_types.key?(attrs['id'])

      @event_types[attrs['id']] = attrs
      attrs.dup
    end
  end

  def update_event_type(event_type_id, attrs)
    @mutex.synchronize do
      return nil unless @event_types.key?(event_type_id)

      @event_types[event_type_id] = @event_types[event_type_id].merge(attrs)
      @event_types[event_type_id].dup
    end
  end

  def delete_event_type(event_type_id)
    @mutex.synchronize { !@event_types.delete(event_type_id).nil? }
  end

  def create_booking(event_type_id:, start_time:, guest_name:, guest_email:, guest_note:)
    @mutex.synchronize do
      event_type = @event_types[event_type_id]
      return { error: :event_type_not_found } if event_type.nil?

      end_time = start_time + event_type['durationMinutes'].minutes
      conflicting = find_conflicting_booking(start_time, end_time)
      return { error: :slot_already_booked, conflicting_booking: conflicting } if conflicting

      booking = {
        id: "bkg-#{SecureRandom.hex(6)}",
        event_type_id: event_type_id,
        event_type_name: event_type['name'],
        start_time: start_time,
        end_time: end_time,
        guest_name: guest_name,
        guest_email: guest_email,
        guest_note: guest_note,
        status: 'confirmed',
        created_at: Time.now.utc
      }

      @bookings << booking
      { booking: serialize_booking(booking) }
    end
  end

  def confirmed_bookings
    @mutex.synchronize { @bookings.select { |booking| booking[:status] == 'confirmed' }.map(&:dup) }
  end

  def upcoming_bookings(now: Time.now.utc)
    @mutex.synchronize do
      @bookings
        .select { |booking| booking[:status] == 'confirmed' && booking[:start_time] >= now }
        .sort_by { |booking| booking[:start_time] }
        .map { |booking| serialize_booking(booking) }
    end
  end

  def serialize_booking(booking)
    {
      'id' => booking[:id],
      'eventTypeId' => booking[:event_type_id],
      'eventTypeName' => booking[:event_type_name],
      'startTime' => booking[:start_time].iso8601(3),
      'endTime' => booking[:end_time].iso8601(3),
      'guestName' => booking[:guest_name],
      'guestEmail' => booking[:guest_email],
      'guestNote' => booking[:guest_note],
      'status' => booking[:status],
      'createdAt' => booking[:created_at].iso8601(3)
    }.compact
  end

  private

  def find_conflicting_booking(start_time, end_time)
    @bookings.find do |booking|
      booking[:status] == 'confirmed' && ranges_overlap?(start_time, end_time, booking[:start_time], booking[:end_time])
    end
  end

  def ranges_overlap?(start_a, end_a, start_b, end_b)
    start_a < end_b && start_b < end_a
  end

  def seed_event_types_internal
    @event_types['meeting-15min-a7x9k2m3'] = {
      'id' => 'meeting-15min-a7x9k2m3',
      'name' => 'Встреча 15 минут',
      'description' => 'Короткий тип события для быстрого слота.',
      'durationMinutes' => 15
    }
    @event_types['meeting-30min-b4p8n1q7'] = {
      'id' => 'meeting-30min-b4p8n1q7',
      'name' => 'Встреча 30 минут',
      'description' => 'Базовый тип события для бронирования.',
      'durationMinutes' => 30
    }
  end
end

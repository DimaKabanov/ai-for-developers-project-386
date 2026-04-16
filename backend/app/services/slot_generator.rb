class SlotGenerator
  WINDOW_DAYS = 14
  WORKING_START_HOUR = 9
  WORKING_END_HOUR = 18

  def initialize(bookings:, now: Time.now.utc)
    @bookings = bookings
    @now = now
  end

  def generate(duration_minutes)
    slots = []
    window_end = (@now + WINDOW_DAYS.days).end_of_day

    (0..WINDOW_DAYS).each do |offset|
      day = (@now.to_date + offset)
      day_start = Time.utc(day.year, day.month, day.day, WORKING_START_HOUR, 0, 0)
      day_end = Time.utc(day.year, day.month, day.day, WORKING_END_HOUR, 0, 0)

      cursor = day_start
      while (cursor + duration_minutes.minutes) <= day_end
        slot_start = cursor
        slot_end = cursor + duration_minutes.minutes
        cursor += duration_minutes.minutes

        next if slot_start < @now
        next if slot_start > window_end

        slots << {
          "id" => slot_id(duration_minutes, slot_start),
          "startTime" => slot_start.iso8601(3),
          "endTime" => slot_end.iso8601(3),
          "isAvailable" => available?(slot_start, slot_end)
        }
      end
    end

    slots
  end

  private

  def available?(slot_start, slot_end)
    @bookings.none? do |booking|
      booking[:status] == "confirmed" && overlap?(slot_start, slot_end, booking[:start_time], booking[:end_time])
    end
  end

  def overlap?(start_a, end_a, start_b, end_b)
    start_a < end_b && start_b < end_a
  end

  def slot_id(duration_minutes, slot_start)
    "slot-#{duration_minutes}min-#{slot_start.strftime('%Y-%m-%d-%H-%M')}"
  end
end

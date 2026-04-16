module Public
  class BookingsController < ApplicationController
    WINDOW_DAYS = 14

    def create
      event_type = CalendarStore.instance.find_event_type(params[:id])
      return render_not_found_event_type if event_type.nil?

      start_time, details = parse_and_validate_start_time
      details.concat(validate_slot_grid(start_time, event_type["durationMinutes"])) if start_time
      details.concat(validate_guest_fields)

      return render_validation_error(details) if details.any?

      result = CalendarStore.instance.create_booking(
        event_type_id: params[:id],
        start_time: start_time,
        guest_name: booking_params[:guestName].to_s.strip,
        guest_email: booking_params[:guestEmail].to_s.strip,
        guest_note: normalized_guest_note
      )

      if result[:error] == :slot_already_booked
        render json: {
          code: "SLOT_ALREADY_BOOKED",
          message: "The selected slot is already booked",
          conflictingStartTime: result[:conflicting_booking][:start_time].iso8601(3)
        }, status: :conflict
        return
      end

      render json: result[:booking], status: :created
    end

    private

    def booking_params
      permitted = params.permit(
        :id,
        :startTime,
        :guestName,
        :guestEmail,
        :guestNote,
        booking: [:startTime, :guestName, :guestEmail, :guestNote]
      )

      nested = permitted[:booking]
      return nested if nested.is_a?(ActionController::Parameters)

      permitted
    end

    def parse_and_validate_start_time
      details = []
      start_time_param = booking_params[:startTime].to_s
      start_time = Time.iso8601(start_time_param).utc

      now = Time.now.utc
      window_end = (now + WINDOW_DAYS.days).end_of_day

      details << "startTime must not be in the past" if start_time < now
      details << "startTime must be within the next 14 days" if start_time > window_end

      [start_time, details]
    rescue ArgumentError
      [nil, ["startTime must be a valid ISO 8601 datetime"]]
    end

    def validate_slot_grid(start_time, duration_minutes)
      details = []
      day_start = Time.utc(start_time.year, start_time.month, start_time.day, SlotGenerator::WORKING_START_HOUR, 0, 0)
      day_end = Time.utc(start_time.year, start_time.month, start_time.day, SlotGenerator::WORKING_END_HOUR, 0, 0)
      booking_end = start_time + duration_minutes.minutes

      if start_time < day_start || booking_end > day_end
        details << "startTime must be within working hours 09:00-18:00 UTC"
      end

      unless start_time.usec.zero?
        details << "startTime must match generated slot grid"
        return details
      end

      offset_seconds = start_time.to_i - day_start.to_i
      minute_aligned = offset_seconds >= 0 && (offset_seconds % 60).zero?
      step_aligned = minute_aligned && ((offset_seconds / 60) % duration_minutes).zero?
      details << "startTime must match generated slot grid" unless step_aligned

      details
    end

    def validate_guest_fields
      details = []
      details << "guestName is required" if booking_params[:guestName].to_s.strip.empty?

      guest_email = booking_params[:guestEmail].to_s.strip
      details << "guestEmail is required" if guest_email.empty?
      details << "guestEmail format is invalid" unless guest_email.empty? || valid_email?(guest_email)

      details
    end

    def valid_email?(email)
      URI::MailTo::EMAIL_REGEXP.match?(email)
    end

    def normalized_guest_note
      note = booking_params[:guestNote].to_s.strip
      note.empty? ? nil : note
    end
  end
end

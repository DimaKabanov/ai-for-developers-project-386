module Public
  class EventTypesController < ApplicationController
    def index
      render json: CalendarStore.instance.list_event_types, status: :ok
    end

    def slots
      event_type = CalendarStore.instance.find_event_type(params[:id])
      return render_not_found_event_type if event_type.nil?

      bookings = CalendarStore.instance.confirmed_bookings
      slots = SlotGenerator.new(bookings: bookings).generate(event_type["durationMinutes"])

      render json: slots, status: :ok
    end
  end
end

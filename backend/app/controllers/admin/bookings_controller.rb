module Admin
  class BookingsController < ApplicationController
    def index
      render json: CalendarStore.instance.upcoming_bookings, status: :ok
    end
  end
end

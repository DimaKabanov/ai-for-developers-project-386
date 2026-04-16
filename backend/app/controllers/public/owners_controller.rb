module Public
  class OwnersController < ApplicationController
    def show
      render json: CalendarStore.instance.owner, status: :ok
    end
  end
end

module Admin
  class EventTypesController < ApplicationController
    def index
      render json: CalendarStore.instance.list_event_types, status: :ok
    end

    def create
      details = validate_create_payload
      return render_validation_error(details) if details.any?

      created = CalendarStore.instance.create_event_type(create_params.to_h)
      if created.nil?
        render json: {
          code: "EVENT_TYPE_ID_CONFLICT",
          message: "Event type with this id already exists"
        }, status: :conflict
        return
      end

      render json: created, status: :created
    end

    def update
      details = validate_update_payload
      return render_validation_error(details) if details.any?

      updated = CalendarStore.instance.update_event_type(params[:id], update_params.to_h)
      return render_not_found_event_type if updated.nil?

      render json: updated, status: :ok
    end

    def destroy
      deleted = CalendarStore.instance.delete_event_type(params[:id])
      return render_not_found_event_type unless deleted

      head :no_content
    end

    private

    def create_params
      params.permit(:id, :name, :description, :durationMinutes)
    end

    def update_params
      params.permit(:name, :description, :durationMinutes)
    end

    def validate_create_payload
      details = []
      details << "id is required" if create_params[:id].to_s.strip.empty?
      details.concat(validate_common_fields(create_params))
      details
    end

    def validate_update_payload
      validate_common_fields(update_params)
    end

    def validate_common_fields(attrs)
      details = []
      details << "name is required" if attrs[:name].to_s.strip.empty?
      details << "description is required" if attrs[:description].to_s.strip.empty?

      duration = attrs[:durationMinutes]
      if duration.nil?
        details << "durationMinutes is required"
      elsif !duration.is_a?(Integer) || duration <= 0
        details << "durationMinutes must be a positive integer"
      end

      details
    end
  end
end

class ApplicationController < ActionController::API
  private

  def render_not_found_event_type
    render json: {
      code: "EVENT_TYPE_NOT_FOUND",
      message: "Event type was not found"
    }, status: :not_found
  end

  def render_validation_error(details)
    render json: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: details
    }, status: :unprocessable_content
  end
end

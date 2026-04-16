class StaticController < ActionController::Base
  # Serve the React app's index.html for client-side routing
  # This handles all routes that don't match API endpoints
  def index
    render file: Rails.public_path.join('index.html'), layout: false
  end
end

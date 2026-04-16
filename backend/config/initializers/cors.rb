Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Development: Vite dev server
    # Production: Any origin (since frontend and API are same origin in Docker deployment)
    # Render domains are handled via same-origin requests
    origins ENV.fetch('CORS_ORIGINS', 'http://localhost:5173').split(',')

    resource '*',
             headers: :any,
             methods: %i[get post put patch delete options head]
  end
end

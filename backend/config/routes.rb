Rails.application.routes.draw do
  get 'up' => 'rails/health#show', as: :rails_health_check

  namespace :public do
    get 'owner', to: 'owners#show'

    resources :event_types, only: [:index], path: 'event-types' do
      get 'slots', to: 'event_types#slots', on: :member
      post 'bookings', to: 'bookings#create', on: :member
    end
  end

  namespace :admin do
    resources :event_types, only: %i[index create update destroy], path: 'event-types'
    resources :bookings, only: [:index]
  end

  # Client-side routing fallback for React Router
  # Must be last route - catches all paths not matched by API routes
  get '*path', to: 'static#index', constraints: lambda { |req|
    # Don't catch API routes or Rails internal routes
    !req.path.starts_with?('/public/', '/admin/', '/up')
  }

  # Root path
  root to: 'static#index'
end

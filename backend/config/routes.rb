Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :public do
    get "owner", to: "owners#show"

    resources :event_types, only: [:index], path: "event-types" do
      get "slots", to: "event_types#slots", on: :member
      post "bookings", to: "bookings#create", on: :member
    end
  end

  namespace :admin do
    resources :event_types, only: [:index, :create, :update, :destroy], path: "event-types"
    resources :bookings, only: [:index]
  end
end

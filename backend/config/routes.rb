Rails.application.routes.draw do
  devise_for :users,
             singular: :user,
             path: "api/v1",
             path_names: {
               sign_in: "login",
               sign_out: "logout",
               registration: "signup",
               password: "password"
             },
             controllers: {
               sessions: "api/v1/users/sessions",
               registrations: "api/v1/users/registrations",
               passwords: "api/v1/users/passwords"
             },
             defaults: { format: :json }

  namespace :api do
    namespace :v1 do
      get "health/index"
      get "health", to: "health#index"
      get "me", to: "users/profiles#show"
      get "shift_types", to: "shift_types#index"
      put "shift_types", to: "shift_types#update"
      resources :shifts, only: %i[index show create update]
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end

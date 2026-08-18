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
      put "me", to: "users/profiles#update"
      patch "me", to: "users/profiles#update"
      get "shift_types", to: "shift_types#index"
      put "shift_types", to: "shift_types#update"
      get "staffs", to: "staffs#index"
      put "staffs", to: "staffs#update"
      get "roles", to: "roles#index"
      put "roles", to: "roles#update"
      resources :shifts, only: %i[index show create update destroy]
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end

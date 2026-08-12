# Be sure to restart your server when you modify this file.

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "localhost:3001", "http://localhost:3001", ENV.fetch("FRONTEND_URL", "http://localhost:3001")

    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head],
      expose: [ "Authorization" ],
      credentials: true
  end
end
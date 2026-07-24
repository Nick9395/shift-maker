class ApplicationController < ActionController::API
  include ActionController::MimeResponds

  before_action :configure_permitted_parameters, if: :devise_controller?

  private

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: %i[email password password_confirmation])
    devise_parameter_sanitizer.permit(:account_update, keys: %i[email password password_confirmation])
  end

  def render_user(user, status: :ok)
    render json: {
      user: {
        id: user.id,
        email: user.email
      }
    }, status: status
  end
end

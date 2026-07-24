# frozen_string_literal: true

module Api
  module V1
    module Users
      class SessionsController < Devise::SessionsController
        respond_to :json

        private

        def respond_with(resource, _opts = {})
          render_user(resource)
        end

        def respond_to_on_destroy(*)
          # devise-jwt がトークン失効を処理したあとでもメッセージを返す
          render json: { message: "ログアウトしました" }, status: :ok
        end
      end
    end
  end
end

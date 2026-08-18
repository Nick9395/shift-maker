# frozen_string_literal: true

module Api
  module V1
    module Users
      class ProfilesController < ApplicationController
        before_action :authenticate_user!

        def show
          render_user(current_user)
        end

        def update
          if current_user.update_with_password(account_update_params)
            render_user(current_user)
          else
            render json: {
              message: "アカウント情報の更新に失敗しました",
              errors: current_user.errors.full_messages
            }, status: :unprocessable_entity
          end
        end

        private

        def account_update_params
          params.require(:user).permit(
            :name,
            :email,
            :password,
            :password_confirmation,
            :current_password
          )
        end
      end
    end
  end
end

# frozen_string_literal: true

module Api
  module V1
    module Users
      class PasswordsController < Devise::PasswordsController
        respond_to :json

        # リセットメール送信
        def create
          self.resource = resource_class.send_reset_password_instructions(resource_params)

          if successfully_sent?(resource)
            render json: { message: "パスワード再設定用のメールを送信しました" }, status: :ok
          else
            render json: {
              message: "パスワード再設定メールの送信に失敗しました",
              errors: resource.errors.full_messages
            }, status: :unprocessable_entity
          end
        end

        # トークンで新パスワードを設定
        def update
          self.resource = resource_class.reset_password_by_token(resource_params)

          if resource.errors.empty?
            render json: { message: "パスワードを更新しました。ログインしてください" }, status: :ok
          else
            render json: {
              message: "パスワードの更新に失敗しました",
              errors: resource.errors.full_messages
            }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end

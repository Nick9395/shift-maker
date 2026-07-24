# frozen_string_literal: true

require "test_helper"

module Api
  module V1
    module Users
      class PasswordsControllerTest < ActionDispatch::IntegrationTest
        setup do
          @user = create(:user, email: "reset@example.com", password: "password123")
          ActionMailer::Base.deliveries.clear
        end

        test "パスワードリセットメールを送信できる" do
          post user_password_path, params: {
            user: { email: @user.email }
          }, as: :json

          assert_response :success
          assert_equal 1, ActionMailer::Base.deliveries.size
        end

        test "トークンでパスワードを更新できる" do
          token = @user.send_reset_password_instructions

          put user_password_path, params: {
            user: {
              reset_password_token: token,
              password: "newpassword123",
              password_confirmation: "newpassword123"
            }
          }, as: :json

          assert_response :success
          assert @user.reload.valid_password?("newpassword123")
        end
      end
    end
  end
end

# frozen_string_literal: true

require "test_helper"

module Api
  module V1
    module Users
      class SessionsControllerTest < ActionDispatch::IntegrationTest
        setup do
          @user = create(:user, email: "login@example.com", password: "password123")
        end

        test "正しい認証情報でログインできる" do
          post user_session_path, params: {
            user: { email: @user.email, password: "password123" }
          }, as: :json

          assert_response :success
          assert response.headers["Authorization"].present?
          body = JSON.parse(response.body)
          assert_equal @user.email, body.dig("user", "email")
        end

        test "誤ったパスワードではログインできない" do
          post user_session_path, params: {
            user: { email: @user.email, password: "wrong" }
          }, as: :json

          assert_response :unauthorized
        end

        test "ログアウトできる" do
          post user_session_path, params: {
            user: { email: @user.email, password: "password123" }
          }, as: :json
          token = response.headers["Authorization"]

          delete destroy_user_session_path, headers: { "Authorization" => token }, as: :json
          assert_response :success
        end
      end
    end
  end
end

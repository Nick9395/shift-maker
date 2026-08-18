# frozen_string_literal: true

require "test_helper"

module Api
  module V1
    module Users
      class ProfilesControllerTest < ActionDispatch::IntegrationTest
        setup do
          @user = create(:user, name: "太郎", email: "taro@example.com")
        end

        test "認証済みなら自分の情報を取得できる" do
          token = login_token

          get api_v1_me_path, headers: { "Authorization" => token }, as: :json
          assert_response :success
          body = JSON.parse(response.body)
          assert_equal @user.name, body.dig("user", "name")
          assert_equal @user.email, body.dig("user", "email")
        end

        test "未認証では取得できない" do
          get api_v1_me_path, as: :json
          assert_response :unauthorized
        end

        test "現在のパスワードが正しければ名前とメールを更新できる" do
          token = login_token

          put api_v1_me_path, params: {
            user: {
              name: "花子",
              email: "hanako@example.com",
              current_password: "password123"
            }
          }, headers: { "Authorization" => token }, as: :json

          assert_response :success
          body = JSON.parse(response.body)
          assert_equal "花子", body.dig("user", "name")
          assert_equal "hanako@example.com", body.dig("user", "email")
          @user.reload
          assert_equal "花子", @user.name
          assert_equal "hanako@example.com", @user.email
          assert @user.valid_password?("password123")
        end

        test "パスワードも更新できる" do
          token = login_token

          put api_v1_me_path, params: {
            user: {
              name: @user.name,
              email: @user.email,
              current_password: "password123",
              password: "newpassword123",
              password_confirmation: "newpassword123"
            }
          }, headers: { "Authorization" => token }, as: :json

          assert_response :success
          assert @user.reload.valid_password?("newpassword123")
        end

        test "現在のパスワードが違うと更新できない" do
          token = login_token

          put api_v1_me_path, params: {
            user: {
              name: "花子",
              email: @user.email,
              current_password: "wrong-password"
            }
          }, headers: { "Authorization" => token }, as: :json

          assert_response :unprocessable_entity
          assert_equal "太郎", @user.reload.name
        end

        test "新しいパスワードの確認が一致しないと更新できない" do
          token = login_token

          put api_v1_me_path, params: {
            user: {
              name: @user.name,
              email: @user.email,
              current_password: "password123",
              password: "newpassword123",
              password_confirmation: "mismatch"
            }
          }, headers: { "Authorization" => token }, as: :json

          assert_response :unprocessable_entity
          assert @user.reload.valid_password?("password123")
        end

        test "未認証では更新できない" do
          put api_v1_me_path, params: {
            user: {
              name: "花子",
              email: @user.email,
              current_password: "password123"
            }
          }, as: :json

          assert_response :unauthorized
        end

        private

        def login_token
          post user_session_path, params: {
            user: { email: @user.email, password: "password123" }
          }, as: :json
          response.headers["Authorization"]
        end
      end
    end
  end
end

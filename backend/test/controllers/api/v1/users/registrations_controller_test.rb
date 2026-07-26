# frozen_string_literal: true

require "test_helper"

module Api
  module V1
    module Users
      class RegistrationsControllerTest < ActionDispatch::IntegrationTest
        test "サインアップできる" do
          assert_difference "User.count", 1 do
            post user_registration_path, params: {
              user: {
                name: "太郎",
                email: "new@example.com",
                password: "password123",
                password_confirmation: "password123"
              }
            }, as: :json
          end

          assert_response :created
          assert response.headers["Authorization"].present?, "サインアップ時に JWT が返ること"
          body = JSON.parse(response.body)
          assert_equal "太郎", body.dig("user", "name")
          assert_equal "new@example.com", body.dig("user", "email")
        end

        test "パスワード不一致ではサインアップできない" do
          assert_no_difference "User.count" do
            post user_registration_path, params: {
              user: {
                name: "太郎",
                email: "new@example.com",
                password: "password123",
                password_confirmation: "mismatch"
              }
            }, as: :json
          end

          assert_response :unprocessable_entity
        end

        test "ユーザー名が不正だとサインアップできない" do
          assert_no_difference "User.count" do
            post user_registration_path, params: {
              user: {
                name: "あいうえおかきくけこさしす",
                email: "new@example.com",
                password: "password123",
                password_confirmation: "password123"
              }
            }, as: :json
          end

          assert_response :unprocessable_entity
        end

      end
    end
  end
end

# frozen_string_literal: true

require "test_helper"

module Api
  module V1
    module Users
      class ProfilesControllerTest < ActionDispatch::IntegrationTest
        setup do
          @user = create(:user)
        end

        test "認証済みなら自分の情報を取得できる" do
          post user_session_path, params: {
            user: { email: @user.email, password: "password123" }
          }, as: :json
          token = response.headers["Authorization"]

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
      end
    end
  end
end

# frozen_string_literal: true

require "test_helper"

module Api
  module V1
    class ShiftTypesControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = create(:user)
        @other = create(:user)
      end

      test "未認証では種別を取得できない" do
        get "/api/v1/shift_types", as: :json
        assert_response :unauthorized
      end

      test "種別マスタを保存して読み戻せる" do
        headers = auth_headers_for(@user)
        put "/api/v1/shift_types", params: { shift_types: [ type_payload ] }, headers: headers, as: :json
        assert_response :success

        get "/api/v1/shift_types", headers: headers, as: :json
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal 1, body["shift_types"].size
        assert_equal "日中勤務", body["shift_types"].first["name"]
        assert_equal "日勤", body["shift_types"].first["display_name"]
        assert_equal "type-day", body["shift_types"].first["client_uuid"]
      end

      test "他人の種別は見えない" do
        headers = auth_headers_for(@user)
        put "/api/v1/shift_types", params: { shift_types: [ type_payload ] }, headers: headers, as: :json
        assert_response :success

        other_headers = auth_headers_for(@other)
        get "/api/v1/shift_types", headers: other_headers, as: :json
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal [], body["shift_types"]
      end

      test "空配列で保存すると種別を消せる" do
        headers = auth_headers_for(@user)
        put "/api/v1/shift_types", params: { shift_types: [ type_payload ] }, headers: headers, as: :json
        put "/api/v1/shift_types", params: { shift_types: [] }, headers: headers, as: :json
        assert_response :success
        assert_equal 0, @user.shift_types.count
      end

      private

      def auth_headers_for(user)
        post user_session_path, params: {
          user: { email: user.email, password: "password123" }
        }, as: :json
        { "Authorization" => response.headers["Authorization"] }
      end

      def type_payload
        {
          client_uuid: "type-day",
          name: "日中勤務",
          display_name: "日勤",
          start_time: "08:30",
          end_time: "17:15",
          break_time: "01:00",
          status: "日中勤務",
          color: "#c45c26"
        }
      end
    end
  end
end

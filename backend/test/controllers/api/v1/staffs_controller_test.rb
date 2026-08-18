# frozen_string_literal: true

require "test_helper"

module Api
  module V1
    class StaffsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = create(:user)
        @other = create(:user)
      end

      test "未認証では職員を取得できない" do
        get "/api/v1/staffs", as: :json
        assert_response :unauthorized
      end

      test "職員マスタを保存して読み戻せる" do
        headers = auth_headers_for(@user)
        put "/api/v1/staffs", params: { staffs: [ staff_payload ] }, headers: headers, as: :json
        assert_response :success

        get "/api/v1/staffs", headers: headers, as: :json
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal 1, body["staffs"].size
        assert_equal "山田", body["staffs"].first["name"]
        assert_equal "staff-1", body["staffs"].first["client_uuid"]
      end

      test "他人の職員は見えない" do
        headers = auth_headers_for(@user)
        put "/api/v1/staffs", params: { staffs: [ staff_payload ] }, headers: headers, as: :json
        assert_response :success

        other_headers = auth_headers_for(@other)
        get "/api/v1/staffs", headers: other_headers, as: :json
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal [], body["staffs"]
      end

      test "空配列で保存すると職員を消せる" do
        headers = auth_headers_for(@user)
        put "/api/v1/staffs", params: { staffs: [ staff_payload ] }, headers: headers, as: :json
        put "/api/v1/staffs", params: { staffs: [] }, headers: headers, as: :json
        assert_response :success
        assert_equal 0, @user.staffs.count
      end

      test "氏名が空なら保存できない" do
        headers = auth_headers_for(@user)
        put "/api/v1/staffs",
            params: { staffs: [ staff_payload.merge(name: "") ] },
            headers: headers,
            as: :json
        assert_response :unprocessable_entity
      end

      private

      def auth_headers_for(user)
        post user_session_path, params: {
          user: { email: user.email, password: "password123" }
        }, as: :json
        { "Authorization" => response.headers["Authorization"] }
      end

      def staff_payload
        {
          client_uuid: "staff-1",
          name: "山田"
        }
      end
    end
  end
end

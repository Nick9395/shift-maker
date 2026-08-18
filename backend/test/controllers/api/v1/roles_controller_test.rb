# frozen_string_literal: true

require "test_helper"

module Api
  module V1
    class RolesControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = create(:user)
        @other = create(:user)
      end

      test "未認証では職務を取得できない" do
        get "/api/v1/roles", as: :json
        assert_response :unauthorized
      end

      test "職務マスタを保存して読み戻せる" do
        headers = auth_headers_for(@user)
        put "/api/v1/roles", params: { roles: [ role_payload ] }, headers: headers, as: :json
        assert_response :success

        get "/api/v1/roles", headers: headers, as: :json
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal 1, body["roles"].size
        assert_equal "看護師", body["roles"].first["name"]
        assert_equal "看", body["roles"].first["abbreviation"]
        assert_equal "role-1", body["roles"].first["client_uuid"]
      end

      test "他人の職務は見えない" do
        headers = auth_headers_for(@user)
        put "/api/v1/roles", params: { roles: [ role_payload ] }, headers: headers, as: :json
        assert_response :success

        other_headers = auth_headers_for(@other)
        get "/api/v1/roles", headers: other_headers, as: :json
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal [], body["roles"]
      end

      test "空配列で保存すると職務を消せる" do
        headers = auth_headers_for(@user)
        put "/api/v1/roles", params: { roles: [ role_payload ] }, headers: headers, as: :json
        put "/api/v1/roles", params: { roles: [] }, headers: headers, as: :json
        assert_response :success
        assert_equal 0, @user.roles.count
      end

      test "職務名が空なら保存できない" do
        headers = auth_headers_for(@user)
        put "/api/v1/roles",
            params: { roles: [ role_payload.merge(name: "") ] },
            headers: headers,
            as: :json
        assert_response :unprocessable_entity
      end

      test "略称が全角3文字を超えると保存できない" do
        headers = auth_headers_for(@user)
        put "/api/v1/roles",
            params: { roles: [ role_payload.merge(abbreviation: "あいうえ") ] },
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

      def role_payload
        {
          client_uuid: "role-1",
          name: "看護師",
          abbreviation: "看"
        }
      end
    end
  end
end

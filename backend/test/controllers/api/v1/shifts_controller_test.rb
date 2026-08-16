# frozen_string_literal: true

require "test_helper"

module Api
  module V1
    class ShiftsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = create(:user)
        @other = create(:user)
      end

      test "未認証では一覧を取得できない" do
        get api_v1_shifts_path, as: :json
        assert_response :unauthorized
      end

      test "保存した勤務表を一覧で取得できる" do
        headers = auth_headers_for(@user)
        post api_v1_shifts_path, params: { shift: valid_payload }, headers: headers, as: :json
        assert_response :created

        get api_v1_shifts_path, headers: headers, as: :json
        assert_response :success
        body = JSON.parse(response.body)
        assert_equal 1, body["shifts"].size
        assert_equal "8月勤務表", body["shifts"].first["name"]
        assert_equal "2026-08-01", body["shifts"].first["start_date"]
      end

      test "勤務表を保存するとマスと予定が残る" do
        headers = auth_headers_for(@user)
        post api_v1_shifts_path, params: { shift: valid_payload }, headers: headers, as: :json
        assert_response :created

        created = JSON.parse(response.body)["shift"]
        get api_v1_shift_path(created["id"]), headers: headers, as: :json
        assert_response :success

        shift = JSON.parse(response.body)["shift"]
        assert_equal "8月勤務表", shift["name"]
        assert_equal 1, shift["public_holiday"]
        assert_equal 1, shift["staffs"].size
        assert_equal "山田", shift["staffs"].first["staff_name"]
        assert_equal "課長", shift["staffs"].first["role_name_1"]
        assert_equal 1, shift["plans"].size
        assert_equal "会議", shift["plans"].first["body"]
        assert_equal 1, shift["entries"].size
        assert_equal "type-day", shift["entries"].first["shift_type_client_uuid"]
        assert_includes shift["locked_shift_type_uuids"], "type-day"
        assert_equal "日勤", shift["shift_types"].first["display_name"]
      end

      test "同じ勤務表を更新できる" do
        headers = auth_headers_for(@user)
        post api_v1_shifts_path, params: { shift: valid_payload }, headers: headers, as: :json
        id = JSON.parse(response.body).dig("shift", "id")

        updated = valid_payload.merge(name: "9月勤務表", all_locked: true)
        patch api_v1_shift_path(id), params: { shift: updated }, headers: headers, as: :json
        assert_response :success
        body = JSON.parse(response.body)["shift"]
        assert_equal "9月勤務表", body["name"]
        assert_equal true, body["all_locked"]
        assert_equal 1, Shift.where(user: @user).count
      end

      test "他人の勤務表は取得できない" do
        headers = auth_headers_for(@user)
        post api_v1_shifts_path, params: { shift: valid_payload }, headers: headers, as: :json
        id = JSON.parse(response.body).dig("shift", "id")

        other_headers = auth_headers_for(@other)
        get api_v1_shift_path(id), headers: other_headers, as: :json
        assert_response :not_found
      end

      test "シフト名が空なら保存できない" do
        headers = auth_headers_for(@user)
        payload = valid_payload.merge(name: "")
        post api_v1_shifts_path, params: { shift: payload }, headers: headers, as: :json
        assert_response :unprocessable_entity
      end

      private

      def auth_headers_for(user)
        post user_session_path, params: {
          user: { email: user.email, password: "password123" }
        }, as: :json
        { "Authorization" => response.headers["Authorization"] }
      end

      def valid_payload
        {
          name: "8月勤務表",
          start_date: "2026-08-01",
          end_date: "2026-08-03",
          public_holiday: 1,
          all_locked: false,
          shift_types: [
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
          ],
          staffs: [
            {
              client_uuid: "staff-1",
              staff_name: "山田",
              role_name_1: "課長",
              role_name_2: "",
              role_name_3: ""
            }
          ],
          role_counts: [
            {
              role_name: "課長",
              overlap_count: false,
              priority: true,
              required_count: 1,
              shortage_notice: true
            }
          ],
          plans: [
            { date: "2026-08-01", body: "会議" }
          ],
          locked_shift_type_uuids: [ "type-day" ],
          entries: [
            {
              staff_client_uuid: "staff-1",
              date: "2026-08-01",
              shift_type_client_uuid: "type-day"
            }
          ]
        }
      end
    end
  end
end

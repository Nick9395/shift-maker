# frozen_string_literal: true

module Api
  module V1
    class StaffsController < BaseController
      def index
        render json: { staffs: current_staffs.map(&:as_api) }
      end

      def update
        records = Staff.replace_all!(current_user, staff_params)
        render json: { staffs: records.map(&:as_api) }
      rescue Staff::Invalid => e
        render json: {
          message: e.messages.first,
          errors: e.messages
        }, status: :unprocessable_entity
      end

      private

      def current_staffs
        current_user.staffs.order(:sort_order, :id)
      end

      def staff_params
        params.permit(
          staffs: [ :client_uuid, :name ]
        ).fetch(:staffs, [])
      end
    end
  end
end

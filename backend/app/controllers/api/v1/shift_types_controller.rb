# frozen_string_literal: true

module Api
  module V1
    class ShiftTypesController < BaseController
      def index
        render json: { shift_types: current_types.map(&:as_api) }
      end

      def update
        records = ShiftType.replace_all!(current_user, shift_type_params)
        render json: { shift_types: records.map(&:as_api) }
      rescue ShiftType::Invalid => e
        render json: {
          message: e.messages.first,
          errors: e.messages
        }, status: :unprocessable_entity
      end

      private

      def current_types
        current_user.shift_types.order(:sort_order, :id)
      end

      def shift_type_params
        params.permit(
          shift_types: [
            :client_uuid,
            :name,
            :display_name,
            :start_time,
            :end_time,
            :break_time,
            :status,
            :color
          ]
        ).fetch(:shift_types, [])
      end
    end
  end
end

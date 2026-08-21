# frozen_string_literal: true

module Api
  module V1
    class ShiftsController < BaseController
      def index
        shifts = current_user.shifts.order(updated_at: :desc)
        render json: { shifts: shifts.map { |shift| Shift::Serializer.summary(shift) } }
      end

      def show
        render json: { shift: Shift::Serializer.detail(shift_record) }
      end

      def create
        shift = Shift::Save.new(user: current_user, params: shift_params).call
        render json: { shift: Shift::Serializer.detail(shift) }, status: :created
      rescue Shift::Save::Invalid => e
        render_invalid(e)
      end

      def update
        shift = Shift::Save.new(user: current_user, shift: shift_record, params: shift_params).call
        render json: { shift: Shift::Serializer.detail(shift) }
      rescue Shift::Save::Invalid => e
        render_invalid(e)
      end

      def destroy
        shift_record.destroy!
        head :no_content
      end

      private

      def shift_record
        current_user.shifts.find(params[:id])
      end

      def render_invalid(error)
        render json: {
          message: error.messages.first,
          errors: error.messages
        }, status: :unprocessable_entity
      end

      def shift_params
        params.require(:shift).permit(
          :name,
          :start_date,
          :end_date,
          :public_holiday,
          :all_locked,
          locked_shift_type_uuids: [],
          shift_types: [
            :client_uuid,
            :name,
            :display_name,
            :start_time,
            :end_time,
            :break_time,
            :status,
            :color
          ],
          staffs: [
            :client_uuid,
            :staff_name,
            :role_name_1,
            :role_name_2,
            :role_name_3
          ],
          role_counts: [
            :role_name,
            :overlap_count,
            :priority,
            :required_count,
            :shortage_notice
          ],
          shift_type_counts: [
            :name,
            :required_count,
            :shortage_notice,
            shift_type_client_uuids: []
          ],
          plans: [ :date, :body ],
          entries: [
            :staff_client_uuid,
            :date,
            :shift_type_client_uuid
          ]
        )
      end
    end
  end
end

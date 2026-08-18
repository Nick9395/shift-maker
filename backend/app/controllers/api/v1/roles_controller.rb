# frozen_string_literal: true

module Api
  module V1
    class RolesController < BaseController
      def index
        render json: { roles: current_roles.map(&:as_api) }
      end

      def update
        records = Role.replace_all!(current_user, role_params)
        render json: { roles: records.map(&:as_api) }
      rescue Role::Invalid => e
        render json: {
          message: e.messages.first,
          errors: e.messages
        }, status: :unprocessable_entity
      end

      private

      def current_roles
        current_user.roles.order(:sort_order, :id)
      end

      def role_params
        params.permit(
          roles: [ :client_uuid, :name, :abbreviation ]
        ).fetch(:roles, [])
      end
    end
  end
end

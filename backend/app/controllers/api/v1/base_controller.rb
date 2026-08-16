# frozen_string_literal: true

module Api
  module V1
    class BaseController < ApplicationController
      before_action :authenticate_user!

      rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

      private

      def render_not_found
        render json: { message: "見つかりませんでした" }, status: :not_found
      end
    end
  end
end

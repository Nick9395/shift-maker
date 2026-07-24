module Api
  module V1
    class HealthController < ApplicationController
      def index
        render json: {
          status: "ok",
          message: "railsからhello world!!",
          timestamp: Time.current
        }
      end
    end
  end
end

# frozen_string_literal: true

module Api
  module V1
    module Users
      class ProfilesController < ApplicationController
        before_action :authenticate_user!

        def show
          render_user(current_user)
        end
      end
    end
  end
end

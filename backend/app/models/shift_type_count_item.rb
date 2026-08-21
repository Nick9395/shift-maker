# frozen_string_literal: true

class ShiftTypeCountItem < ApplicationRecord
  belongs_to :shift_type_count
  belongs_to :shift_type, optional: true

  validates :shift_type_client_uuid, presence: true
  validates :sort_order, presence: true, numericality: { only_integer: true }
end

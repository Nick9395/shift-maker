# frozen_string_literal: true

class ShiftTypeCount < ApplicationRecord
  belongs_to :shift
  has_many :shift_type_count_items, -> { order(:sort_order, :id) },
           dependent: :destroy, inverse_of: :shift_type_count

  validates :name, length: { maximum: 20 }
  validates :shortage_notice, inclusion: { in: [ true, false ] }
  validates :required_count, presence: true,
                             numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :sort_order, presence: true, numericality: { only_integer: true }
end

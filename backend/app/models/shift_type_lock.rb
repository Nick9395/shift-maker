# frozen_string_literal: true

class ShiftTypeLock < ApplicationRecord
  belongs_to :shift
  belongs_to :shift_type

  validates :shift_type_id, uniqueness: { scope: :shift_id }
end

# frozen_string_literal: true

class ShiftRoleCount < ApplicationRecord
  belongs_to :shift
  belongs_to :role, optional: true

  validates :role_name, presence: true
  validates :overlap_count, inclusion: { in: [ true, false ] }
  validates :priority, inclusion: { in: [ true, false ] }
  validates :shortage_notice, inclusion: { in: [ true, false ] }
  validates :required_count, presence: true,
                             numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :sort_order, presence: true, numericality: { only_integer: true }
end

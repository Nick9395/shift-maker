# frozen_string_literal: true

class ShiftStaff < ApplicationRecord
  self.table_name = "shift_staffs"

  belongs_to :shift
  belongs_to :staff, optional: true
  belongs_to :role_1, class_name: "Role", optional: true
  belongs_to :role_2, class_name: "Role", optional: true
  belongs_to :role_3, class_name: "Role", optional: true
  has_many :shift_entries, dependent: :destroy

  validates :staff_name, presence: true, length: { maximum: 30 }
  validates :sort_order, presence: true, numericality: { only_integer: true }
end

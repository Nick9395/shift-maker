# frozen_string_literal: true

class ShiftEntry < ApplicationRecord
  belongs_to :shift
  belongs_to :shift_staff
  belongs_to :shift_type, optional: true

  validates :date, presence: true
  validates :date, uniqueness: { scope: :shift_staff_id }
  validate :staff_belongs_to_same_shift
  validate :date_within_shift_period

  private

  def staff_belongs_to_same_shift
    return if shift_staff.blank? || shift_id.blank?
    return if shift_staff.shift_id == shift_id

    errors.add(:shift_staff, "が別の勤務表です")
  end

  def date_within_shift_period
    return if shift.blank? || date.blank?
    return if date.between?(shift.start_date, shift.end_date)

    errors.add(:date, "は勤務表の期間内にしてください")
  end
end

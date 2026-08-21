# frozen_string_literal: true

class Shift < ApplicationRecord
  belongs_to :user
  has_many :shift_staffs, class_name: "ShiftStaff", dependent: :destroy
  has_many :shift_plans, dependent: :destroy
  has_many :shift_role_counts, dependent: :destroy
  has_many :shift_type_counts, -> { order(:sort_order, :id) },
           dependent: :destroy, inverse_of: :shift
  has_many :shift_type_locks, dependent: :destroy
  has_many :shift_entries, dependent: :delete_all

  validates :name, presence: true, length: { maximum: 40 }
  validates :start_date, presence: true
  validates :end_date, presence: true
  validates :public_holiday, presence: true,
                             numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :all_locked, inclusion: { in: [ true, false ] }
  validate :end_date_not_before_start_date
  validate :public_holiday_within_period

  private

  def end_date_not_before_start_date
    return if start_date.blank? || end_date.blank?
    return if end_date >= start_date

    errors.add(:end_date, "は開始年月日以降にしてください")
  end

  def public_holiday_within_period
    return if start_date.blank? || end_date.blank? || public_holiday.blank?

    period_days = (end_date - start_date).to_i + 1
    return if public_holiday <= period_days

    errors.add(:public_holiday, "は期間内の日数（#{period_days}日）以下にしてください")
  end
end

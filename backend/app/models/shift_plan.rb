# frozen_string_literal: true

class ShiftPlan < ApplicationRecord
  belongs_to :shift

  validates :date, presence: true
  validates :date, uniqueness: { scope: :shift_id }
  validates :body, presence: true, allow_blank: true
  validate :body_display_width

  private

  def body_display_width
    return if DisplayWidth.of(body) <= DisplayWidth::MAX_SHIFT_PLAN

    errors.add(:body, "は全角28文字以内にしてください")
  end
end

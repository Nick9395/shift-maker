# frozen_string_literal: true

class Staff < ApplicationRecord
  self.table_name = "staffs"

  belongs_to :user

  validates :name, presence: true
end

# frozen_string_literal: true

class Staff < ApplicationRecord
  class Invalid < StandardError
    attr_reader :messages

    def initialize(messages)
      @messages = Array(messages)
      super(@messages.join("\n"))
    end
  end

  self.table_name = "staffs"

  belongs_to :user
  has_many :shift_staffs, class_name: "ShiftStaff", dependent: :nullify

  validates :name, presence: true
  validates :client_uuid, presence: true
  validates :client_uuid, uniqueness: { scope: :user_id }
  validates :sort_order, numericality: { only_integer: true }

  def self.replace_all!(user, staff_params_list)
    list = Array(staff_params_list)
    if list.size > DisplayWidth::MAX_SHIFT_STAFF
      raise Invalid, "職員は#{DisplayWidth::MAX_SHIFT_STAFF}人以下にしてください"
    end

    kept_ids = []
    Shift.transaction do
      list.each_with_index do |staff_params, index|
        uuid = staff_params[:client_uuid].to_s
        next if uuid.blank?

        record = user.staffs.find_or_initialize_by(client_uuid: uuid)
        record.name = staff_params[:name].to_s.strip
        record.sort_order = index
        unless record.save
          raise Invalid, record.errors.full_messages
        end

        kept_ids << record.id
      end
      user.staffs.where.not(id: kept_ids).find_each(&:destroy!)
    end
    user.staffs.order(:sort_order, :id)
  end

  def as_api
    {
      client_uuid: client_uuid,
      name: name
    }
  end
end

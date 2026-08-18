# frozen_string_literal: true

class Role < ApplicationRecord
  class Invalid < StandardError
    attr_reader :messages

    def initialize(messages)
      @messages = Array(messages)
      super(@messages.join("\n"))
    end
  end

  MAX_ABBREVIATION_WIDTH = 6

  belongs_to :user
  has_many :shift_role_counts, dependent: :nullify

  validates :name, presence: true
  validates :name, uniqueness: { scope: :user_id }
  validates :client_uuid, presence: true
  validates :client_uuid, uniqueness: { scope: :user_id }
  validates :sort_order, numericality: { only_integer: true }
  validate :abbreviation_width

  def self.replace_all!(user, role_params_list)
    list = Array(role_params_list)
    if list.size > DisplayWidth::MAX_ROLES
      raise Invalid, "職務は#{DisplayWidth::MAX_ROLES}件以下にしてください"
    end

    kept_ids = []
    Shift.transaction do
      list.each_with_index do |role_params, index|
        uuid = role_params[:client_uuid].to_s
        next if uuid.blank?

        record = user.roles.find_or_initialize_by(client_uuid: uuid)
        record.name = role_params[:name].to_s.strip
        record.abbreviation = role_params[:abbreviation].to_s.strip
        record.sort_order = index
        unless record.save
          raise Invalid, record.errors.full_messages
        end

        kept_ids << record.id
      end
      user.roles.where.not(id: kept_ids).find_each(&:destroy!)
    end
    user.roles.order(:sort_order, :id)
  end

  def as_api
    {
      client_uuid: client_uuid,
      name: name,
      abbreviation: abbreviation.to_s
    }
  end

  private

  def abbreviation_width
    return if DisplayWidth.of(abbreviation) <= MAX_ABBREVIATION_WIDTH

    errors.add(:abbreviation, "は半角6文字または全角3文字以内にしてください")
  end
end

# frozen_string_literal: true

class ShiftType < ApplicationRecord
  class Invalid < StandardError
    attr_reader :messages

    def initialize(messages)
      @messages = Array(messages)
      super(@messages.join("\n"))
    end
  end

  # フロントの類型ラベルと DB の integer を相互変換する
  STATUS_LABELS = {
    0 => "公休",
    1 => "特休",
    2 => "年休",
    3 => "出張",
    4 => "時間休",
    5 => "早朝勤務",
    6 => "日中勤務",
    7 => "夕方勤務",
    8 => "夜間勤務"
  }.freeze
  STATUS_VALUES = STATUS_LABELS.invert.freeze
  MAX_DISPLAY_NAME_WIDTH = 4

  belongs_to :user
  has_many :shift_entries, dependent: :nullify
  has_many :shift_type_locks, dependent: :delete_all

  validates :client_uuid, presence: true
  validates :client_uuid, uniqueness: { scope: :user_id }
  validates :name, presence: true
  validates :status, inclusion: { in: STATUS_LABELS.keys }, allow_nil: true
  validates :sort_order, numericality: { only_integer: true }
  validate :display_name_width

  def self.status_from_label(label)
    return if label.blank?

    STATUS_VALUES[label.to_s]
  end

  def self.format_clock(value)
    return if value.blank?
    return value.strftime("%H:%M") if value.respond_to?(:strftime)

    value.to_s[0, 5]
  end

  def self.attrs_from_params(type_params)
    {
      name: type_params[:name].presence || "（無題）",
      display_name: type_params[:display_name],
      start_time: type_params[:start_time].presence,
      end_time: type_params[:end_time].presence,
      break_time: type_params[:break_time].presence,
      status: status_from_label(type_params[:status]),
      color: type_params[:color].presence
    }
  end

  # 勤務表保存時：既存は更新し、無いものだけ追加する
  def self.upsert_each!(user, type_params_list)
    types_by_uuid = {}
    max_order = user.shift_types.maximum(:sort_order) || -1

    Array(type_params_list).each do |type_params|
      uuid = type_params[:client_uuid].to_s
      next if uuid.blank?

      record = user.shift_types.find_or_initialize_by(client_uuid: uuid)
      record.assign_attributes(attrs_from_params(type_params))
      if record.new_record?
        max_order += 1
        record.sort_order = max_order
      end
      unless record.save
        raise Invalid, record.errors.full_messages
      end

      types_by_uuid[uuid] = record
    end
    types_by_uuid
  end

  # 設定画面：並び順どおりに置き換える
  def self.replace_all!(user, type_params_list)
    list = Array(type_params_list)
    if list.size > DisplayWidth::MAX_SHIFT_TYPES
      raise Invalid, "シフト種別は#{DisplayWidth::MAX_SHIFT_TYPES}件以下にしてください"
    end

    kept_ids = []
    Shift.transaction do
      list.each_with_index do |type_params, index|
        uuid = type_params[:client_uuid].to_s
        next if uuid.blank?

        record = user.shift_types.find_or_initialize_by(client_uuid: uuid)
        record.assign_attributes(attrs_from_params(type_params))
        record.sort_order = index
        unless record.save
          raise Invalid, record.errors.full_messages
        end

        kept_ids << record.id
      end
      user.shift_types.where.not(id: kept_ids).find_each(&:destroy!)
    end
    user.shift_types.order(:sort_order, :id)
  end

  def status_label
    STATUS_LABELS[status]
  end

  def as_api
    {
      client_uuid: client_uuid,
      name: name,
      display_name: display_name.to_s,
      start_time: self.class.format_clock(start_time),
      end_time: self.class.format_clock(end_time),
      break_time: self.class.format_clock(break_time),
      status: status_label,
      color: color.to_s
    }
  end

  private

  def display_name_width
    return if DisplayWidth.of(display_name) <= MAX_DISPLAY_NAME_WIDTH

    errors.add(:display_name, "は半角4文字または全角2文字以内にしてください")
  end
end

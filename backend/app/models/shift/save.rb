# frozen_string_literal: true

class Shift::Save
  class Invalid < StandardError
    attr_reader :messages

    def initialize(messages)
      @messages = Array(messages)
      super(@messages.join("\n"))
    end
  end

  def initialize(user:, params:, shift: nil)
    @user = user
    @params = params
    @shift = shift
  end

  def call
    Shift.transaction do
      upsert_shift_types!
      persist_shift!
      replace_nested_records!
      @shift
    end
  rescue ActiveRecord::RecordInvalid => e
    raise Invalid, e.record.errors.full_messages
  rescue ShiftType::Invalid => e
    raise Invalid, e.messages
  end

  private

  attr_reader :user, :params

  def upsert_shift_types!
    types = Array(params[:shift_types])
    if types.size > DisplayWidth::MAX_SHIFT_TYPES
      raise Invalid, "シフト種別は#{DisplayWidth::MAX_SHIFT_TYPES}件以下にしてください"
    end

    @type_by_uuid = ShiftType.upsert_each!(user, types)

    extra_uuids = Array(params[:entries]).filter_map { |entry| entry[:shift_type_client_uuid].presence } +
                  Array(params[:locked_shift_type_uuids]).map(&:to_s)
    extra_uuids.uniq.each do |uuid|
      next if uuid.blank? || @type_by_uuid[uuid]

      record = user.shift_types.find_by(client_uuid: uuid)
      @type_by_uuid[uuid] = record if record
    end
  end

  def persist_shift!
    @shift ||= user.shifts.build
    @shift.assign_attributes(
      name: params[:name].to_s.strip,
      start_date: params[:start_date],
      end_date: params[:end_date],
      public_holiday: params[:public_holiday],
      all_locked: ActiveModel::Type::Boolean.new.cast(params[:all_locked]) || false
    )
    save_record!(@shift)
  end

  def replace_nested_records!
    @shift.shift_entries.delete_all
    @shift.shift_type_locks.delete_all
    @shift.shift_plans.delete_all
    @shift.shift_role_counts.delete_all
    @shift.shift_staffs.destroy_all

    staff_by_uuid = create_staffs!
    create_role_counts!
    create_plans!
    create_locks!
    create_entries!(staff_by_uuid)
  end

  def create_staffs!
    staffs = Array(params[:staffs])
    if staffs.size > DisplayWidth::MAX_SHIFT_STAFF
      raise Invalid, "職員は#{DisplayWidth::MAX_SHIFT_STAFF}人以下にしてください"
    end
    raise Invalid, "職員を1人以上登録してください" if staffs.empty?

    staff_by_uuid = {}
    staffs.each_with_index do |staff_params, index|
      name = staff_params[:staff_name].to_s.strip
      raise Invalid, "職員名を入力してください" if name.blank?

      record = @shift.shift_staffs.create!(
        staff_name: name,
        role_name_1: staff_params[:role_name_1].presence,
        role_name_2: staff_params[:role_name_2].presence,
        role_name_3: staff_params[:role_name_3].presence,
        sort_order: index
      )
      uuid = staff_params[:client_uuid].to_s.presence || record.id.to_s
      staff_by_uuid[uuid] = record
    end
    staff_by_uuid
  end

  def create_role_counts!
    Array(params[:role_counts]).each_with_index do |count_params, index|
      role_name = count_params[:role_name].to_s.strip
      next if role_name.blank?

      @shift.shift_role_counts.create!(
        role_name: role_name,
        overlap_count: cast_boolean(count_params[:overlap_count], false),
        priority: cast_boolean(count_params[:priority], false),
        required_count: parse_required_count(count_params[:required_count]),
        shortage_notice: cast_boolean(count_params[:shortage_notice], false),
        sort_order: index
      )
    end
  end

  def create_plans!
    Array(params[:plans]).each do |plan_params|
      body = plan_params[:body].to_s
      next if body.blank?

      date = plan_params[:date]
      if DisplayWidth.of(body) > DisplayWidth::MAX_SHIFT_PLAN
        raise Invalid, "#{date}の予定は全角28文字以内にしてください"
      end

      @shift.shift_plans.create!(date: date, body: body)
    end
  end

  def create_locks!
    Array(params[:locked_shift_type_uuids]).uniq.each do |uuid|
      type = @type_by_uuid[uuid.to_s]
      next unless type

      @shift.shift_type_locks.create!(shift_type: type)
    end
  end

  def create_entries!(staff_by_uuid)
    seen = {}
    Array(params[:entries]).each do |entry_params|
      staff = staff_by_uuid[entry_params[:staff_client_uuid].to_s]
      type = @type_by_uuid[entry_params[:shift_type_client_uuid].to_s]
      date = entry_params[:date]
      next if staff.blank? || type.blank? || date.blank?

      key = [ staff.id, date.to_s ]
      next if seen[key]

      seen[key] = true
      @shift.shift_entries.create!(
        shift_staff: staff,
        date: date,
        shift_type: type,
        shift_type_name: type.name,
        shift_type_display_name: type.display_name,
        shift_type_color: type.color,
        shift_type_status: type.status
      )
    end
  end

  def save_record!(record)
    return if record.save

    raise Invalid, record.errors.full_messages
  end

  def cast_boolean(value, default)
    return default if value.nil?

    ActiveModel::Type::Boolean.new.cast(value)
  end

  def parse_required_count(value)
    return 0 if value.blank?

    Integer(value)
  rescue ArgumentError, TypeError
    raise Invalid, "必要人数は0以上の整数にしてください"
  end
end

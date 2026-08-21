# frozen_string_literal: true

class Shift::Serializer
  def self.summary(shift)
    {
      id: shift.id,
      name: shift.name,
      start_date: shift.start_date,
      end_date: shift.end_date,
      public_holiday: shift.public_holiday,
      created_at: shift.created_at,
      updated_at: shift.updated_at
    }
  end

  def self.detail(shift)
    types = shift.user.shift_types.order(:sort_order, :id)
    type_uuid_by_id = types.each_with_object({}) { |type, hash| hash[type.id] = type.client_uuid }

    {
      id: shift.id,
      name: shift.name,
      start_date: shift.start_date,
      end_date: shift.end_date,
      public_holiday: shift.public_holiday,
      all_locked: shift.all_locked,
      updated_at: shift.updated_at,
      shift_types: types.map(&:as_api),
      staffs: shift.shift_staffs.sort_by(&:sort_order).map { |staff| serialize_staff(staff) },
      role_counts: shift.shift_role_counts.sort_by(&:sort_order).map { |row| serialize_role_count(row) },
      shift_type_counts: shift.shift_type_counts.sort_by(&:sort_order).map { |row| serialize_type_count(row) },
      plans: shift.shift_plans.sort_by(&:date).map { |plan| serialize_plan(plan) },
      locked_shift_type_uuids: shift.shift_type_locks.filter_map { |lock| type_uuid_by_id[lock.shift_type_id] },
      entries: shift.shift_entries.map { |entry| serialize_entry(entry, type_uuid_by_id) }
    }
  end

  def self.serialize_staff(staff)
    {
      id: staff.id,
      staff_name: staff.staff_name,
      role_name_1: staff.role_name_1.to_s,
      role_name_2: staff.role_name_2.to_s,
      role_name_3: staff.role_name_3.to_s
    }
  end

  def self.serialize_role_count(row)
    {
      role_name: row.role_name,
      overlap_count: row.overlap_count,
      priority: row.priority,
      required_count: row.required_count,
      shortage_notice: row.shortage_notice
    }
  end

  def self.serialize_type_count(row)
    {
      name: row.name,
      required_count: row.required_count,
      shortage_notice: row.shortage_notice,
      shift_type_client_uuids: row.shift_type_count_items.sort_by(&:sort_order).map(&:shift_type_client_uuid)
    }
  end

  def self.serialize_plan(plan)
    {
      date: plan.date,
      body: plan.body
    }
  end

  def self.serialize_entry(entry, type_uuid_by_id)
    {
      shift_staff_id: entry.shift_staff_id,
      date: entry.date,
      shift_type_client_uuid: type_uuid_by_id[entry.shift_type_id]
    }
  end
  private_class_method :serialize_staff, :serialize_role_count, :serialize_type_count,
                       :serialize_plan, :serialize_entry
end

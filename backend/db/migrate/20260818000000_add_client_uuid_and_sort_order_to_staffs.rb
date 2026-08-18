# frozen_string_literal: true

class AddClientUuidAndSortOrderToStaffs < ActiveRecord::Migration[8.1]
  def up
    add_column :staffs, :client_uuid, :string
    add_column :staffs, :sort_order, :integer, null: false, default: 0

    Staff.reset_column_information
    Staff.find_each do |staff|
      staff.update_columns(client_uuid: SecureRandom.uuid) if staff.client_uuid.blank?
    end

    change_column_null :staffs, :client_uuid, false
    add_index :staffs, [ :user_id, :client_uuid ], unique: true
    add_index :staffs, [ :user_id, :sort_order ]
  end

  def down
    remove_index :staffs, [ :user_id, :sort_order ]
    remove_index :staffs, [ :user_id, :client_uuid ]
    remove_column :staffs, :sort_order
    remove_column :staffs, :client_uuid
  end
end

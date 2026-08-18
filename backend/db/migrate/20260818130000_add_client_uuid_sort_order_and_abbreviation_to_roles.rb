# frozen_string_literal: true

class AddClientUuidSortOrderAndAbbreviationToRoles < ActiveRecord::Migration[8.1]
  def up
    add_column :roles, :client_uuid, :string
    add_column :roles, :sort_order, :integer, null: false, default: 0
    add_column :roles, :abbreviation, :string

    Role.reset_column_information
    Role.find_each do |role|
      role.update_columns(client_uuid: SecureRandom.uuid) if role.client_uuid.blank?
    end

    change_column_null :roles, :client_uuid, false
    add_index :roles, [ :user_id, :client_uuid ], unique: true
    add_index :roles, [ :user_id, :sort_order ]
  end

  def down
    remove_index :roles, [ :user_id, :sort_order ]
    remove_index :roles, [ :user_id, :client_uuid ]
    remove_column :roles, :abbreviation
    remove_column :roles, :sort_order
    remove_column :roles, :client_uuid
  end
end

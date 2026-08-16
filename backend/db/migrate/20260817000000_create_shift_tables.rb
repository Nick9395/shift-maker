# frozen_string_literal: true

class CreateShiftTables < ActiveRecord::Migration[8.1]
  def change
    create_table :staffs do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.jsonb :constraints
      t.timestamps
    end

    create_table :roles do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.timestamps
    end
    add_index :roles, [ :user_id, :name ], unique: true

    create_table :shift_types do |t|
      t.references :user, null: false, foreign_key: true
      t.string :client_uuid, null: false
      t.string :name, null: false
      t.string :display_name
      t.time :start_time
      t.time :end_time
      t.time :break_time
      t.integer :status
      t.string :color
      t.timestamps
    end
    add_index :shift_types, [ :user_id, :client_uuid ], unique: true

    create_table :shifts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.integer :public_holiday, null: false, default: 0
      t.boolean :all_locked, null: false, default: false
      t.timestamps
    end

    create_table :shift_staffs do |t|
      t.references :shift, null: false, foreign_key: { on_delete: :cascade }
      t.bigint :staff_id
      t.string :staff_name, null: false
      t.bigint :role_id_1
      t.bigint :role_id_2
      t.bigint :role_id_3
      t.string :role_name_1
      t.string :role_name_2
      t.string :role_name_3
      t.integer :sort_order, null: false, default: 0
      t.timestamps
    end
    add_foreign_key :shift_staffs, :staffs, column: :staff_id, on_delete: :nullify
    add_foreign_key :shift_staffs, :roles, column: :role_id_1, on_delete: :nullify
    add_foreign_key :shift_staffs, :roles, column: :role_id_2, on_delete: :nullify
    add_foreign_key :shift_staffs, :roles, column: :role_id_3, on_delete: :nullify
    add_index :shift_staffs, :staff_id
    add_index :shift_staffs, :role_id_1
    add_index :shift_staffs, :role_id_2
    add_index :shift_staffs, :role_id_3
    add_index :shift_staffs, [ :shift_id, :sort_order ]

    create_table :shift_role_counts do |t|
      t.references :shift, null: false, foreign_key: { on_delete: :cascade }
      t.bigint :role_id
      t.string :role_name, null: false
      t.boolean :overlap_count, null: false, default: false
      t.boolean :priority, null: false, default: false
      t.integer :required_count, null: false, default: 0
      t.boolean :shortage_notice, null: false, default: false
      t.integer :sort_order, null: false, default: 0
      t.timestamps
    end
    add_foreign_key :shift_role_counts, :roles, column: :role_id, on_delete: :nullify
    add_index :shift_role_counts, :role_id

    create_table :shift_plans do |t|
      t.references :shift, null: false, foreign_key: { on_delete: :cascade }
      t.date :date, null: false
      t.string :body, null: false, default: ""
      t.timestamps
    end
    add_index :shift_plans, [ :shift_id, :date ], unique: true

    create_table :shift_type_locks do |t|
      t.references :shift, null: false, foreign_key: { on_delete: :cascade }
      t.references :shift_type, null: false, foreign_key: true
      t.timestamps
    end
    add_index :shift_type_locks, [ :shift_id, :shift_type_id ], unique: true

    create_table :shift_entries do |t|
      t.references :shift, null: false, foreign_key: { on_delete: :cascade }
      t.bigint :shift_staff_id, null: false
      t.date :date, null: false
      t.bigint :shift_type_id
      t.string :shift_type_name
      t.string :shift_type_display_name
      t.string :shift_type_color
      t.integer :shift_type_status
      t.timestamps
    end
    add_foreign_key :shift_entries, :shift_staffs, column: :shift_staff_id, on_delete: :cascade
    add_foreign_key :shift_entries, :shift_types, column: :shift_type_id, on_delete: :nullify
    add_index :shift_entries, [ :shift_staff_id, :date ], unique: true
    add_index :shift_entries, :shift_type_id
    add_index :shift_entries, [ :shift_id, :date ]
  end
end

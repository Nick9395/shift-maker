# frozen_string_literal: true

class CreateShiftTypeCounts < ActiveRecord::Migration[8.1]
  def change
    create_table :shift_type_counts do |t|
      t.references :shift, null: false, foreign_key: { on_delete: :cascade }
      t.string :name, null: false, default: ""
      t.integer :required_count, null: false, default: 0
      t.boolean :shortage_notice, null: false, default: true
      t.integer :sort_order, null: false, default: 0
      t.timestamps
    end

    create_table :shift_type_count_items do |t|
      t.references :shift_type_count, null: false, foreign_key: { on_delete: :cascade }
      t.bigint :shift_type_id
      t.string :shift_type_client_uuid, null: false
      t.integer :sort_order, null: false, default: 0
      t.timestamps
    end
    add_foreign_key :shift_type_count_items, :shift_types, column: :shift_type_id, on_delete: :nullify
    add_index :shift_type_count_items, :shift_type_id
    add_index :shift_type_count_items, [ :shift_type_count_id, :sort_order ]
  end
end

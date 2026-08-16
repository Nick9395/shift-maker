# frozen_string_literal: true

class AddSortOrderToShiftTypes < ActiveRecord::Migration[8.1]
  def change
    add_column :shift_types, :sort_order, :integer, null: false, default: 0
    add_index :shift_types, [ :user_id, :sort_order ]
  end
end

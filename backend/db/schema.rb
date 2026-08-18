# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_08_18_130000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "jwt_denylists", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "exp"
    t.string "jti"
    t.datetime "updated_at", null: false
    t.index ["jti"], name: "index_jwt_denylists_on_jti", unique: true
  end

  create_table "roles", force: :cascade do |t|
    t.string "abbreviation"
    t.string "client_uuid", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "client_uuid"], name: "index_roles_on_user_id_and_client_uuid", unique: true
    t.index ["user_id", "name"], name: "index_roles_on_user_id_and_name", unique: true
    t.index ["user_id", "sort_order"], name: "index_roles_on_user_id_and_sort_order"
    t.index ["user_id"], name: "index_roles_on_user_id"
  end

  create_table "shift_entries", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.bigint "shift_id", null: false
    t.bigint "shift_staff_id", null: false
    t.string "shift_type_color"
    t.string "shift_type_display_name"
    t.bigint "shift_type_id"
    t.string "shift_type_name"
    t.integer "shift_type_status"
    t.datetime "updated_at", null: false
    t.index ["shift_id", "date"], name: "index_shift_entries_on_shift_id_and_date"
    t.index ["shift_id"], name: "index_shift_entries_on_shift_id"
    t.index ["shift_staff_id", "date"], name: "index_shift_entries_on_shift_staff_id_and_date", unique: true
    t.index ["shift_type_id"], name: "index_shift_entries_on_shift_type_id"
  end

  create_table "shift_plans", force: :cascade do |t|
    t.string "body", default: "", null: false
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.bigint "shift_id", null: false
    t.datetime "updated_at", null: false
    t.index ["shift_id", "date"], name: "index_shift_plans_on_shift_id_and_date", unique: true
    t.index ["shift_id"], name: "index_shift_plans_on_shift_id"
  end

  create_table "shift_role_counts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "overlap_count", default: false, null: false
    t.boolean "priority", default: false, null: false
    t.integer "required_count", default: 0, null: false
    t.bigint "role_id"
    t.string "role_name", null: false
    t.bigint "shift_id", null: false
    t.boolean "shortage_notice", default: false, null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["role_id"], name: "index_shift_role_counts_on_role_id"
    t.index ["shift_id"], name: "index_shift_role_counts_on_shift_id"
  end

  create_table "shift_staffs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "role_id_1"
    t.bigint "role_id_2"
    t.bigint "role_id_3"
    t.string "role_name_1"
    t.string "role_name_2"
    t.string "role_name_3"
    t.bigint "shift_id", null: false
    t.integer "sort_order", default: 0, null: false
    t.bigint "staff_id"
    t.string "staff_name", null: false
    t.datetime "updated_at", null: false
    t.index ["role_id_1"], name: "index_shift_staffs_on_role_id_1"
    t.index ["role_id_2"], name: "index_shift_staffs_on_role_id_2"
    t.index ["role_id_3"], name: "index_shift_staffs_on_role_id_3"
    t.index ["shift_id", "sort_order"], name: "index_shift_staffs_on_shift_id_and_sort_order"
    t.index ["shift_id"], name: "index_shift_staffs_on_shift_id"
    t.index ["staff_id"], name: "index_shift_staffs_on_staff_id"
  end

  create_table "shift_type_locks", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "shift_id", null: false
    t.bigint "shift_type_id", null: false
    t.datetime "updated_at", null: false
    t.index ["shift_id", "shift_type_id"], name: "index_shift_type_locks_on_shift_id_and_shift_type_id", unique: true
    t.index ["shift_id"], name: "index_shift_type_locks_on_shift_id"
    t.index ["shift_type_id"], name: "index_shift_type_locks_on_shift_type_id"
  end

  create_table "shift_types", force: :cascade do |t|
    t.time "break_time"
    t.string "client_uuid", null: false
    t.string "color"
    t.datetime "created_at", null: false
    t.string "display_name"
    t.time "end_time"
    t.string "name", null: false
    t.integer "sort_order", default: 0, null: false
    t.time "start_time"
    t.integer "status"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "client_uuid"], name: "index_shift_types_on_user_id_and_client_uuid", unique: true
    t.index ["user_id", "sort_order"], name: "index_shift_types_on_user_id_and_sort_order"
    t.index ["user_id"], name: "index_shift_types_on_user_id"
  end

  create_table "shifts", force: :cascade do |t|
    t.boolean "all_locked", default: false, null: false
    t.datetime "created_at", null: false
    t.date "end_date", null: false
    t.string "name", null: false
    t.integer "public_holiday", default: 0, null: false
    t.date "start_date", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_shifts_on_user_id"
  end

  create_table "staffs", force: :cascade do |t|
    t.string "client_uuid", null: false
    t.jsonb "constraints"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "client_uuid"], name: "index_staffs_on_user_id_and_client_uuid", unique: true
    t.index ["user_id", "sort_order"], name: "index_staffs_on_user_id_and_sort_order"
    t.index ["user_id"], name: "index_staffs_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name", default: "", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "roles", "users"
  add_foreign_key "shift_entries", "shift_staffs", on_delete: :cascade
  add_foreign_key "shift_entries", "shift_types", on_delete: :nullify
  add_foreign_key "shift_entries", "shifts", on_delete: :cascade
  add_foreign_key "shift_plans", "shifts", on_delete: :cascade
  add_foreign_key "shift_role_counts", "roles", on_delete: :nullify
  add_foreign_key "shift_role_counts", "shifts", on_delete: :cascade
  add_foreign_key "shift_staffs", "roles", column: "role_id_1", on_delete: :nullify
  add_foreign_key "shift_staffs", "roles", column: "role_id_2", on_delete: :nullify
  add_foreign_key "shift_staffs", "roles", column: "role_id_3", on_delete: :nullify
  add_foreign_key "shift_staffs", "shifts", on_delete: :cascade
  add_foreign_key "shift_staffs", "staffs", on_delete: :nullify
  add_foreign_key "shift_type_locks", "shift_types"
  add_foreign_key "shift_type_locks", "shifts", on_delete: :cascade
  add_foreign_key "shift_types", "users"
  add_foreign_key "shifts", "users"
  add_foreign_key "staffs", "users"
end

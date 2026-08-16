class User < ApplicationRecord
  # JWT 失効は denylist 方式
  devise :database_authenticatable, :registerable,
         :recoverable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  has_many :shifts, dependent: :destroy
  has_many :staffs, class_name: "Staff", dependent: :destroy
  has_many :roles, dependent: :destroy
  has_many :shift_types, dependent: :destroy

  validates :name, presence: true, length: { minimum: 1, maximum: 12 }
end

class User < ApplicationRecord
  # JWT 失効は denylist 方式
  devise :database_authenticatable, :registerable,
         :recoverable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist
end

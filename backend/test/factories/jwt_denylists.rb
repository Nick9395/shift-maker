FactoryBot.define do
  factory :jwt_denylist do
    jti { "MyString" }
    exp { "2026-07-24 10:21:35" }
  end
end

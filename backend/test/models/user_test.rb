require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "name は 1〜12 文字必須" do
    user = build(:user, name: "")
    assert_not user.valid?
    assert_includes user.errors[:name], "を入力してください"

    user.name = "あ" * 13
    assert_not user.valid?

    user.name = "ニック"
    assert user.valid?
  end
end


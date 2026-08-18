# frozen_string_literal: true

# 半角1・全角2で数える表示幅（フロントの textDisplayWidth と揃える）
module DisplayWidth
  HALFWIDTH_KANA_BEGIN = 0xff61
  HALFWIDTH_KANA_END = 0xff9f
  MAX_SHIFT_PLAN = 56
  MAX_SHIFT_STAFF = 60
  MAX_SHIFT_TYPES = 30
  MAX_SHIFTS = 30
  MAX_ROLES = 30

  module_function

  def of(text)
    text.to_s.each_char.sum { |char| half_width?(char) ? 1 : 2 }
  end

  def half_width?(char)
    code = char.ord
    code <= 0x7f || (code >= HALFWIDTH_KANA_BEGIN && code <= HALFWIDTH_KANA_END)
  end
end

# frozen_string_literal: true

# SPA 向けにパスワードリセット URL をフロントエンドへ向ける
class DeviseCustomMailer < Devise::Mailer
  default template_path: "devise/mailer"

  def reset_password_instructions(record, token, opts = {})
    @token = token
    @frontend_reset_url = frontend_reset_url(token)
    devise_mail(record, :reset_password_instructions, opts)
  end

  private

  def frontend_reset_url(token)
    base = ENV.fetch("FRONTEND_URL", "http://localhost:3001")
    "#{base}/password/reset?reset_password_token=#{CGI.escape(token)}"
  end
end

import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const FROM = process.env.EMAIL_FROM || 'noreply@jheisonadsbuilderpro.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const transporter = createTransporter()
  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Redefinir senha — Jheison Ads Builder Pro',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1;">Redefinir sua senha</h2>
        <p>Clique no link abaixo para redefinir sua senha. O link expira em 1 hora.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Redefinir Senha</a>
        <p style="color:#6b7280;font-size:14px;">Se não solicitou, ignore este email.</p>
      </div>
    `,
  })
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const transporter = createTransporter()
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Bem-vindo ao Jheison Ads Builder Pro!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1;">Bem-vindo, ${name}!</h2>
        <p>Sua conta foi criada com sucesso. Acesse o painel para começar a criar campanhas Google Ads de alta performance.</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Acessar Painel</a>
      </div>
    `,
  })
}

export async function sendSubscriptionConfirmationEmail(
  email: string,
  planName: string,
  renewalDate: string
): Promise<void> {
  const transporter = createTransporter()
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Plano ${planName} ativado — Jheison Ads Builder Pro`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1;">Plano ${planName} Ativado!</h2>
        <p>Seu plano <strong>${planName}</strong> foi ativado com sucesso.</p>
        <p>Próxima renovação: <strong>${renewalDate}</strong></p>
        <a href="${APP_URL}/billing" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Gerenciar Assinatura</a>
      </div>
    `,
  })
}

export async function sendRenewalReminderEmail(
  email: string,
  planName: string,
  renewalDate: string
): Promise<void> {
  const transporter = createTransporter()
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Renovação em 7 dias — Plano ${planName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#6366f1;">Renovação em 7 dias</h2>
        <p>Seu plano <strong>${planName}</strong> será renovado automaticamente em <strong>${renewalDate}</strong>.</p>
        <p>Certifique-se de que seu cartão está atualizado.</p>
        <a href="${APP_URL}/billing" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Gerenciar Assinatura</a>
      </div>
    `,
  })
}

export async function sendPaymentFailedEmail(
  email: string,
  planName: string,
  attempt: number
): Promise<void> {
  const transporter = createTransporter()
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Falha no pagamento — Plano ${planName} (tentativa ${attempt}/3)`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#ef4444;">Falha no Pagamento</h2>
        <p>Não conseguimos processar o pagamento do seu plano <strong>${planName}</strong> (tentativa ${attempt} de 3).</p>
        <p>Atualize seu método de pagamento para evitar o cancelamento da assinatura.</p>
        <a href="${APP_URL}/billing" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Atualizar Pagamento</a>
      </div>
    `,
  })
}

export async function sendCampaignPausedEmail(
  email: string,
  campaignName: string
): Promise<void> {
  const transporter = createTransporter()
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Campanha pausada no Google Ads — ${campaignName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#f59e0b;">Campanha Pausada</h2>
        <p>A campanha <strong>${campaignName}</strong> foi pausada no Google Ads.</p>
        <a href="${APP_URL}/campaigns" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Ver Campanhas</a>
      </div>
    `,
  })
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  private readonly from = process.env.RESEND_FROM_EMAIL?.trim() ?? '';
  private readonly webUrl = process.env.APP_WEB_URL?.trim() ?? '';
  private readonly resend = this.apiKey ? new Resend(this.apiKey) : null;

  private assertConfigured() {
    if (!this.resend || !this.from || !this.webUrl) {
      throw new InternalServerErrorException(
        'Configure RESEND_API_KEY, RESEND_FROM_EMAIL e APP_WEB_URL para enviar e-mails.',
      );
    }
  }

  private buildUrl(path: string, token: string) {
    const base = this.webUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}?token=${encodeURIComponent(token)}`;
  }

  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) {
    this.assertConfigured();

    const { error } = await this.resend!.emails.send({
      from: this.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) {
      throw new InternalServerErrorException(`Falha ao enviar e-mail: ${error.message}`);
    }
  }

  async sendEmailVerification(params: { to: string; name: string; token: string }) {
    const actionUrl = this.buildUrl('/verify-email.html', params.token);
    await this.sendEmail({
      to: params.to,
      subject: 'Confirme seu cadastro no NearMe',
      text: [
        `Oi, ${params.name}.`,
        '',
        'Seu cadastro no NearMe foi criado. Confirme o seu e-mail para liberar o login com senha.',
        actionUrl,
      ].join('\n'),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#0f1311;color:#f3efe4;padding:32px">
          <div style="max-width:560px;margin:0 auto;background:#171d19;border:1px solid #2a332d;border-radius:24px;padding:32px">
            <p style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#d9c48a;margin:0 0 12px">NearMe</p>
            <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px">Confirme seu cadastro</h1>
            <p style="font-size:16px;line-height:1.6;color:#c4c9c6;margin:0 0 24px">
              Oi, ${params.name}. Seu cadastro foi criado. Confirme o e-mail para liberar o login com senha.
            </p>
            <a href="${actionUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#d9c48a;color:#111;text-decoration:none;font-weight:700">
              Confirmar e-mail
            </a>
            <p style="font-size:14px;line-height:1.6;color:#8f9692;margin:24px 0 0">
              Se o botão não abrir, copie este link no navegador:<br />
              <a href="${actionUrl}" style="color:#d9c48a">${actionUrl}</a>
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendPasswordReset(params: { to: string; name: string; token: string }) {
    const actionUrl = this.buildUrl('/reset-password.html', params.token);
    await this.sendEmail({
      to: params.to,
      subject: 'Redefina sua senha no NearMe',
      text: [
        `Oi, ${params.name}.`,
        '',
        'Recebemos um pedido para redefinir sua senha no NearMe.',
        'Se foi você, use este link:',
        actionUrl,
      ].join('\n'),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#0f1311;color:#f3efe4;padding:32px">
          <div style="max-width:560px;margin:0 auto;background:#171d19;border:1px solid #2a332d;border-radius:24px;padding:32px">
            <p style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#d9c48a;margin:0 0 12px">NearMe</p>
            <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px">Redefina sua senha</h1>
            <p style="font-size:16px;line-height:1.6;color:#c4c9c6;margin:0 0 24px">
              Recebemos um pedido para redefinir a senha da sua conta. Se foi você, continue pelo botão abaixo.
            </p>
            <a href="${actionUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#d9c48a;color:#111;text-decoration:none;font-weight:700">
              Redefinir senha
            </a>
            <p style="font-size:14px;line-height:1.6;color:#8f9692;margin:24px 0 0">
              Se você não pediu essa troca, ignore este e-mail. O link expira automaticamente.
            </p>
          </div>
        </div>
      `,
    });
  }
}

import nodemailer from 'nodemailer';

  // Sélectionne automatiquement le bon transport selon les variables d'environnement disponibles
const resolveTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    MAILTRAP_USER,
    MAILTRAP_PASS,
    EMAIL_USER,
    EMAIL_PASS,
    NODE_ENV
  } = process.env;

  // 1) Priorité aux variables SMTP_* si fournies (votre cas actuel)
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const port = SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587;
    const secure = (SMTP_SECURE === 'true' || SMTP_SECURE === '1') || port === 465;
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
  }

  // 2) En dev: Mailtrap si présent
  if (NODE_ENV !== 'production' && MAILTRAP_USER && MAILTRAP_PASS) {
    return nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: { user: MAILTRAP_USER, pass: MAILTRAP_PASS }
    });
  }

  // 3) Sinon: Gmail via EMAIL_USER/EMAIL_PASS
  if (EMAIL_USER && EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });
  }

  throw new Error('Aucune configuration SMTP valide trouvée. Définissez SMTP_* ou EMAIL_* ou MAILTRAP_*');
};

const FROM_DEFAULT = process.env.EMAIL_FROM || process.env.ADMIN_EMAIL || 'ElectroPro Guinée <noreply@electropro.com>';

// Fonction pour envoyer un email de réinitialisation
export const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    const transporter = resolveTransporter();

    const mailOptions = {
      from: FROM_DEFAULT,
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe - ElectroPro Guinée',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af; margin: 0; font-size: 24px;">ElectroPro Guinée</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Réinitialisation de mot de passe</p>
            </div>
            <div style="margin-bottom: 25px;">
              <p style="color: #374151; line-height: 1.6; margin: 0;">
                Bonjour,<br><br>
                Vous avez demandé la réinitialisation de votre mot de passe pour votre compte ElectroPro Guinée.
              </p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #1e40af; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                🔐 Réinitialiser mon mot de passe
              </a>
            </div>
            <div style="margin-bottom: 25px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                <strong>Important :</strong><br>
                • Ce lien expire dans 1 heure<br>
                • Si vous n'avez pas demandé cette réinitialisation, ignorez cet email<br>
                • Pour des raisons de sécurité, ne partagez jamais ce lien
              </p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.<br>
                © 2024 ElectroPro Guinée. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `ElectroPro Guinée - Réinitialisation de mot de passe\n\n` +
        `Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe pour votre compte ElectroPro Guinée.\n\n` +
        `Cliquez sur ce lien pour réinitialiser votre mot de passe :\n${resetUrl}\n\n` +
        `Ce lien expire dans 1 heure.\n\n` +
        `Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\n` +
        `Pour des raisons de sécurité, ne partagez jamais ce lien.\n\n` +
        `© 2024 ElectroPro Guinée. Tous droits réservés.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email de réinitialisation envoyé:', info.messageId);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw new Error('Impossible d\'envoyer l\'email de réinitialisation');
  }
};

// Fonction pour envoyer un email de confirmation
export const sendPasswordChangedEmail = async (email) => {
  try {
    const transporter = resolveTransporter();

    const mailOptions = {
      from: FROM_DEFAULT,
      to: email,
      subject: '✅ Votre mot de passe a été modifié - ElectroPro Guinée',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; margin: 0; font-size: 24px;">ElectroPro Guinée</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Confirmation de modification de mot de passe</p>
            </div>
            <div style="margin-bottom: 25px;">
              <p style="color: #374151; line-height: 1.6; margin: 0;">
                Bonjour,<br><br>
                Votre mot de passe a été modifié avec succès pour votre compte ElectroPro Guinée.
              </p>
            </div>
            <div style="background-color: #d1fae5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <p style="color: #065f46; margin: 0; text-align: center; font-weight: bold;">
                ✅ Votre mot de passe a été modifié avec succès !
              </p>
            </div>
            <div style="margin-bottom: 25px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                <strong>Rappel de sécurité :</strong><br>
                • Gardez votre mot de passe confidentiel<br>
                • Utilisez un mot de passe fort et unique<br>
                • Activez l'authentification à deux facteurs si disponible
              </p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.<br>
                © 2024 ElectroPro Guinée. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email de confirmation envoyé:', info.messageId);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    return false; // ne pas bloquer le flux si l'email de confirmation échoue
  }
};

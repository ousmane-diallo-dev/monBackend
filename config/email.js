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

// Fonction pour envoyer un email de confirmation de commande
export const sendOrderConfirmationEmail = async (order, clientEmail, clientName) => {
  try {
    const transporter = resolveTransporter();

    // Calculer le total et formater les produits
    const formatPrice = (price) => new Intl.NumberFormat('fr-GN', { 
      style: 'currency', 
      currency: 'GNF',
      minimumFractionDigits: 0 
    }).format(price);

    const produitsHtml = order.produits.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; color: #374151;">${item.produit.nom}</td>
        <td style="padding: 12px 8px; text-align: center; color: #6b7280;">${item.quantite}</td>
        <td style="padding: 12px 8px; text-align: right; color: #374151; font-weight: 500;">${formatPrice(item.prixUnitaire)}</td>
        <td style="padding: 12px 8px; text-align: right; color: #374151; font-weight: 600;">${formatPrice(item.prixUnitaire * item.quantite)}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: FROM_DEFAULT,
      to: clientEmail,
      subject: `📦 Confirmation de votre commande #${order._id.toString().slice(-8)} - ElectroPro Guinée`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- En-tête -->
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #1e40af;">
              <h1 style="color: #1e40af; margin: 0; font-size: 28px;">📦 ElectroPro Guinée</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Confirmation de commande</p>
            </div>

            <!-- Message de bienvenue -->
            <div style="margin-bottom: 25px;">
              <p style="color: #374151; line-height: 1.6; margin: 0; font-size: 16px;">
                Bonjour <strong>${clientName}</strong>,<br><br>
                Nous avons bien reçu votre commande ! Merci de votre confiance en ElectroPro Guinée.
              </p>
            </div>

            <!-- Statut de la commande -->
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <p style="color: #92400e; margin: 0; text-align: center; font-weight: bold; font-size: 16px;">
                ⏳ Votre commande est en attente de validation par notre équipe
              </p>
              <p style="color: #92400e; margin: 10px 0 0 0; text-align: center; font-size: 14px;">
                Vous recevrez un email dès que votre commande sera validée et prête pour la livraison.
              </p>
            </div>

            <!-- Détails de la commande -->
            <div style="margin: 30px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📋 Détails de votre commande</h3>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 5px 0; color: #374151;"><strong>Numéro de commande :</strong> #${order._id.toString().slice(-8)}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Date de commande :</strong> ${new Date(order.dateCommande).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Mode de paiement :</strong> ${order.modePaiement}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Adresse de livraison :</strong> ${order.adresseLivraison}</p>
              </div>
            </div>

            <!-- Tableau des produits -->
            <div style="margin: 30px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">🛒 Produits commandés</h3>
              <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 15px 8px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Produit</th>
                    <th style="padding: 15px 8px; text-align: center; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Qté</th>
                    <th style="padding: 15px 8px; text-align: right; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Prix unitaire</th>
                    <th style="padding: 15px 8px; text-align: right; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Sous-total</th>
                  </tr>
                </thead>
                <tbody>
                  ${produitsHtml}
                </tbody>
                <tfoot>
                  <tr style="background-color: #1e40af; color: white;">
                    <td colspan="3" style="padding: 15px 8px; text-align: right; font-weight: 600; font-size: 16px;">TOTAL :</td>
                    <td style="padding: 15px 8px; text-align: right; font-weight: 700; font-size: 18px;">${formatPrice(order.montantTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Prochaines étapes -->
            <div style="margin: 30px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">🚀 Prochaines étapes</h3>
              <div style="background-color: #eff6ff; border-left: 4px solid #1e40af; padding: 20px; border-radius: 0 8px 8px 0;">
                <ol style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
                  <li><strong>Validation :</strong> Notre équipe vérifie votre commande (sous 24h)</li>
                  <li><strong>Préparation :</strong> Nous préparons vos produits avec soin</li>
                  <li><strong>Livraison :</strong> Expédition vers votre adresse de livraison</li>
                  <li><strong>Réception :</strong> Vous recevez vos produits ElectroPro !</li>
                </ol>
              </div>
            </div>

            <!-- Informations de contact -->
            <div style="margin: 30px 0;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">📞 Besoin d'aide ?</h3>
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; color: #374151;">Notre équipe est là pour vous aider :</p>
                <p style="margin: 5px 0; color: #374151;"><strong>📧 Email :</strong> support@electropro-guinee.com</p>
                <p style="margin: 5px 0; color: #374151;"><strong>📱 Téléphone :</strong> +224 XXX XX XX XX</p>
                <p style="margin: 5px 0; color: #374151;"><strong>🕒 Horaires :</strong> Lun-Ven 8h-18h, Sam 8h-13h</p>
              </div>
            </div>

            <!-- Pied de page -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.<br>
                Pour toute question, utilisez nos coordonnées ci-dessus.<br><br>
                © 2024 ElectroPro Guinée. Tous droits réservés.<br>
                Votre partenaire de confiance pour l'équipement électrique professionnel.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `ElectroPro Guinée - Confirmation de commande #${order._id.toString().slice(-8)}\n\n` +
        `Bonjour ${clientName},\n\n` +
        `Nous avons bien reçu votre commande ! Merci de votre confiance.\n\n` +
        `DÉTAILS DE LA COMMANDE :\n` +
        `- Numéro : #${order._id.toString().slice(-8)}\n` +
        `- Date : ${new Date(order.dateCommande).toLocaleDateString('fr-FR')}\n` +
        `- Mode de paiement : ${order.modePaiement}\n` +
        `- Adresse de livraison : ${order.adresseLivraison}\n\n` +
        `PRODUITS COMMANDÉS :\n` +
        order.produits.map(item => 
          `- ${item.produit.nom} x${item.quantite} = ${formatPrice(item.prixUnitaire * item.quantite)}`
        ).join('\n') + `\n\n` +
        `TOTAL : ${formatPrice(order.montantTotal)}\n\n` +
        `STATUT : Votre commande est en attente de validation par notre équipe.\n` +
        `Vous recevrez un email dès que votre commande sera validée.\n\n` +
        `CONTACT :\n` +
        `Email : support@electropro-guinee.com\n` +
        `Téléphone : +224 XXX XX XX XX\n\n` +
        `© 2024 ElectroPro Guinée. Tous droits réservés.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email de confirmation de commande envoyé:', info.messageId);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation de commande:', error);
    return false; // ne pas bloquer le flux si l'email échoue
  }
};

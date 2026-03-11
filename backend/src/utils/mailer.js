const nodemailer = require('nodemailer');

const getFrontendBaseUrl = () => {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};

// On configure le "transporteur"
// On utilise des variables d'environnement pour cacher les mots de passe.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true pour le port 465, false pour les autres
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendPasswordResetEmail = async (userEmail, resetToken) => {
  // L'URL vers ton futur front-end React
  const resetUrl = `${getFrontendBaseUrl()}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"L\'équipe Golden Hour" <noreply@goldenhour.com>',
    to: userEmail,
    subject: "Réinitialisation de votre mot de passe 🔒",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Golden Hour.</p>
        <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #FFD700; color: #333; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Réinitialiser mon mot de passe</a>
        </div>
        <p style="font-size: 12px; color: #777;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité. Ce lien expirera dans 1 heure.</p>
      </div>
    `,
  };

  // On envoie l'email
  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };

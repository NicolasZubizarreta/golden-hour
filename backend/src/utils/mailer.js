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

// --- NOTIFICATION : TÂCHE ASSIGNÉE ---
const sendTaskAssignedEmail = async (userEmail, userName, taskTitle, groupName) => {
  const dashboardUrl = `${getFrontendBaseUrl()}/hub`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"L\'équipe Golden Hour" <noreply@goldenhour.com>',
    to: userEmail,
    subject: `Nouvelle tâche assignée : ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">Une tâche vous a été assignée</h2>
        <p>Bonjour ${userName},</p>
        <p>Une nouvelle tâche vous a été assignée dans le groupe <strong>${groupName}</strong> :</p>
        <p style="background:#f5f7f8; border-left:4px solid #FFD700; padding:12px 16px; border-radius:6px; font-weight:bold;">${taskTitle}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="background-color: #FFD700; color: #333; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Voir mes groupes</a>
        </div>
        <p style="font-size: 12px; color: #777;">Vous recevez cet email car vous êtes membre de ce groupe sur Golden Hour.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail, sendTaskAssignedEmail };

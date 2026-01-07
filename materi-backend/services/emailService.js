const nodemailer = require('nodemailer');

// Configurar transporter de nodemailer
let transporter = null;

function initializeTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email configuration not found. Email sending will be disabled.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true para puerto 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('Email transporter initialized successfully');
    return transporter;
  } catch (err) {
    console.error('Error initializing email transporter', err.message);
    return null;
  }
}

// Enviar email de recuperación de contraseña
async function sendPasswordResetEmail(to, resetToken, userName) {
  if (!transporter) {
    transporter = initializeTransporter();
  }

  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Materi App" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Recuperación de contraseña - Materi',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .content p {
            margin: 0 0 16px 0;
            color: #555;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: #E53935;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            padding: 20px 30px;
            background: #f8f8f8;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #e0e0e0;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning p {
            margin: 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <p><strong>Hola ${userName},</strong></p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Materi.</p>
            <p>Hacé clic en el siguiente botón para crear una nueva contraseña:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </div>
            <div class="warning">
              <p><strong>⚠️ Importante:</strong> Este enlace es válido por 1 hora. Si no solicitaste este cambio, podés ignorar este email de forma segura.</p>
            </div>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Materi. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hola ${userName},

Recibimos una solicitud para restablecer la contraseña de tu cuenta en Materi.

Para crear una nueva contraseña, visitá el siguiente enlace:
${resetUrl}

Este enlace es válido por 1 hora.

Si no solicitaste este cambio, podés ignorar este email de forma segura.

---
Este es un email automático, por favor no respondas a este mensaje.
© ${new Date().getFullYear()} Materi. Todos los derechos reservados.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent', info.messageId, to);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending password reset email', err.message, to);
    throw err;
  }
}

module.exports = {
  initializeTransporter,
  sendPasswordResetEmail,
};

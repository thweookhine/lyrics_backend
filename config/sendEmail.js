const sendgridMail = require('@sendgrid/mail');

sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (email, subject, html) => {
  const message = {
    to: email,
    from: process.env.EMAIL_USER,
    subject: subject,
    html: html
  };
  try {
    const result = await sendgridMail.send(message);
  } catch (error) {
      console.error('SendGrid Error:', error.response?.body || error.message);
  }
};

module.exports = sendEmail;
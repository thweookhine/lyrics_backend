const sendgridMail = require('@sendgrid/mail');

sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (email, subject, html) => {
  const message = {
    to: email,
    from: process.env.EMAIL_USER,
    subject: subject,
    html: html
  };
  await sendgridMail.send(message);
};

module.exports = sendEmail;
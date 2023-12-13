const emailTemplate = () => {
  return `
    <h1>Thank you for registering!</h1><br/>
    <p>You have successfully registered for Z-jobs.</p><br/>
    <p>Please click on the link below to verify your email address.</p><br/>
    <a href=${process.env.VERIFY_EMAIL_ADDRESS}>Verify Email</a><br/>
    <br/>
    <p> p.s. If you did not register for Z-jobs, please ignore this email.</p><br/>
    <p>Thank you!</p>
  `;
};

module.exports = emailTemplate;

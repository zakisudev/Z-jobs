export const emailTemplate = () => {
  return `
    <h1>Thank you for registering!</h1>
    <p>You have successfully registered for Z-jobs.</p>
    <p>Please click on the link below to verify your email address.</p>
    <a href=${process.env.VERIFY_EMAIL_ADDRESS}>Verify Email</a>
    <p>Thank you!</p>
  `;
};

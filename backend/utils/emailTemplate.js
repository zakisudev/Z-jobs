const emailTemplate = (userId) => {
  return `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
      border: 1px solid #cccccc;
      border-radius: 10px;
      background-color: #ffffff;
    ">
      <h1 style="color: #444444;">Welcome to Z-jobs!</h1>
      <p style="color: #666666;">Thank you for registering. You're just one step away from completing your registration.</p>
      <a href="http://localhost:5000/api/users/verify?userId=${userId}"
        style="
        display: inline-block;
        margin: 20px auto;
        padding: 10px 20px;
        color: #ffffff;
        background-color: #007BFF;
        border-radius: 5px;
        text-decoration: none;
      ">Verify Email</a>
      <p style="color: #666666;">If you did not register for Z-jobs, please ignore this email.</p>
      <p style="color: #666666;">Thank you!</p>
    </div>
  `;
};

module.exports = emailTemplate;

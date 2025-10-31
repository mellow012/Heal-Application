/**
 * Email Testing Utility
 * 
 * This script helps you test your email configuration
 * Run with: npx ts-node scripts/test-email.ts
 * Or: node -r dotenv/config scripts/test-email.js
 */

import nodemailer from 'nodemailer';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testEmailConfiguration() {
  log('\n🧪 Testing Email Configuration...\n', colors.blue);

  // Step 1: Check environment variables
  log('Step 1: Checking environment variables...', colors.yellow);
  
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

  if (!EMAIL_USER) {
    log('❌ EMAIL_USER is not set in .env.local', colors.red);
    process.exit(1);
  }
  log(`✅ EMAIL_USER: ${EMAIL_USER}`, colors.green);

  if (!EMAIL_PASS) {
    log('❌ EMAIL_PASS is not set in .env.local', colors.red);
    log('⚠️  Remember to use Gmail App Password, not regular password!', colors.yellow);
    process.exit(1);
  }
  log(`✅ EMAIL_PASS: ${'*'.repeat(EMAIL_PASS.length)} (hidden)`, colors.green);
  log(`✅ EMAIL_FROM: ${EMAIL_FROM}`, colors.green);

  // Step 2: Create transporter
  log('\nStep 2: Creating email transporter...', colors.yellow);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  // Step 3: Verify transporter
  log('\nStep 3: Verifying transporter configuration...', colors.yellow);
  
  try {
    await transporter.verify();
    log('✅ Transporter verified successfully!', colors.green);
  } catch (error: any) {
    log('❌ Transporter verification failed!', colors.red);
    log(`Error: ${error.message}`, colors.red);
    
    if (error.code === 'EAUTH') {
      log('\n💡 Common fixes for EAUTH error:', colors.yellow);
      log('   1. Make sure you\'re using a Gmail App Password (not regular password)', colors.yellow);
      log('   2. Enable 2-Factor Authentication on your Gmail account', colors.yellow);
      log('   3. Generate a new App Password at: https://myaccount.google.com/apppasswords', colors.yellow);
    }
    
    process.exit(1);
  }

  // Step 4: Send test email
  log('\nStep 4: Sending test email...', colors.yellow);
  log('📧 Recipient: Sending to the configured EMAIL_USER', colors.blue);
  
  const mailOptions = {
    from: EMAIL_FROM,
    to: EMAIL_USER, // Send to self for testing
    subject: '✅ Test Email - Healthcare Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #4CAF50; text-align: center;">✅ Email Configuration Successful!</h1>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Congratulations! Your email configuration is working correctly.
          </p>
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Configuration Details:</h3>
            <ul style="color: #666;">
              <li><strong>From:</strong> ${EMAIL_FROM}</li>
              <li><strong>User:</strong> ${EMAIL_USER}</li>
              <li><strong>Service:</strong> Gmail</li>
              <li><strong>Test Date:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            You can now send hospital onboarding emails without any issues!
          </p>
          <p style="font-size: 14px; color: #999; margin-top: 30px; text-align: center;">
            This is an automated test email from your Healthcare Platform
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
✅ Email Configuration Successful!

Congratulations! Your email configuration is working correctly.

Configuration Details:
- From: ${EMAIL_FROM}
- User: ${EMAIL_USER}
- Service: Gmail
- Test Date: ${new Date().toLocaleString()}

You can now send hospital onboarding emails without any issues!

This is an automated test email from your Healthcare Platform.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    log('✅ Test email sent successfully!', colors.green);
    log(`📬 Message ID: ${info.messageId}`, colors.blue);
    log(`📧 Check your inbox at: ${EMAIL_USER}`, colors.blue);
  } catch (error: any) {
    log('❌ Failed to send test email!', colors.red);
    log(`Error: ${error.message}`, colors.red);
    
    if (error.responseCode === 550) {
      log('\n💡 Error 550 usually means:', colors.yellow);
      log('   - The recipient email address is invalid', colors.yellow);
      log('   - Or the recipient\'s mailbox is full', colors.yellow);
    }
    
    process.exit(1);
  }

  // Success summary
  log('\n' + '='.repeat(50), colors.green);
  log('🎉 ALL TESTS PASSED!', colors.green);
  log('='.repeat(50), colors.green);
  log('\nYour email configuration is ready for production!', colors.green);
  log('You can now use the hospital onboarding system.\n', colors.green);
}

// Run the test
testEmailConfiguration().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});
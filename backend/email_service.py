"""
Email Sending Service

This module provides functionality for sending emails.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
EMAIL_FROM = os.getenv('EMAIL_FROM', 'noreply@example.com')
EMAIL_FROM_NAME = os.getenv('EMAIL_FROM_NAME', 'MedicData Analytics')

# Check if email configuration is available
EMAIL_ENABLED = all([SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD])

class EmailService:
    """Email service for sending emails"""
    
    @staticmethod
    def send_email(to_email, subject, text_content, html_content=None):
        """Send an email
        
        Args:
            to_email (str): Recipient email address
            subject (str): Email subject
            text_content (str): Plain text content
            html_content (str, optional): HTML content
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        if not EMAIL_ENABLED:
            print("Email service not configured. Cannot send email.")
            print(f"Would send to: {to_email}")
            print(f"Subject: {subject}")
            print(f"Content: {text_content[:100]}...")
            return False
        
        try:
            # Create message container
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>"
            msg['To'] = to_email
            
            # Attach parts
            part1 = MIMEText(text_content, 'plain')
            msg.attach(part1)
            
            if html_content:
                part2 = MIMEText(html_content, 'html')
                msg.attach(part2)
            
            # Connect to SMTP server
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()  # Secure the connection
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.sendmail(EMAIL_FROM, to_email, msg.as_string())
            
            print(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

# Verification email template
VERIFICATION_EMAIL_TEMPLATE_HTML = """
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 10px 20px; text-align: center; }
    .content { padding: 20px; border: 1px solid #ddd; }
    .button { display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verify Your Email Address</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Thank you for registering with MedicData Analytics. Please click the button below to verify your email address:</p>
      <p style="text-align: center;">
        <a class="button" href="{verification_link}">Verify Email Address</a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p>{verification_link}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not register for an account, please ignore this email.</p>
      <p>Best regards,<br>The MedicData Analytics Team</p>
    </div>
  </div>
</body>
</html>
"""

VERIFICATION_EMAIL_TEMPLATE_TEXT = """
Verify Your Email Address

Hello,

Thank you for registering with MedicData Analytics. Please click the link below to verify your email address:

{verification_link}

This link will expire in 24 hours.

If you did not register for an account, please ignore this email.

Best regards,
The MedicData Analytics Team
"""

# Password reset email template
PASSWORD_RESET_EMAIL_TEMPLATE_HTML = """
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 10px 20px; text-align: center; }
    .content { padding: 20px; border: 1px solid #ddd; }
    .button { display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We received a request to reset your password for your MedicData Analytics account. To reset your password, click the button below:</p>
      <p style="text-align: center;">
        <a class="button" href="{reset_link}">Reset Password</a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p>{reset_link}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>Best regards,<br>The MedicData Analytics Team</p>
    </div>
  </div>
</body>
</html>
"""

PASSWORD_RESET_EMAIL_TEMPLATE_TEXT = """
Reset Your Password

Hello,

We received a request to reset your password for your MedicData Analytics account. To reset your password, click the link below:

{reset_link}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Best regards,
The MedicData Analytics Team
"""

def send_verification_email(to_email, verification_link):
    """Send a verification email

    Args:
        to_email (str): Recipient email address
        verification_link (str): Verification link

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    subject = "Verify Your Email Address - MedicData Analytics"

    text_content = VERIFICATION_EMAIL_TEMPLATE_TEXT.format(
        verification_link=verification_link
    )

    html_content = VERIFICATION_EMAIL_TEMPLATE_HTML.format(
        verification_link=verification_link
    )

    return EmailService.send_email(
        to_email=to_email,
        subject=subject,
        text_content=text_content,
        html_content=html_content
    )

def send_password_reset_email(to_email, reset_link):
    """Send a password reset email

    Args:
        to_email (str): Recipient email address
        reset_link (str): Password reset link

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    subject = "Reset Your Password - MedicData Analytics"

    text_content = PASSWORD_RESET_EMAIL_TEMPLATE_TEXT.format(
        reset_link=reset_link
    )

    html_content = PASSWORD_RESET_EMAIL_TEMPLATE_HTML.format(
        reset_link=reset_link
    )

    return EmailService.send_email(
        to_email=to_email,
        subject=subject,
        text_content=text_content,
        html_content=html_content
    )
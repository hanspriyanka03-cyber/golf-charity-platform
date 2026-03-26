import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.config import settings


class EmailService:
    def _send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send an email via SMTP."""
        if not settings.email_host or not settings.email_user:
            print(f"[EmailService] Email not configured. Would send to {to_email}: {subject}")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.email_user
            msg["To"] = to_email

            part = MIMEText(html_content, "html")
            msg.attach(part)

            with smtplib.SMTP(settings.email_host, settings.email_port) as server:
                server.ehlo()
                server.starttls()
                server.login(settings.email_user, settings.email_password)
                server.sendmail(settings.email_user, to_email, msg.as_string())
            return True
        except Exception as e:
            print(f"[EmailService] Failed to send email: {e}")
            return False

    def send_welcome_email(self, user_email: str, user_name: str) -> bool:
        subject = "Welcome to Golf Charity Platform!"
        html = f"""
        <html><body>
        <h1>Welcome, {user_name}!</h1>
        <p>Your account has been created successfully.</p>
        <p>Start entering your Stableford scores and participate in our monthly draws.</p>
        <p>Good luck and happy giving!</p>
        </body></html>
        """
        return self._send_email(user_email, subject, html)

    def send_subscription_confirmation(
        self, user_email: str, user_name: str, plan_type: str
    ) -> bool:
        subject = "Subscription Confirmed - Golf Charity Platform"
        html = f"""
        <html><body>
        <h1>Subscription Confirmed!</h1>
        <p>Hi {user_name}, your {plan_type} subscription is now active.</p>
        <p>You can now enter your scores and participate in monthly draws.</p>
        </body></html>
        """
        return self._send_email(user_email, subject, html)

    def send_winner_notification(
        self,
        user_email: str,
        user_name: str,
        draw_month: str,
        match_count: int,
        prize_amount: float,
    ) -> bool:
        subject = f"You Won in the {draw_month} Draw!"
        html = f"""
        <html><body>
        <h1>Congratulations, {user_name}!</h1>
        <p>You matched <strong>{match_count} numbers</strong> in the {draw_month} draw!</p>
        <p>Your prize: <strong>£{prize_amount:.2f}</strong></p>
        <p>Please log in to upload your verification proof to claim your prize.</p>
        </body></html>
        """
        return self._send_email(user_email, subject, html)

    def send_verification_approved(
        self, user_email: str, user_name: str, prize_amount: float
    ) -> bool:
        subject = "Prize Verification Approved!"
        html = f"""
        <html><body>
        <h1>Your prize has been verified!</h1>
        <p>Hi {user_name}, your prize of <strong>£{prize_amount:.2f}</strong> has been approved.</p>
        <p>Payment will be processed within 5 business days.</p>
        </body></html>
        """
        return self._send_email(user_email, subject, html)

    def send_draw_published(self, user_email: str, user_name: str, draw_month: str) -> bool:
        subject = f"Results Published: {draw_month} Draw"
        html = f"""
        <html><body>
        <h1>Draw Results Published!</h1>
        <p>Hi {user_name}, the results for the {draw_month} draw are now available.</p>
        <p>Log in to see if you won!</p>
        </body></html>
        """
        return self._send_email(user_email, subject, html)


email_service = EmailService()

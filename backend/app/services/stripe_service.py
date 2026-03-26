import stripe
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.config import settings

stripe.api_key = settings.stripe_secret_key


class StripeService:
    def create_customer(self, email: str, name: str) -> stripe.Customer:
        """Create a new Stripe customer."""
        try:
            customer = stripe.Customer.create(email=email, name=name)
            return customer
        except stripe.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create Stripe customer: {str(e)}",
            )

    def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        plan_type: str,
        success_url: str,
        cancel_url: str,
    ) -> stripe.checkout.Session:
        """Create a Stripe checkout session for subscription."""
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[{"price": price_id, "quantity": 1}],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={"plan_type": plan_type},
                subscription_data={
                    "metadata": {"plan_type": plan_type},
                },
            )
            return session
        except stripe.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create checkout session: {str(e)}",
            )

    def cancel_subscription(self, stripe_subscription_id: str) -> stripe.Subscription:
        """Cancel a Stripe subscription at period end."""
        try:
            subscription = stripe.Subscription.modify(
                stripe_subscription_id,
                cancel_at_period_end=True,
            )
            return subscription
        except stripe.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to cancel subscription: {str(e)}",
            )

    def get_subscription_status(self, stripe_subscription_id: str) -> Dict[str, Any]:
        """Get current subscription status from Stripe."""
        try:
            subscription = stripe.Subscription.retrieve(stripe_subscription_id)
            return {
                "status": subscription.status,
                "current_period_start": subscription.current_period_start,
                "current_period_end": subscription.current_period_end,
                "cancel_at_period_end": subscription.cancel_at_period_end,
            }
        except stripe.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to get subscription status: {str(e)}",
            )

    def handle_webhook(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """
        Verify and parse Stripe webhook event.
        Returns parsed event data.
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")

        return event

    def create_payment_intent(
        self,
        amount: float,
        currency: str = "gbp",
        metadata: Optional[Dict[str, str]] = None,
    ) -> stripe.PaymentIntent:
        """Create a payment intent for prize payouts."""
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to pence/cents
                currency=currency,
                metadata=metadata or {},
                automatic_payment_methods={"enabled": True},
            )
            return intent
        except stripe.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create payment intent: {str(e)}",
            )

    def get_price_details(self, price_id: str) -> Dict[str, Any]:
        """Retrieve price details from Stripe."""
        try:
            price = stripe.Price.retrieve(price_id)
            return {
                "id": price.id,
                "amount": price.unit_amount / 100,
                "currency": price.currency,
                "interval": price.recurring.interval if price.recurring else None,
            }
        except stripe.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to retrieve price: {str(e)}",
            )


stripe_service = StripeService()

from typing import List, Dict, Optional
from supabase import Client


class PrizePoolService:
    MONTHLY_PRICE = 9.99
    YEARLY_PRICE = 99.99
    YEARLY_MONTHLY_EQUIVALENT = 99.99 / 12  # ~8.33/month

    # Revenue split
    PRIZE_POOL_PERCENTAGE = 0.60   # 60% of subscription revenue → prize pool
    CHARITY_MIN_PERCENTAGE = 0.10  # minimum 10% → charity
    PLATFORM_PERCENTAGE = 0.30     # 30% → platform operations

    def calculate_prize_pool(
        self,
        active_subscriber_count: int,
        avg_subscription_amount: Optional[float] = None,
    ) -> Dict:
        """
        Auto-calculate prize pool tiers based on active subscribers.
        Uses average subscription revenue per subscriber.
        """
        if avg_subscription_amount is None:
            avg_subscription_amount = self.MONTHLY_PRICE

        total_revenue = active_subscriber_count * avg_subscription_amount
        prize_pool_total = round(total_revenue * self.PRIZE_POOL_PERCENTAGE, 2)

        five_match_pool = round(prize_pool_total * 0.40, 2)
        four_match_pool = round(prize_pool_total * 0.35, 2)
        three_match_pool = round(prize_pool_total * 0.25, 2)

        charity_contribution = round(total_revenue * self.CHARITY_MIN_PERCENTAGE, 2)
        platform_cut = round(total_revenue * self.PLATFORM_PERCENTAGE, 2)

        return {
            "total_revenue": total_revenue,
            "prize_pool_total": prize_pool_total,
            "five_match_pool": five_match_pool,
            "four_match_pool": four_match_pool,
            "three_match_pool": three_match_pool,
            "charity_contribution_min": charity_contribution,
            "platform_cut": platform_cut,
            "active_subscribers": active_subscriber_count,
        }

    def calculate_charity_contributions(self, subscriptions: List[Dict]) -> Dict[str, float]:
        """
        Calculate total charity contributions per charity based on subscriptions.
        Each subscription has a charity_id and charity_contribution amount.
        Returns {charity_id: total_contribution}
        """
        charity_totals: Dict[str, float] = {}
        for sub in subscriptions:
            charity_id = sub.get("charity_id") or sub.get("user_charity_id")
            contribution = sub.get("charity_contribution", 0.0) or 0.0
            if charity_id:
                charity_totals[charity_id] = round(
                    charity_totals.get(charity_id, 0.0) + float(contribution), 2
                )
        return charity_totals

    def get_subscription_amount(self, plan_type: str) -> float:
        """Return the subscription amount for a given plan type."""
        return self.MONTHLY_PRICE if plan_type == "monthly" else self.YEARLY_PRICE

    def calculate_per_subscription_split(self, plan_type: str, charity_percentage: int) -> Dict:
        """
        Calculate the split for a single subscription.
        charity_percentage is user-chosen (min 10%).
        """
        amount = self.get_subscription_amount(plan_type)
        # For yearly, we distribute monthly equivalent
        monthly_amount = amount if plan_type == "monthly" else amount / 12

        charity_cut = round(monthly_amount * (charity_percentage / 100), 2)
        remaining = monthly_amount - charity_cut
        prize_pool_from_remaining = round(remaining * (self.PRIZE_POOL_PERCENTAGE / (1 - self.CHARITY_MIN_PERCENTAGE)), 2)
        platform_cut = round(remaining - prize_pool_from_remaining, 2)

        return {
            "total": monthly_amount,
            "charity_contribution": charity_cut,
            "prize_pool_contribution": prize_pool_from_remaining,
            "platform_cut": platform_cut,
        }

    def get_active_prize_pool(self, supabase_client: Client) -> float:
        """
        Calculate the current active prize pool from active subscriptions.
        """
        result = (
            supabase_client.table("subscriptions")
            .select("prize_pool_contribution")
            .eq("status", "active")
            .execute()
        )
        if not result.data:
            return 0.0
        total = sum(
            float(row.get("prize_pool_contribution") or 0) for row in result.data
        )
        return round(total, 2)

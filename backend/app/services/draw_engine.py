import random
from typing import List, Dict, Optional
from supabase import Client


class DrawEngine:
    """Core draw engine for the Golf Charity Platform."""

    def generate_random_draw(self) -> List[int]:
        """Generate 5 unique random numbers between 1 and 45."""
        return random.sample(range(1, 46), 5)

    def generate_algorithmic_draw(
        self,
        score_frequencies: Dict[int, int],
        mode: str = "inverse",
    ) -> List[int]:
        """
        Weighted draw based on score frequencies.

        mode='inverse': numbers weighted INVERSELY by frequency — least frequent
        scores have higher chance (harder to win, bigger excitement).
        mode='frequency': numbers weighted BY frequency — most common scores drawn
        (more winners per draw).
        """
        if not score_frequencies:
            return self.generate_random_draw()

        all_numbers = list(range(1, 46))
        max_freq = max(score_frequencies.values()) if score_frequencies else 1

        weights = []
        for n in all_numbers:
            freq = score_frequencies.get(n, 0)
            if mode == "inverse":
                # Inverse weight: numbers with lower frequency get higher weight
                weight = (max_freq - freq) + 1
            else:
                # Direct weight: numbers with higher frequency get higher weight
                weight = freq + 1
            weights.append(weight)

        # Weighted sampling without replacement
        selected = []
        remaining_numbers = all_numbers[:]
        remaining_weights = weights[:]

        for _ in range(5):
            total = sum(remaining_weights)
            r = random.uniform(0, total)
            cumulative = 0
            for i, w in enumerate(remaining_weights):
                cumulative += w
                if r <= cumulative:
                    selected.append(remaining_numbers[i])
                    remaining_numbers.pop(i)
                    remaining_weights.pop(i)
                    break

        return selected

    def check_matches(self, drawn_numbers: List[int], user_scores: List[int]) -> int:
        """Return count of matching numbers between drawn numbers and user's scores."""
        drawn_set = set(drawn_numbers)
        user_set = set(user_scores)
        return len(drawn_set.intersection(user_set))

    def calculate_winners(
        self,
        drawn_numbers: List[int],
        all_user_scores: List[Dict],
    ) -> Dict[str, List[str]]:
        """
        all_user_scores: list of {'user_id': str, 'scores': [int, ...]}

        Returns:
            {
                '5_match': [user_ids],
                '4_match': [user_ids],
                '3_match': [user_ids],
            }
        """
        winners: Dict[str, List[str]] = {
            "5_match": [],
            "4_match": [],
            "3_match": [],
        }

        for entry in all_user_scores:
            user_id = entry["user_id"]
            scores = entry.get("scores", [])
            if not scores:
                continue

            match_count = self.check_matches(drawn_numbers, scores)

            if match_count == 5:
                winners["5_match"].append(user_id)
            elif match_count == 4:
                winners["4_match"].append(user_id)
            elif match_count == 3:
                winners["3_match"].append(user_id)

        return winners

    def calculate_prize_amounts(
        self,
        prize_pool_total: float,
        winners: Dict[str, List[str]],
        jackpot_rollover: float = 0.0,
    ) -> Dict:
        """
        Prize distribution:
        - 5-match pool = 40% of total + jackpot_rollover, split equally among 5-match winners
        - 4-match pool = 35% of total, split equally among 4-match winners
        - 3-match pool = 25% of total, split equally among 3-match winners
        - If no 5-match winners, the 5-match pool rolls over to the next draw's jackpot
        """
        five_match_pool = round(prize_pool_total * 0.40 + jackpot_rollover, 2)
        four_match_pool = round(prize_pool_total * 0.35, 2)
        three_match_pool = round(prize_pool_total * 0.25, 2)

        five_winners = winners.get("5_match", [])
        four_winners = winners.get("4_match", [])
        three_winners = winners.get("3_match", [])

        # If no 5-match winners, rollover the pool
        new_jackpot_rollover = 0.0
        if not five_winners:
            new_jackpot_rollover = five_match_pool
            five_match_pool = 0.0

        prize_per_5 = round(five_match_pool / len(five_winners), 2) if five_winners else 0.0
        prize_per_4 = round(four_match_pool / len(four_winners), 2) if four_winners else 0.0
        prize_per_3 = round(three_match_pool / len(three_winners), 2) if three_winners else 0.0

        return {
            "five_match_pool": five_match_pool,
            "four_match_pool": four_match_pool,
            "three_match_pool": three_match_pool,
            "prize_per_5_winner": prize_per_5,
            "prize_per_4_winner": prize_per_4,
            "prize_per_3_winner": prize_per_3,
            "jackpot_rollover_to_next": new_jackpot_rollover,
            "has_jackpot_winner": bool(five_winners),
        }

    def simulate_draw(
        self,
        draw_type: str,
        score_frequencies: Dict[int, int],
        all_user_scores: Optional[List[Dict]] = None,
        prize_pool_total: float = 0.0,
        jackpot_rollover: float = 0.0,
        algorithmic_mode: str = "inverse",
    ) -> Dict:
        """
        Run a simulation without persisting to database.
        Returns a preview of the draw results.
        """
        if draw_type == "algorithmic":
            drawn_numbers = self.generate_algorithmic_draw(score_frequencies, algorithmic_mode)
        else:
            drawn_numbers = self.generate_random_draw()

        winners = {"5_match": [], "4_match": [], "3_match": []}
        if all_user_scores:
            winners = self.calculate_winners(drawn_numbers, all_user_scores)

        prize_breakdown = self.calculate_prize_amounts(
            prize_pool_total, winners, jackpot_rollover
        )

        return {
            "drawn_numbers": sorted(drawn_numbers),
            "winners": winners,
            "prize_breakdown": prize_breakdown,
            "total_participants": len(all_user_scores) if all_user_scores else 0,
            "total_winners": (
                len(winners["5_match"])
                + len(winners["4_match"])
                + len(winners["3_match"])
            ),
        }

    def get_score_frequencies(self, supabase_client: Client) -> Dict[int, int]:
        """
        Aggregate all user scores across the platform to build a frequency map.
        Returns {score_value: count}
        """
        result = supabase_client.table("golf_scores").select("score").execute()
        frequencies: Dict[int, int] = {}

        if result.data:
            for row in result.data:
                score = row["score"]
                frequencies[score] = frequencies.get(score, 0) + 1

        return frequencies

    def get_all_user_scores(self, supabase_client: Client) -> List[Dict]:
        """
        Get all active subscribers' scores grouped by user.
        Only includes users with active subscriptions.
        """
        # Fetch active subscriber IDs
        subs = (
            supabase_client.table("subscriptions")
            .select("user_id")
            .eq("status", "active")
            .execute()
        )
        if not subs.data:
            return []

        active_user_ids = [s["user_id"] for s in subs.data]

        # Fetch scores for those users
        scores_result = (
            supabase_client.table("golf_scores")
            .select("user_id, score")
            .in_("user_id", active_user_ids)
            .execute()
        )

        if not scores_result.data:
            return []

        # Group by user
        user_scores: Dict[str, List[int]] = {}
        for row in scores_result.data:
            uid = row["user_id"]
            if uid not in user_scores:
                user_scores[uid] = []
            user_scores[uid].append(row["score"])

        return [{"user_id": uid, "scores": scores} for uid, scores in user_scores.items()]

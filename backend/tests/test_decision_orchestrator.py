import unittest

from app.services import decision_orchestrator as orch


class DecisionOrchestratorTests(unittest.TestCase):
    def test_rule_score_review_not_needed(self):
        self.assertEqual(orch._rule_score({"review_needed": False}), 1.0)

    def test_rule_score_better_image(self):
        score = orch._rule_score({"review_needed": True, "next_action": "Request better image"})
        self.assertAlmostEqual(score, 0.45)

    def test_llm_score_mapping(self):
        self.assertEqual(orch._llm_score({"verdict": "agree"}), 1.0)
        self.assertEqual(orch._llm_score({"verdict": "disagree"}), 0.0)
        self.assertEqual(orch._llm_score({"verdict": "uncertain"}), 0.5)

    def test_fused_status_thresholds(self):
        self.assertEqual(orch._fused_status(0.80), "Success")
        self.assertEqual(orch._fused_status(0.60), "Uncertain")
        self.assertEqual(orch._fused_status(0.20), "Failure")

    def test_workflow_decision_accept(self):
        decision = orch._workflow_decision(
            fused_score=0.92,
            model_confidence=0.91,
            margin=0.40,
            entropy=0.10,
            llm_verdict="agree",
        )
        self.assertEqual(decision, "ACCEPTED")

    def test_workflow_decision_review_on_disagree(self):
        decision = orch._workflow_decision(
            fused_score=0.90,
            model_confidence=0.90,
            margin=0.40,
            entropy=0.10,
            llm_verdict="disagree",
        )
        self.assertEqual(decision, "REVIEW")

    def test_workflow_decision_reject_low_confidence(self):
        decision = orch._workflow_decision(
            fused_score=0.50,
            model_confidence=0.20,
            margin=0.20,
            entropy=0.20,
            llm_verdict="uncertain",
        )
        self.assertEqual(decision, "REJECTED")


if __name__ == "__main__":
    unittest.main()

/* Display vocabulary only. The host supplies already authorized final outcome facts. */
(() => {
	"use strict";
	const definition = {"version":"sgg.result-language/1","displayOnly":true,"authority":"docs/design/RESULT-LANGUAGE.md","states":{"won":{"title":"本场获胜","family":"competition","requires":"authorized whole-match gameplay victory"},"not_won":{"title":"本场未获胜","family":"competition","requires":"authorized whole-match nonwinner in a declared competition"},"draw":{"title":"本场平局","family":"competition","requires":"explicit final draw rule; tied winners are not automatically a draw","reserved":true},"goal_met":{"title":"目标达成","family":"goal","requires":"authorized complete-match goal attainment"},"goal_unmet":{"title":"未达目标","family":"goal","requires":"authorized complete-match goal non-attainment"},"completed":{"title":"本场完成","family":"completion","requires":"settled game with no applicable win/loss/goal classification"}},"bindings":{"trust@1.0.0":{"meaning":"competitive","allowed":["won","not_won"],"status":"installed","gameDocId":"066","source":"docs/gameplay/games/066-trust.md","rule":"G066-RESULT","tie":"all exact maximum scorers win; do not infer sole winner or tie count","rankMeaningful":true},"network-pd@1.0.0":{"meaning":"competitive","allowed":["won","not_won"],"status":"installed","gameDocId":"042","source":"docs/gameplay/games/042-network-pd.md","rule":"G042-RESULT","tie":"all exact maximum scorers win; do not infer sole winner or tie count","rankMeaningful":true},"ultimatum@1.0.0":{"meaning":"competitive","allowed":["won","not_won"],"status":"installed","gameDocId":"076","source":"docs/gameplay/games/076-ultimatum.md","rule":"G076-RESULT","tie":"all exact maximum scorers win; do not infer sole winner or tie count","rankMeaningful":true},"candidate:036":{"meaning":"shared-score","allowed":["completed"],"status":"candidate-display-only","gameDocId":"036","source":"docs/gameplay/candidates/036-structured-collaborative-writing.md","rule":"final shared weighted score; administrative rank1 is not a success threshold","userDecision":"2026-10-21 A: preserve rules; status primary and factual explanation secondary","rankMeaningful":false},"candidate:021":{"meaning":"goal","allowed":["goal_met","goal_unmet"],"status":"candidate-display-only","gameDocId":"021","source":"docs/gameplay/candidates/021-information-transmission-on-a-fixed-network.md","rule":"correct answer within the declared horizon (including its final permitted round); administrative winners do not indicate task success","rankMeaningful":false},"unranked":{"meaning":"completion","allowed":["completed"],"status":"safe-display-fallback","source":"docs/gameplay/CONTRACT.md","rule":"no default score-based winner","rankMeaningful":false},"best-shot@1.0.0":{"meaning":"completion","allowed":["completed"],"status":"installed","gameDocId":"061","source":"docs/gameplay/games/061-best-shot.md","rule":"G061-RESULT","rankMeaningful":false},"stag-hunt@1.0.0":{"meaning":"competitive","allowed":["won","not_won"],"status":"installed","gameDocId":"003","source":"docs/gameplay/games/003-stag-hunt.md","rule":"G003-RESULT","tie":"all exact maximum scorers win; do not infer sole winner or tie count","rankMeaningful":true},"dictator@1.0.0":{"meaning":"competitive","allowed":["won","not_won"],"status":"installed","gameDocId":"077","source":"docs/gameplay/games/077-dictator.md","rule":"G077-END","tie":"all exact maximum scorers win; do not infer sole winner or tie count","rankMeaningful":true},"threshold-public-good@1.0.0":{"meaning":"completion","allowed":["completed"],"status":"installed","gameDocId":"051","source":"docs/gameplay/games/051-threshold-public-good.md","rule":"G051-RESULT","rankMeaningful":false},"hidden-profile@1.0.0":{"meaning":"goal","allowed":["goal_met","goal_unmet"],"status":"installed","gameDocId":"020","source":"docs/gameplay/games/020-hidden-profile.md","rule":"G020-RESULT","rankMeaningful":false},"double-auction@1.0.0":{"meaning":"completion","allowed":["completed"],"status":"installed","gameDocId":"087","source":"docs/gameplay/games/087-double-auction-order-book.md","rule":"G087-RESULT","rankMeaningful":false},"cooperative-search@1.0.0":{"meaning":"goal","allowed":["goal_met","goal_unmet"],"status":"installed","gameDocId":"034","source":"docs/gameplay/games/034-cooperative-search.md","rule":"G034-RESULT","rankMeaningful":false},"trust@2.0.0":{"meaning":"competitive","allowed":["won","not_won"],"status":"installed","gameDocId":"066","source":"docs/gameplay/games/066-trust.md","rule":"G066-RESULT","tie":"all exact maximum scorers win; do not infer sole winner or tie count","rankMeaningful":true},"network-pd@2.0.0":{"meaning":"competitive","allowed":["won","not_won"],"status":"installed","gameDocId":"042","source":"docs/gameplay/games/042-network-pd.md","rule":"G042-RESULT","tie":"all exact maximum scorers win; do not infer sole winner or tie count","rankMeaningful":true},"ultimatum@2.0.0":{"meaning":"competitive","allowed":["won","not_won"],"status":"installed","gameDocId":"076","source":"docs/gameplay/games/076-ultimatum.md","rule":"G076-RESULT","tie":"all exact maximum scorers win; do not infer sole winner or tie count","rankMeaningful":true},"best-shot@2.0.0":{"meaning":"completion","allowed":["completed"],"status":"installed","gameDocId":"061","source":"docs/gameplay/games/061-best-shot.md","rule":"G061-RESULT","rankMeaningful":false},"stag-hunt@2.0.0":{"meaning":"competitive","allowed":["won","not_won"],"status":"installed","gameDocId":"003","source":"docs/gameplay/games/003-stag-hunt.md","rule":"G003-RESULT","tie":"all exact maximum scorers win; do not infer sole winner or tie count","rankMeaningful":true},"dictator@2.0.0":{"meaning":"competitive","allowed":["won","not_won"],"status":"installed","gameDocId":"077","source":"docs/gameplay/games/077-dictator.md","rule":"G077-END","tie":"all exact maximum scorers win; do not infer sole winner or tie count","rankMeaningful":true},"threshold-public-good@2.0.0":{"meaning":"completion","allowed":["completed"],"status":"installed","gameDocId":"051","source":"docs/gameplay/games/051-threshold-public-good.md","rule":"G051-RESULT","rankMeaningful":false},"hidden-profile@2.0.0":{"meaning":"goal","allowed":["goal_met","goal_unmet"],"status":"installed","gameDocId":"020","source":"docs/gameplay/games/020-hidden-profile.md","rule":"G020-RESULT","rankMeaningful":false},"double-auction@2.0.0":{"meaning":"completion","allowed":["completed"],"status":"installed","gameDocId":"087","source":"docs/gameplay/games/087-double-auction-order-book.md","rule":"G087-RESULT","rankMeaningful":false},"cooperative-search@2.0.0":{"meaning":"goal","allowed":["goal_met","goal_unmet"],"status":"installed","gameDocId":"034","source":"docs/gameplay/games/034-cooperative-search.md","rule":"G034-RESULT","rankMeaningful":false}},"support":{"selfScore":["你累计获得",{"field":"score","unit":"点"},"。"]},"invariants":{"maximumPrimaryStatus":1,"supportOptional":true,"deriveGoalFromScoreSign":false,"deriveVictoryFromRankOne":false,"deriveDrawFromSharedWinners":false,"localOutcomeIsMatchVictory":false,"partialProgressIsPartialSuccess":false,"lifecycleFailuresAreGameLosses":false},"unregisteredOutcome":"reject; define its meaning and source before extending the vocabulary"};
	function resolve(outcome) {
		const binding = definition.bindings[outcome?.binding];
		const state = definition.states[outcome?.kind];
		if (!binding || !state || !binding.allowed.includes(outcome.kind))
			throw Error("Outcome is not declared by this result binding");
		return {
			kind: outcome.kind,
			primary: SGGI18n.systemCopy(state.title),
			rankAllowed: binding.rankMeaningful === true,
		};
	}
	function fromSelfResult(bindingId, result) {
		if (!result || result.score === undefined)
			throw Error("An authorized settled SelfResult is required");
		const binding = definition.bindings[bindingId];
		if (
			binding?.meaning === "goal" &&
			(result.goal?.kind !== "goal_result_v1" || typeof result.goal.achieved !== "boolean")
		)
			throw Error("An authorized goal result is required");
		if (binding?.meaning === "competitive" && typeof result.winner !== "boolean")
			throw Error("An authorized winner is required");
		const competitive = binding?.meaning === "competitive" && typeof result?.winner === "boolean";
		const message = resolve(
			binding?.meaning === "goal"
				? { binding: bindingId, kind: result.goal.achieved ? "goal_met" : "goal_unmet" }
				: competitive
					? { binding: bindingId, kind: result.winner ? "won" : "not_won" }
					: { binding: "unranked", kind: "completed" },
		);
		message.rankAllowed = binding?.rankMeaningful === true;
		if (result?.score !== undefined)
			message.support = definition.support.selfScore.map((part, index, parts) =>
				typeof part === "string"
					? SGGI18n.systemCopy(part) +
						(SGGI18n.locale === "en" && parts[index + 1]?.field ? " " : "")
					: { number: result[part.field], unit: SGGI18n.systemCopy(part.unit) },
			);
		return message;
	}
	window.SGGResultLanguage = Object.freeze({ definition, resolve, fromSelfResult });
})();

/* Display-only language. No phase, quota, identity or permission inference. */
(() => {
	"use strict";
	const positive = (n) => Number.isSafeInteger(Number(n)) && Number(n) > 0;
	const apps = Object.freeze(
		Object.defineProperties(
			{},
			Object.fromEntries(
				["profile", "forum", "dm", "rating", "game", "questionnaire"].map((id) => [
					id,
					{ enumerable: true, get: () => SGGI18n.t("asset." + id) },
				]),
			),
		),
	);
	function quota(count) {
		return Number.isSafeInteger(count) && count >= 0
			? SGGI18n.t("asset.quota", { count })
			: SGGI18n.t("asset.quotaUnavailable");
	}
	function stamp({ round, step, steps } = {}) {
		const parts = [];
		if (positive(round)) parts.push(SGGI18n.t("asset.roundStamp", { round }));
		if (positive(step))
			parts.push(
				positive(steps) && Number(step) <= Number(steps)
					? SGGI18n.t("asset.socialStamp", { step, steps })
					: SGGI18n.t("asset.socialStep", { step }),
			);
		return parts.join(" · ");
	}
	function identities(context) {
		return Object.fromEntries(
			(context?.people || []).map((p) => [
				p.id,
				{ name: p.name, avatar: context.profiles?.[p.id]?.avatar || "default" },
			]),
		);
	}
	window.SGGProductLanguage = Object.freeze({ apps, quota, stamp, identities });
})();

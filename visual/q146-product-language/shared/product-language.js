/* Display-only language. No phase, quota, identity or permission inference. */
(() => {
	"use strict";
	const positive = (n) => Number.isSafeInteger(Number(n)) && Number(n) > 0;
	const apps = Object.freeze({
		profile: "资料",
		forum: "论坛",
		dm: "私信",
		rating: "评分",
		game: "游戏",
		questionnaire: "问卷",
	});
	function quota(count) {
		return Number.isSafeInteger(count) && count >= 0 ? "本步剩余 " + count + " 次" : "次数暂不可用";
	}
	function stamp({ round, step, steps } = {}) {
		const parts = [];
		if (positive(round)) parts.push("第 " + round + " 轮");
		if (positive(step))
			parts.push(
				positive(steps) && Number(step) <= Number(steps)
					? "社交 " + step + "/" + steps + " 步"
					: "社交第 " + step + " 步",
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

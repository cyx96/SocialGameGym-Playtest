/* A6 identity presentation proposal. Player selection is stable, independent of game palette. */
(() => {
	const people = {
		self: { id: "self", name: "玩家 01", family: "neutral" },
		lin: { id: "lin", name: "林舟", family: "trust" },
		xu: { id: "xu", name: "许知", family: "cooperation" },
		zhou: { id: "zhou", name: "周遥", family: "fairness" },
	};
	if (window.SessionApp) {
		for (const key of Object.keys(people)) delete people[key];
		for (const p of SessionApp.context.people)
			people[p.id] = {
				id: p.id,
				name: p.name,
				family: SessionApp.context.profiles[p.id]?.avatar || "default",
			};
	}
	function escape(v) {
		return String(v).replace(
			/[&<>"']/g,
			(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
		);
	}
	function person(value) {
		if (window.SessionApp) {
			const id = value && typeof value === "object" ? value.id : value;
			return (
				people[id] || { id: "unknown", name: SGGI18n.t("asset.unknownPerson"), family: "neutral" }
			);
		}
		if (value && typeof value === "object")
			return {
				id: value.id || "unknown",
				name: value.name || SGGI18n.t("asset.unknownPerson"),
				family: value.family || "neutral",
			};
		return (
			people[value] ||
			Object.values(people).find((p) => p.name === value) ||
			(value === "你"
				? people.self
				: {
						id: "unknown",
						name: String(value || SGGI18n.t("asset.unknownPerson")),
						family: "neutral",
					})
		);
	}
	function avatar(value, size = "row", options = {}) {
		const p = person(value);
		return SGGAvatar.html({
			preset: options.family || p.family,
			size,
			src: options.src,
			person: p.id,
		});
	}
	function group(size = "row") {
		return SGGAvatar.html({ preset: "group", size });
	}
	window.SGGIdentity = { people, person, avatar, group, escape };
})();

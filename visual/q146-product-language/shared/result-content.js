/* One result-content renderer for programmed pages and the formal React binding.
   Content is already authorized. This renderer never calculates outcomes or rankings. */
(() => {
	"use strict";
	const node = (tag, cls, text) => {
		const el = document.createElement(tag);
		if (cls) el.className = cls;
		if (text !== undefined) el.textContent = String(text);
		return el;
	};
	function render({ metric, facts = [], artifact } = {}) {
		const root = node("div", "sg-result-content"),
			rank = facts.find((f) => f.role === "rank"),
			details = facts.filter((f) => f.role !== "rank");
		if (artifact) {
			const paper = node("section", "sg-result-artifact"),
				label = node("h2", "sg-result-artifact-title", artifact.label),
				body = node("div", "sg-result-document");
			for (const line of artifact.lines) body.append(node("p", "", line));
			paper.append(label, body);
			root.append(paper);
		}
		if (rank) details.unshift(rank);
		if (details.length || metric) {
			const list = node("dl", "sg-result-facts");
			if (metric) {
				const row = node("div", "sg-result-fact sg-result-secondary-metric"),
					value = node("dd", "");
				value.append(NumberUI.element(metric.value, { role: "data", unit: metric.unit }));
				row.append(node("dt", "", metric.label), value);
				list.append(row);
			}
			for (const fact of details) {
				const row = node("div", "sg-result-fact");
				if (fact.role) row.dataset.resultFact = fact.role;
				row.append(node("dt", "", fact.label), node("dd", "", fact.value));
				list.append(row);
			}
			root.append(list);
		}
		return root;
	}
	window.SGGResultContent = Object.freeze({ version: "sgg.result-content/1", render });
})();

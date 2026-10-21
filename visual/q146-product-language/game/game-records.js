(() => {
	"use strict";
	const state = new WeakMap();
	const e = (tag, cls, text) => {
		const n = document.createElement(tag);
		if (cls) n.className = cls;
		if (text !== undefined) n.textContent = String(text);
		return n;
	};
	function chevron() {
		const n = e("span", "record-chevron");
		n.setAttribute("aria-hidden", "true");
		n.append(SGGIcons.create("chevron-down"));
		return n;
	}
	function facts(rows) {
		const dl = e("dl", "record-facts");
		for (const f of rows) {
			const row = e("div", "record-fact");
			const value = e("dd", "");
			if (f.numeric)
				value.append(NumberUI.element(f.numeric, { unit: f.unit || "", signed: !!f.signed }));
			else if (f.quantities) {
				value.classList.add("number-pair");
				f.quantities.forEach((q, i) => {
					if (i) value.append(e("span", "number-pair-separator", "/"));
					value.append(NumberUI.element(q.value, { unit: q.unit || "", signed: !!q.signed }));
				});
			} else value.textContent = f.value;
			row.append(e("dt", "", f.label), value);
			dl.append(row);
		}
		return dl;
	}
	function render({ view, identities, viewerId }) {
		const root = e("div", "game-record-list");
		root.setAttribute("aria-label", "游戏记录");
		if (!view) {
			root.append(e("p", "record-empty", "游戏记录暂时无法读取。"));
			return root;
		}
		if (!view.groups.length) {
			root.append(e("p", "record-empty", "还没有游戏记录。"));
			return root;
		}
		const memory = state.get(view) || {
			open: new Set([view.groups[0].id]),
			snapshots: new Set(),
			scroll: 0,
		};
		state.set(view, memory);
		root.addEventListener("scroll", () => (memory.scroll = root.scrollTop), { passive: true });
		if (view.groups.length > 8) {
			const label = e("label", "record-jump", "查看轮次"),
				select = e("select");
			select.setAttribute("aria-label", "查看轮次");
			for (const g of view.groups) {
				const option = e("option", "", g.title);
				option.value = g.id;
				select.append(option);
			}
			select.addEventListener("change", () => {
				const target = root.querySelector('[data-round="' + CSS.escape(select.value) + '"]');
				target.open = true;
				target.scrollIntoView({ block: "start", behavior: "instant" });
			});
			label.append(select);
			root.append(label);
		}

		const renderers = {
			Interaction(event, copy, row) {
				const image = SGGAvatar.node({
					preset: identities[event.actorId]?.avatar || "default",
					size: "reply",
					person: event.actorId,
				});
				image.classList.add("record-avatar");
				row.prepend(image);
				copy.append(
					SGGInlinePerson.render(
						e("p", "record-event-title"),
						[{ personId: event.actorId }, "向 ", { personId: event.targetId }, event.verb],
						{ identities, viewerId },
					),
				);
				const amount = e("p", "record-event-amount");
				amount.append(NumberUI.element(event.amount, { role: "amount", unit: event.unit }));
				if (NumberUI.format(event.amount).text.length > 11) row.classList.add("record-event-wide");
				row.append(amount);
			},
			Moment(event, copy, row) {
				row.prepend(e("span", "record-marker"));
				copy.append(e("p", "record-event-title", event.title));
			},
			Revision(event, copy, row) {
				row.prepend(e("span", "record-marker"));
				copy.append(e("p", "record-event-title", event.title));
				const diff = e("div", "record-diff");
				if (event.before !== null) {
					const before = e("span", "record-before");
					before.append(e("span", "sr-only", "原内容："), e("s", "", event.before));
					diff.append(before);
				}
				if (event.before !== null && event.after !== null) {
					const arrow = e("span", "record-diff-arrow", "→");
					arrow.setAttribute("aria-hidden", "true");
					diff.append(arrow);
				}
				if (event.after !== null) {
					const after = e("span", "record-after");
					after.append(e("span", "sr-only", "新内容："), e("span", "", event.after));
					diff.append(after);
				}
				copy.append(diff, e("p", "record-version", "版本 " + event.version));
			},
			PhaseResult(event, copy, row) {
				row.prepend(e("span", "record-marker"));
				copy.append(e("p", "record-phase", event.phase), e("p", "record-event-title", event.title));
			},
		};
		for (const group of view.groups) {
			const details = e("details", "record-group");
			details.dataset.round = group.id;
			details.open = memory.open.has(group.id);
			const summary = e("summary", "record-round"),
				heading = e("span", "record-round-heading");
			heading.append(
				e("span", "record-round-title", group.title),
				e("span", "record-recap", group.recap),
			);
			summary.append(heading);
			if (group.metric) {
				const metric = e("span", "record-round-metric");
				metric.append(
					e("span", "record-metric-label", group.metric.label),
					NumberUI.element(group.metric.value, {
						role: "amount",
						unit: group.metric.unit,
						signed: !!group.metric.signed,
					}),
				);
				if (NumberUI.format(group.metric.value).text.length > 11)
					summary.classList.add("record-round-wide");
				summary.append(metric);
			} else if (group.status === "in-progress")
				summary.append(e("span", "record-progress", "进行中"));
			summary.append(chevron());
			details.append(summary);
			const body = e("div", "record-body"),
				events = e("ol", "record-events");
			events.setAttribute("aria-label", group.title + "的经过");
			for (const event of group.events) {
				const row = e("li", "record-event record-" + event.type),
					copy = e("div", "record-event-copy");
				row.append(copy);
				renderers[event.type](event, copy, row);
				if (event.detail) copy.append(e("p", "record-event-detail", event.detail));
				if (event.facts) copy.append(facts(event.facts));
				events.append(row);
			}
			if (group.events.length) body.append(events);
			else body.append(e("p", "record-empty", "本轮还没有已确认的动作。"));
			if (group.snapshot) {
				const snapshot = e("details", "record-snapshot");
				snapshot.open = memory.snapshots.has(group.id);
				const trigger = e("summary", "record-snapshot-trigger");
				trigger.append(e("span", "", group.snapshot.label), chevron());
				snapshot.append(trigger);
				const lines = e("ol", "record-document");
				for (const line of group.snapshot.lines) lines.append(e("li", "", line));
				snapshot.append(lines);
				snapshot.addEventListener("toggle", () => {
					if (snapshot.open) memory.snapshots.add(group.id);
					else memory.snapshots.delete(group.id);
				});
				body.append(snapshot);
			}
			details.append(body);
			details.addEventListener("toggle", () => {
				if (details.open) memory.open.add(group.id);
				else memory.open.delete(group.id);
			});
			root.append(details);
		}
		window.SGGControls?.enhance(root);
		requestAnimationFrame(() => (root.scrollTop = memory.scroll));
		return root;
	}
	window.GameRecords = { render };
})();

/* Display assembly only. The caller supplies authorized content and handles actual actions. */
(() => {
	"use strict";
	const el = (tag, cls, text) => {
		const n = document.createElement(tag);
		if (cls) n.className = cls;
		if (text != null) n.textContent = String(text);
		return n;
	};
	function mount(spec, { host = document.body, onAction, onPerson } = {}) {
		if (spec.purpose === "result") {
			const message = SGGResultLanguage.resolve(spec.outcome);
			if (!message.rankAllowed && spec.facts?.some((f) => f.role === "rank"))
				throw Error("Result binding does not permit placement");
			if (spec.title !== undefined && spec.title !== message.primary)
				throw Error("Result title cannot override shared status");
			spec = { ...spec, title: message.primary };
		}
		const requestedTheme = new URLSearchParams(location.search).get("theme");
		SGGThemes.apply(SGGThemes.get(requestedTheme) ? requestedTheme : spec.theme);
		const context = spec.context || {},
			actions = [],
			intro = SGGTaskContext.message({ primary: spec.title }),
			title = intro.querySelector("[data-task-primary]"),
			content = el("section", "content"),
			footer = el("footer", "action-footer"),
			values = {},
			required = [],
			definitions = [],
			hasFields = Boolean(spec.fields?.length || spec.sections?.some((s) => s.fields?.length)),
			contextTask = hasFields || spec.recipe === "decision" || spec.purpose === "result";
		if (spec.subject) {
			const fragment = document.createDocumentFragment();
			fragment.append(
				document.createTextNode(spec.title),
				SGGInlinePerson.person(spec.subject.personId, spec.identities || {}, {
					viewerId: spec.viewerId,
				}),
			);
			title.replaceChildren(fragment);
		}
		if (spec.description) {
			const p = el("p", "description sg-task-support");
			if (Array.isArray(spec.description))
				SGGTaskContext.renderText(p, spec.description, {
					identities: spec.identities || {},
					viewerId: spec.viewerId,
				});
			else p.textContent = spec.description;
			intro.querySelector(".sg-task-copy").append(p);
		}
		const frame = SGGLayout.frame({
			gameName: context.gameName || "",
			round: context.roundLabel,
			phase: context.phaseName ? { name: context.phaseName, step: context.stepLabel } : null,
			width: spec.recipe === "summary" && spec.purpose !== "result" ? "focus" : "work",
			scroll: contextTask ? "workspace" : "flow",
			space: spec.recipe,
		});
		frame.mount(host);
		if (spec.purpose === "terminal") frame.main.classList.add("sg-terminal-page");
		if (spec.recipe === "summary" && !contextTask) frame.main.classList.add("sg-state-page");
		if (contextTask) frame.main.classList.add("sg-task-page", "sg-inset-pane");
		if (spec.navigation) {
			const bar = el("nav", "");
			if (spec.navigation.back) {
				const back = SGGButtons.create({
					role: "icon",
					ariaLabel: "返回上一级",
					icon: SGGIcons.create("back"),
				});
				back.onclick = () =>
					host.dispatchEvent(
						new CustomEvent("sgg:navigate", { detail: { direction: "back" }, bubbles: true }),
					);
				bar.append(back);
			}
			if (contextTask) {
				const group = el("div", "sg-task-toolbar-label");
				group.append(el("h2", "", spec.navigation.title || ""));
				bar.append(group);
			} else bar.append(el("h2", "", spec.navigation.title || ""));
			SGGLayout.toolbar(bar);
			frame.main.append(bar);
		}
		const fields = el("div", "assembled-fields");
		content.append(fields);
		function valid() {
			return (
				required.every(
					(key) =>
						values[key] !== null && values[key] !== undefined && String(values[key]).trim() !== "",
				) &&
				definitions.every(
					(f) =>
						f.type !== "number" ||
						(values[f.key] === null && !f.required) ||
						(Number.isInteger(values[f.key]) && values[f.key] >= f.min && values[f.key] <= f.max),
				)
			);
		}
		function sync() {
			for (const [definition, button] of actions)
				button.disabled = Boolean(
					spec.readonly || definition.disabled || (definition.role === "primary" && !valid()),
				);
		}
		function field(def, parent) {
			definitions.push(def);
			const disabled = Boolean(spec.readonly || def.disabled),
				options = { ...def, disabled };
			values[def.key] = def.value ?? null;
			if (def.required) required.push(def.key);
			const change = (value) => {
				values[def.key] = value;
				sync();
				host.dispatchEvent(
					new CustomEvent("sgg:change", { detail: { key: def.key, value }, bubbles: true }),
				);
			};
			const node = SGGControls[def.type](options, values[def.key], change);
			if (spec.purpose === "questionnaire") {
				const legend = node.querySelector("legend"),
					number = el("span", "sg-question-index", definitions.length),
					label = el("span", "", def.label);
				number.setAttribute("aria-hidden", "true");
				legend?.replaceChildren(number, label);
			}
			if (spec.recipe === "decision" && spec.fields?.length === 1 && def.label === spec.title)
				node.querySelector("legend,label")?.classList.add("sr-only");
			node.dataset.control = def.type;
			if (def.type === "number") node.classList.add("assembled-number");
			parent.append(node);
		}
		for (const definition of spec.fields || []) field(definition, fields);
		for (const section of spec.sections || []) {
			if (!section.fields?.length) continue;
			const details = el("details", "assembled-section");
			details.open = Boolean(section.open);
			const summary = el("summary", "", section.label),
				chevron = SGGIcons.create("chevron-down");
			chevron.classList.add("sg-disclosure-chevron");
			summary.append(chevron);
			details.append(summary);
			const group = el("div", "assembled-fields");
			for (const definition of section.fields) field(definition, group);
			details.append(group);
			fields.append(details);
		}
		if (spec.purpose === "result")
			content.append(
				SGGResultContent.render({
					metric: spec.metrics?.[0],
					facts: spec.facts,
					artifact: spec.artifact,
				}),
			);
		else
			for (const metric of spec.metrics || []) {
				const group = el("section", "sg-summary-metric");
				group.append(el("span", "", metric.label));
				const value = el("strong", "metric-value sg-number-text");
				value.append(NumberUI.element(metric.value, { role: "primary", unit: metric.unit }));
				group.append(value);
				content.append(group);
			}
		if (spec.recordView) {
			content.append(
				GameRecords.render({
					view: spec.recordView,
					identities: spec.identities || {},
					viewerId: spec.viewerId,
				}),
			);
		}
		for (const definition of spec.actions || []) {
			const button = SGGButtons.create({
				role: definition.role,
				label: definition.label,
				ariaLabel: definition.label,
				icon: definition.icon ? SGGIcons.create(definition.icon) : undefined,
			});
			actions.push([definition, button]);
			button.onclick = () => {
				if (button.disabled) return;
				const detail = { id: definition.id, values: { ...values } };
				if (onAction) onAction(detail);
				else host.dispatchEvent(new CustomEvent("sgg:action", { detail, bubbles: true }));
			};
			footer.append(button);
		}
		const scene = SGGLayout.task({
			context: intro,
			interaction: content,
			actions: footer.children.length ? footer : null,
			recipe: spec.recipe,
		});
		scene.dataset.assembly = spec.purpose || "task";
		if (spec.recipe === "summary" && !contextTask)
			scene.classList.add("sg-state-layout", "sg-summary-page");
		if (spec.purpose === "result") scene.dataset.scene = "result";
		if (onPerson)
			scene.addEventListener("sgg:profile-request", (event) => {
				event.stopPropagation();
				onPerson(event.detail);
			});
		if (contextTask) {
			scene.classList.add("sg-context-task");
			const bar = frame.main.querySelector(".sg-toolbar");
			requestAnimationFrame(() =>
				SGGTaskContext.connect({ pane: frame.main, toolbar: bar, source: scene, primary: title }),
			);
		}
		if (spec.purpose === "questionnaire") {
			scene.classList.add("sg-questionnaire");
			fields.classList.add("sg-questionnaire-questions");
			content.classList.add("sg-questionnaire-form");
			footer.classList.add("sg-questionnaire-actions");
		}
		frame.main.append(scene);
		SGGButtons.enhance();
		sync();
		return Object.freeze({ values: () => ({ ...values }), frame });
	}
	window.SGGAssemble = Object.freeze({ mount, version: "sgg.ui-page/1" });
})();

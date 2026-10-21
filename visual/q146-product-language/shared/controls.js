/* Presentational DOM assets. Callers own validation, permissions, storage and acceptance. */
(() => {
	"use strict";
	const numberStates = new WeakMap();
	const el = (tag, cls, text) => {
		const n = document.createElement(tag);
		if (cls) n.className = cls;
		if (text != null) n.textContent = String(text);
		return n;
	};
	function choice(field, selected, onChange) {
		const box = el("fieldset", "field sg-field");
		box.append(el("legend", "", field.label));
		const options = el("div", "choice-options sg-choice");
		if (field.help) {
			const help = el("p", "field-help", field.help);
			help.id = "help-" + field.key;
			box.append(help);
			box.setAttribute("aria-describedby", help.id);
		}
		if (field.options.length <= 5 && field.options.every((o) => o.label.length <= 3)) {
			options.classList.add("short-options");
			options.style.display = "grid";
			options.style.gridTemplateColumns = field.options
				.map((o) => "minmax(0," + (o.label.length > 1 ? 1.6 : 1) + "fr)")
				.join(" ");
		}
		for (const option of field.options) {
			const label = el("label", "option"),
				input = el("input"),
				text = el("span", "option-label", option.label);
			input.type = "radio";
			input.name = field.key;
			input.value = option.value;
			input.checked = selected === option.value;
			input.disabled = Boolean(field.disabled || option.disabled);
			input.addEventListener("change", () => onChange(option.value));
			if (option.numeric) text.classList.add("option-numeric");
			label.append(input, text);
			options.append(label);
		}
		box.append(options);
		return box;
	}
	function number(field, selected, onChange) {
		const box = el("div", "field sg-field"),
			label = el("label", "control-label", field.label),
			id = "input-" + field.key,
			line = el("div", "number-control sg-number"),
			input = el("input", "number-input");
		label.htmlFor = id;
		input.id = id;
		input.type = field.raw ? "text" : "number";
		if (field.raw) {
			input.setAttribute("role", "spinbutton");
			input.setAttribute("aria-valuemin", field.min);
			if (field.max != null) input.setAttribute("aria-valuemax", field.max);
		}
		input.min = field.min;
		if (field.max != null) input.max = field.max;
		input.step = field.raw ? (field.step ?? 1) : 1;
		input.inputMode = field.raw && !Number.isInteger(field.step ?? 1) ? "decimal" : "numeric";
		input.value = selected ?? "";
		input.placeholder = field.raw ? "输入数值" : "请选择";
		input.disabled = Boolean(field.disabled);
		const stepButton = (delta, name) => {
			const b = el("button", "stepper");
			b.type = "button";
			b.setAttribute("aria-label", name + field.label);
			b.dataset.sgButton = "";
			b.dataset.sgRole = "quiet";
			b.append(SGGIcons.create(delta > 0 ? "plus" : "minus"));
			b.addEventListener("click", () => {
				if (field.raw) {
					if (b.disabled) return;
					const next = field.stepValue?.(input.value, delta);
					if (next === undefined) return;
					input.value = String(next);
					onChange(input.value);
					sync();
					return;
				}
				const value =
					input.value === ""
						? delta < 0
							? field.min
							: Math.min(field.max ?? Infinity, field.min + 1)
						: Math.min(field.max ?? Infinity, Math.max(field.min, Number(input.value) + delta));
				input.value = value;
				onChange(value);
				sync();
			});
			return b;
		};
		const minus = stepButton(-1, "减少"),
			plus = stepButton(1, "增加"),
			error = field.raw
				? el("p", "sg-control-error", field.invalidMessage || "请输入有效数值。")
				: null;
		let checked = false;
		if (error) {
			error.id = id + "-error";
			error.hidden = true;
			error.setAttribute("role", "alert");
			input.addEventListener("blur", () => {
				checked = true;
				sync();
			});
		}
		function sync() {
			if (field.raw) {
				input.disabled = Boolean(field.disabled);
				minus.disabled = Boolean(field.disabled) || Boolean(field.stepDisabled?.(input.value, -1));
				plus.disabled = Boolean(field.disabled) || Boolean(field.stepDisabled?.(input.value, 1));
				const value = field.numberValue?.(input.value);
				if (value === undefined) input.removeAttribute("aria-valuenow");
				else input.setAttribute("aria-valuenow", value);
				const invalid = input.value !== "" && value === undefined;
				input.setAttribute("aria-invalid", String(invalid));
				error.hidden = !checked || !invalid || Boolean(field.disabled);
				const described = [field.help ? "help-" + field.key : "", !error.hidden ? error.id : ""]
					.filter(Boolean)
					.join(" ");
				if (described) input.setAttribute("aria-describedby", described);
				else input.removeAttribute("aria-describedby");
				return;
			}
			minus.disabled =
				Boolean(field.disabled) || (input.value !== "" && Number(input.value) <= field.min);
			plus.disabled =
				Boolean(field.disabled) ||
				(input.value !== "" && field.max != null && Number(input.value) >= field.max);
		}
		input.addEventListener("input", () => {
			onChange(field.raw ? input.value : input.value === "" ? null : Number(input.value));
			sync();
		});
		if (field.raw) {
			numberStates.set(box, sync);
			input.addEventListener("keydown", (e) => {
				if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
				e.preventDefault();
				const button = e.key === "ArrowUp" ? plus : minus;
				if (!button.disabled) button.click();
			});
		}
		line.append(minus, input, plus);
		box.append(label, line);
		if (error) box.append(error);
		if (field.help) {
			const help = el("p", "field-help", field.help);
			help.id = "help-" + field.key;
			input.setAttribute("aria-describedby", help.id);
			box.append(help);
		}
		sync();
		return box;
	}
	function text(field, value, onChange) {
		const box = el("div", "sg-field"),
			label = el("label", "", field.label),
			input = el(field.multiline ? "textarea" : "input", "sg-input");
		label.htmlFor = input.id = "input-" + field.key;
		if (!field.multiline) input.type = "text";
		input.value = value ?? "";
		if (field.placeholder) input.placeholder = field.placeholder;
		if (field.maxLength != null) input.maxLength = field.maxLength;
		input.disabled = Boolean(field.disabled);
		input.addEventListener("input", () => onChange(input.value));
		box.append(label, input);
		return box;
	}
	function select(field, value, onChange) {
		if (field.readonly) {
			const box = el("div", "sg-field"),
				label = el("span", "sg-field-label", field.label),
				copy = el(
					"p",
					"sg-field-value",
					field.options.find((o) => o.value === value)?.label || "—",
				);
			label.id = "label-" + field.key;
			box.setAttribute("role", "group");
			box.setAttribute("aria-labelledby", label.id);
			box.append(label, copy);
			return box;
		}
		const box = el("div", "sg-field"),
			label = el("label", "", field.label),
			input = el("select", "sg-input");
		label.htmlFor = input.id = "input-" + field.key;
		input.disabled = Boolean(field.disabled);
		if (value == null) {
			const placeholder = el("option", "", field.placeholder || "请选择");
			placeholder.value = "";
			placeholder.disabled = true;
			placeholder.selected = true;
			input.append(placeholder);
		}
		for (const [i, option] of field.options.entries()) {
			const item = el("option", "", option.label);
			item.value = String(i);
			item.selected = value === option.value;
			item.disabled = Boolean(option.disabled);
			input.append(item);
		}
		input.addEventListener("change", () => {
			const item = field.options[Number(input.value)];
			if (item) onChange(item.value);
		});
		box.append(label, input);
		enhance(box);
		if (field.help) {
			const help = el("p", "field-help", field.help);
			help.id = "help-" + field.key;
			input.setAttribute("aria-describedby", help.id);
			box.append(help);
		}
		return box;
	}
	function enhance(root = document) {
		if (!window.SGGIcons) return;
		const inputs = root.matches?.("select:not([multiple])")
			? [root]
			: root.querySelectorAll("select:not([multiple])");
		for (const input of inputs) {
			if (input.parentElement?.classList.contains("sg-select")) continue;
			const shell = el("span", "sg-select"),
				arrow = SGGIcons.create("chevron-down");
			arrow.classList.add("sg-select-chevron");
			arrow.setAttribute("aria-hidden", "true");
			input.before(shell);
			shell.append(input, arrow);
		}
		const summaries = root.matches?.("summary") ? [root] : root.querySelectorAll("summary");
		for (const summary of summaries) {
			if (summary.querySelector("svg") || summary.dataset.sgDisclosure === "custom") continue;
			summary.classList.add("sg-disclosure");
			const arrow = SGGIcons.create("chevron-down");
			arrow.classList.add("sg-disclosure-chevron");
			arrow.setAttribute("aria-hidden", "true");
			summary.append(arrow);
		}
	}
	// Local draft success never resolves a rejected service submission. Reveal after local sizing settles.
	const errorStates = new WeakMap();
	function paintError(node, state, reveal) {
		const source = state.submit ? "submit" : state.draft ? "draft" : null;
		node.hidden = !source;
		if (!source) {
			delete node.dataset.errorSource;
			return;
		}
		node.dataset.errorSource = source;
		node.textContent = state[source];
		if (reveal) {
			const message = node.textContent;
			requestAnimationFrame(() =>
				requestAnimationFrame(() => {
					if (
						node.isConnected &&
						!node.hidden &&
						node.dataset.errorSource === source &&
						node.textContent === message
					)
						node.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
				}),
			);
		}
	}
	function showError(node, message, source = "submit") {
		if (!node) return;
		const state = errorStates.get(node) || {};
		state[source] = String(message);
		errorStates.set(node, state);
		paintError(node, state, true);
	}
	function clearError(node, source) {
		if (!node) return;
		const state = errorStates.get(node);
		if (!state) return;
		delete state[source];
		paintError(node, state, false);
	}
	document.addEventListener(
		"keydown",
		() => (document.documentElement.dataset.sgControlsInput = "keyboard"),
		true,
	);
	document.addEventListener(
		"pointerdown",
		() => (document.documentElement.dataset.sgControlsInput = "pointer"),
		{ passive: true, capture: true },
	);
	document.addEventListener("DOMContentLoaded", () => enhance());
	window.SGGControls = Object.freeze({
		choice,
		number,
		syncNumber: (box) => numberStates.get(box)?.(),
		text,
		select,
		enhance,
		showError,
		clearError,
	});
})();

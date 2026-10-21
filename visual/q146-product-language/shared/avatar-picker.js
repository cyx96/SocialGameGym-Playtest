/* Preset identity choice: presentation and local draft only; the host owns saving and quotas. */
(() => {
	"use strict";
	function mount({ host, dialog, options, value = "default", allowedPresets, onChange }) {
		const A = window.SGGAvatar,
			B = window.SGGButtons,
			I = window.SGGIcons,
			R = window.SGGReading;
		let selected = A.resolve(value),
			visible = true;
		const trigger = B.create({ role: "icon", ariaLabel: "编辑头像" });
		trigger.classList.add("sg-avatar-trigger");
		trigger.setAttribute("aria-haspopup", "dialog");
		trigger.setAttribute("aria-controls", dialog.id);
		trigger.setAttribute("aria-expanded", "false");
		host.replaceChildren(trigger);
		const close = B.create({ role: "icon", ariaLabel: "关闭头像选择", icon: I.create("close") });
		dialog.querySelector("header").append(close);
		dialog.classList.add("sg-avatar-picker");
		options.classList.add("sg-avatar-options");
		function render() {
			trigger.replaceChildren(A.node({ preset: selected, size: "detail", badge: "edit" }));
			options.replaceChildren();
			const allowed = typeof allowedPresets === "function" ? allowedPresets() : allowedPresets;
			for (const [key, item] of Object.entries(A.registry)) {
				if (!item.selectable || (Array.isArray(allowed) && !allowed.includes(key))) continue;
				const button = B.create({ role: "icon", ariaLabel: item.label + "头像" });
				button.classList.add("sg-avatar-choice");
				button.dataset.preset = key;
				button.setAttribute("aria-pressed", String(key === selected));
				button.append(
					A.node({ preset: key, size: "row", ...(key === selected ? { badge: "check" } : {}) }),
				);
				button.onclick = (event) => {
					selected = key;
					render();
					onChange?.(key);
					R.close(dialog, { instant: window.SGGMotion?.instant(event) });
				};
				options.append(button);
			}
		}
		trigger.onclick = (event) => {
			render();
			R.open(dialog, { event });
			trigger.setAttribute("aria-expanded", "true");
			(
				options.querySelector("[aria-pressed=true]") ||
				options.querySelector("button") ||
				close
			).focus({ preventScroll: true });
		};
		close.onclick = (event) => R.close(dialog, { instant: window.SGGMotion?.instant(event) });
		const closed = () => {
			trigger.setAttribute("aria-expanded", "false");
			if (visible && trigger.isConnected) trigger.focus({ preventScroll: true });
		};
		dialog.addEventListener("close", closed);
		const outside = (event) => {
			if (event.target !== dialog) return;
			const r = dialog.getBoundingClientRect();
			if (
				event.clientX < r.left ||
				event.clientX > r.right ||
				event.clientY < r.top ||
				event.clientY > r.bottom
			)
				R.close(dialog);
		};
		dialog.addEventListener("click", outside);
		const keys = (event) => {
			const buttons = [...options.querySelectorAll("button")],
				index = buttons.indexOf(document.activeElement);
			if (index < 0) return;
			const columns = getComputedStyle(options).gridTemplateColumns.split(" ").length;
			const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[
				event.key
			];
			let next;
			if (offset !== undefined) next = (index + offset + buttons.length) % buttons.length;
			else if (event.key === "Home") next = 0;
			else if (event.key === "End") next = buttons.length - 1;
			else return;
			event.preventDefault();
			buttons[next].focus({ preventScroll: true });
		};
		options.addEventListener("keydown", keys);
		const visibility = (event) => {
			if (event.source === parent && event.data?.channel === "q146-app-visibility") {
				visible = Boolean(event.data.visible);
				if (!visible && dialog.open) R.close(dialog, { instant: true });
			}
		};
		window.addEventListener("message", visibility);
		R.enhance(dialog);
		render();
		return Object.freeze({
			setValue(value) {
				selected = A.resolve(value);
				render();
			},
			destroy() {
				window.removeEventListener("message", visibility);
				dialog.removeEventListener("close", closed);
				dialog.removeEventListener("click", outside);
				options.removeEventListener("keydown", keys);
				if (dialog.open) R.close(dialog, { instant: true });
			},
		});
	}
	window.SGGAvatarPicker = Object.freeze({ version: "avatar-picker/1", mount });
})();

(() => {
	"use strict";
	const policy = window.NUMBER_POLICY;
	const digit = (value) =>
		typeof value === "bigint"
			? value
			: typeof value === "number" && Number.isSafeInteger(value)
				? BigInt(value)
				: typeof value === "string" && /^-?(0|[1-9][0-9]*)$/.test(value)
					? BigInt(value)
					: null;
	function ratio(value) {
		if (value === null || value === undefined || value === "") return null;
		if (typeof value === "object") {
			const n = digit(value.n),
				d = digit(value.d);
			if (n === null || d === null || d <= 0n) return null;
			return { n, d };
		}
		if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
			const negative = value.startsWith("-"),
				[whole, fraction = ""] = value.replace(/^-/, "").split(".");
			return {
				n: BigInt(whole + fraction) * (negative ? -1n : 1n),
				d: 10n ** BigInt(fraction.length),
			};
		}
		const n = digit(value);
		return n === null ? null : { n, d: 1n };
	}
	const grouped = (s) => (policy.grouping ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : s);
	function expand(n, d, max) {
		const integer = n / d;
		let rem = n % d,
			tail = "";
		while (rem && tail.length < max) {
			rem *= 10n;
			tail += String(rem / d);
			rem %= d;
		}
		return { integer: String(integer), tail, more: rem !== 0n };
	}
	function rounded(n, d, places) {
		const scale = 10n ** BigInt(places),
			q = (n * scale) / d,
			rem = (n * scale) % d,
			v = q + (rem * 2n >= d ? 1n : 0n),
			s = String(v).padStart(places + 1, "0");
		return {
			integer: places ? s.slice(0, -places) : s,
			tail: places ? s.slice(-places).replace(/0+$/, "") : "",
			approx: rem !== 0n,
		};
	}
	function format(
		value,
		{ signed = false, unit = "", digits = policy.recurringFractionDigits } = {},
	) {
		const r = ratio(value);
		unit =
			["点", "point", "points"].includes(unit) && r
				? SGGI18n.t("asset.pointUnit", { count: r.n === r.d || r.n === -r.d ? 1 : 2 })
				: SGGI18n.systemCopy(unit);
		if (!r)
			return {
				text: "—",
				aria: SGGI18n.t("asset.numberMissing"),
				missing: true,
				approx: false,
				unit,
			};
		const negative = r.n < 0n,
			n = negative ? -r.n : r.n,
			d = r.d,
			sign = negative ? "−" : signed && n !== 0n ? "+" : "";
		const exact = expand(n, d, policy.finiteExactDigits);
		let result,
			exponent = "";
		if (!exact.more) result = { ...exact, approx: false };
		else {
			let places = digits;
			if (n !== 0n && n < d) {
				let first = 0,
					scaled = n;
				while (scaled < d && first < 1024) {
					scaled *= 10n;
					first++;
				}
				if (first > 8) {
					result = rounded(n * 10n ** BigInt(first), d, digits);
					exponent =
						"×10" +
						String(-first).replace(
							/[-0-9]/g,
							(c) =>
								({
									"-": "⁻",
									0: "⁰",
									1: "¹",
									2: "²",
									3: "³",
									4: "⁴",
									5: "⁵",
									6: "⁶",
									7: "⁷",
									8: "⁸",
									9: "⁹",
								})[c],
						);
				} else if (n * 10n ** BigInt(places) * 2n < d) places = Math.max(places, first + 1);
			}
			if (!result) result = rounded(n, d, places);
		}
		const magnitude =
			(exponent ? result.integer : grouped(result.integer)) +
			(result.tail ? "." + result.tail : "") +
			exponent;
		const text = (result.approx ? "≈" : "") + sign + magnitude;
		const detail = expand(n, d, policy.detailFractionDigits),
			detailText =
				sign +
				grouped(detail.integer) +
				(detail.tail ? "." + detail.tail : "") +
				(detail.more ? "…" : "");
		return {
			text,
			detail: detailText,
			approx: result.approx,
			missing: false,
			unit,
			aria:
				(result.approx ? SGGI18n.t("asset.numberApprox") : "") +
				(negative
					? SGGI18n.t("asset.numberNegative")
					: signed && n !== 0n
						? SGGI18n.t("asset.numberPositive")
						: "") +
				magnitude +
				(unit ? " " + unit : ""),
			r,
		};
	}
	const e = (tag, cls, text) => {
		const n = document.createElement(tag);
		if (cls) n.className = cls;
		if (text !== undefined) n.textContent = text;
		return n;
	};
	let popup,
		stopPopupLocale = () => {};

	function showDetail(trigger, value) {
		if (!popup) {
			popup = e("div", "number-detail");
			popup.id = "number-detail";
			popup.setAttribute("popover", "auto");
			popup.setAttribute("role", "note");
			document.body.append(popup);
		}
		if (popup.matches(":popover-open")) popup.hidePopover();
		const detail = e("p", "number-detail-value");
		detail.append(e("span", "number-detail-digits", value.detail));
		if (value.unit) detail.append(e("span", "numeric-unit", value.unit));
		popup.replaceChildren(
			e("p", "number-detail-label", SGGI18n.t("asset.numberPrecision")),
			detail,
			e("p", "number-detail-note", SGGI18n.t("asset.numberNote")),
		);
		const host = trigger.closest("dialog[open]") || document.body;
		if (popup.parentElement !== host) host.append(popup);
		stopPopupLocale();
		const detailPopup = popup;
		stopPopupLocale = SGGI18n.observe(detailPopup, () => {
			const label = detailPopup.querySelector(".number-detail-label"),
				note = detailPopup.querySelector(".number-detail-note"),
				unit = detailPopup.querySelector(".numeric-unit");
			if (label) label.textContent = SGGI18n.t("asset.numberPrecision");
			if (note) note.textContent = SGGI18n.t("asset.numberNote");
			if (unit) unit.textContent = SGGI18n.systemCopy(unit.textContent);
		});
		trigger.setAttribute("aria-controls", popup.id);
		window.SGGPaper?.enhance(popup);
		popup.showPopover({ source: trigger });
		let zoom = 1;
		for (let parent = popup.parentElement; parent; parent = parent.parentElement)
			zoom *= Number.parseFloat(getComputedStyle(parent).zoom) || 1;
		const box = trigger.getBoundingClientRect(),
			viewportWidth = innerWidth / zoom,
			viewportHeight = innerHeight / zoom,
			width = Math.min(320, viewportWidth - 32);
		popup.style.width = width + "px";
		popup.style.left = Math.max(16, Math.min(box.left / zoom, viewportWidth - width - 16)) + "px";
		popup.style.top =
			Math.max(16, Math.min(box.bottom / zoom + 8, viewportHeight - popup.offsetHeight - 16)) +
			"px";
	}
	function element(value, { role = "data", signed = false, unit = "", digits } = {}) {
		let f = format(value, { signed, unit, digits });
		const root = e(f.approx ? "button" : "span", "ui-number num--" + role);
		if (f.approx) {
			root.type = "button";
			root.classList.add("number-approx");
			root.setAttribute("data-sg-press", "");
			root.setAttribute("aria-label", SGGI18n.t("asset.numberDetails", { value: f.aria }));
			root.addEventListener("click", () => showDetail(root, f));
		} else root.setAttribute("aria-label", f.aria);
		if (f.text.length > 11) root.classList.add("number-wide");
		const text = e("span", "numeric-value");
		for (const [i, part] of f.text.split(",").entries()) {
			if (i) {
				text.append(document.createTextNode(","), document.createElement("wbr"));
			}
			text.append(document.createTextNode(part));
		}
		root.append(text);
		if (unit && !f.missing) root.append(e("span", "numeric-unit", f.unit));
		SGGI18n.observe(root, () => {
			f = format(value, { signed, unit, digits });
			root.setAttribute(
				"aria-label",
				f.approx ? SGGI18n.t("asset.numberDetails", { value: f.aria }) : f.aria,
			);
			const label = root.querySelector(".numeric-unit");
			if (label) label.textContent = f.unit;
		});
		return root;
	}
	function text(value, options = {}) {
		const f = format(value, options);
		return f.text + (f.unit && !f.missing ? "\u202f" + f.unit : "");
	}
	function progress(current, total, unit) {
		const a = ratio(current),
			b = ratio(total);
		if (!a || !b || a.d !== 1n || b.d !== 1n || a.n < 0n || b.n < 1n || a.n > b.n) return "—";
		return text(a.n) + "/" + text(b.n) + "\u202f" + SGGI18n.systemCopy(unit);
	}
	window.NumberUI = { format, element, text, progress, ratio };
})();

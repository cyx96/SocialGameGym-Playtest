/* Configuration presentation adapter. Existing metadata only; no player readiness or service acceptance. */
(() => {
	"use strict";
	const L = (key, values = {}) => ({ i18n: key, values });

	const D = SGGConfigurationDefinition,
		C = SGGControls,
		B = SGGButtons;
	let sequence = 0;
	const node = (tag, cls, text) => {
		const n = document.createElement(tag);
		if (cls) n.className = cls;
		if (text?.i18n) SGGI18n.bind(n, text.i18n, { values: text.values });
		else if (text != null) n.textContent = text;
		return n;
	};
	const key = (id) => "sgg-a6-q117-" + id + "-draft-v1";
	function defaults(id) {
		const g = D.games[id];
		if (!g) return null;
		return {
			rounds: String(g.rounds),
			communication: String(g.communication),
			tools: Object.fromEntries(D.tools.map((t) => [t.id, true])),
			socialQuotas: Object.fromEntries(D.tools.map((t) => [t.id, "1"])),
			socialQuotaPolicy: {
				reset: "communication_round",
				scope: "participant_tool",
				sharedActions: ["create", "edit"],
			},
			...Object.fromEntries(
				g.extraFields
					.filter((f) => f.defaultValue !== undefined)
					.map((f) => [f.key, f.defaultValue]),
			),
			...(g.disclosure ? { disclosure: g.disclosure } : {}),
			...(g.rationalFields
				? { payoffs: Object.fromEntries(g.rationalFields.map((f) => [f.key, { ...f.value }])) }
				: {}),
		};
	}
	function validate(id, value) {
		const g = D.games[id];
		if (!g) return { value: null, errors: { game: SGGI18n.t("asset.unavailable") } };
		const clean = defaults(id),
			errors = {};
		const integer = (v, min) =>
			/^\d+$/.test(String(v)) && Number.isSafeInteger(Number(v)) && Number(v) >= min;
		for (const [name, min] of [
			["rounds", 1],
			["communication", 0],
		]) {
			if (!integer(value?.[name], min))
				errors[name] = min === 0 ? SGGI18n.t("asset.integerZero") : SGGI18n.t("asset.integerOne");
			else clean[name] = String(Number(value[name]));
		}
		for (const t of D.tools) {
			clean.tools[t.id] = value?.tools?.[t.id] !== false;
			const quota = value?.socialQuotas?.[t.id] ?? 1;
			if (!integer(quota, 1)) {
				if (clean.tools[t.id]) errors["quota-" + t.id] = SGGI18n.t("asset.integerOne");
			} else clean.socialQuotas[t.id] = String(Number(quota));
		}
		if (!D.tools.some((t) => clean.tools[t.id])) clean.communication = "0";
		for (const f of g.extraFields) {
			const selected = value?.[f.key] === undefined ? clean[f.key] : value[f.key];
			if (!f.options.some((o) => o.value === selected))
				errors[f.key] = SGGI18n.t("asset.chooseField", { label: f.label });
			else clean[f.key] = selected;
		}
		if (g.rationalFields) {
			for (const f of g.rationalFields) {
				const q = value?.payoffs === undefined ? clean.payoffs[f.key] : value.payoffs?.[f.key];
				if (
					!q ||
					typeof q.n !== "string" ||
					typeof q.d !== "string" ||
					!/^(0|-?[1-9][0-9]*)$/.test(q.n) ||
					!/^[1-9][0-9]*$/.test(q.d)
				) {
					errors["payoff-" + f.key] = SGGI18n.t("asset.fractionRequired");
					continue;
				}
				let a = BigInt(q.n);
				if (a < 0n) a = -a;
				let b = BigInt(q.d);
				while (b) {
					const r = a % b;
					a = b;
					b = r;
				}
				if (a !== 1n) {
					errors["payoff-" + f.key] = SGGI18n.t("asset.fractionReduced");
					continue;
				}
				clean.payoffs[f.key] = { n: q.n, d: q.d };
			}
			if (!Object.keys(errors).some((k) => k.startsWith("payoff-")))
				for (let i = 1; i < (g.strictOrder?.length ?? 0); i++) {
					const a = clean.payoffs[g.strictOrder[i - 1]],
						b = clean.payoffs[g.strictOrder[i]];
					if (BigInt(a.n) * BigInt(b.d) <= BigInt(b.n) * BigInt(a.d))
						errors["payoff-" + g.strictOrder[i]] = SGGI18n.t("asset.payoffOrder");
				}
		}

		return { value: clean, errors };
	}
	function mount({ gameId, gameName, initial, onContinue, onDraftSaved, onClose }) {
		const form = node("form", "sg-game-config"),
			head = node("header", "sg-config-head"),
			name = node("p", "sg-config-game", gameName),
			title = node("h2", "", L("asset.configuration")),
			body = node("div", "sg-config-body"),
			footer = node("footer", "sg-config-footer"),
			status = node("p", "sg-error");
		name.textContent = SGGI18n.systemCopy(gameName);
		SGGI18n.observe(name, () => {
			name.textContent = SGGI18n.systemCopy(gameName);
		});
		status.setAttribute("role", "status");
		head.append(name, title);
		if (onClose) {
			const close = B.create({
				role: "icon",
				ariaLabelKey: "asset.closeConfiguration",
				icon: SGGIcons.create("close"),
			});
			close.classList.add("sg-config-close");
			close.onclick = onClose;
			head.append(close);
		}
		form.append(head, body, footer);
		const model = D.games[gameId];
		if (!model) {
			body.append(node("p", "sg-config-unavailable", L("asset.unavailable")));
			const action = B.create({ role: "primary", labelKey: "asset.prepare" });
			action.disabled = true;
			footer.append(action);
			return form;
		}
		let draft = defaults(gameId),
			storageError = false;
		try {
			const saved = initial || JSON.parse(localStorage.getItem(key(gameId)) || "null");
			if (saved) {
				const checked = validate(gameId, saved);
				if (!Object.keys(checked.errors).length) draft = checked.value;
			}
		} catch {
			storageError = true;
		}
		const instance = "config-" + ++sequence + "-",
			fields = new Map(),
			sections = new Map();
		function group(label, open = false) {
			const d = node("details", "sg-config-group"),
				s = node("summary");
			s.append(
				node(
					"span",
					"",
					L("asset." + ({ 基础: "basic", 社交: "social", 游戏: "game" }[label] || label)),
				),
			);
			d.open = open;
			d.append(s);
			body.append(d);
			sections.set(label, d);
			return d;
		}
		function feedback(errors) {
			for (const [k, f] of fields) {
				const e = errors[k];
				f.error.textContent = e || "";
				f.input?.setAttribute("aria-invalid", Boolean(e));
				if (e) f.group.open = true;
			}
		}
		function persist() {
			const checked = validate(gameId, draft);
			if (Object.keys(checked.errors).length) return false;
			try {
				localStorage.setItem(key(gameId), JSON.stringify(checked.value));
				storageError = false;
			} catch {
				storageError = true;
				return false;
			}
			onDraftSaved?.(checked.value);
			return true;
		}
		function number(group, label, k, min, read, write) {
			const field = C.number(
				{
					key: instance + k,
					label: typeof label === "function" ? label() : label,
					labelText: typeof label === "function" ? label : undefined,
					min,
				},
				read(),
				(v) => {
					write(v == null ? "" : String(v));
					field.querySelector(".sg-error").textContent = "";
					field.querySelector("input").setAttribute("aria-invalid", "false");
					persist();
				},
			);
			field.classList.add("sg-config-field");
			field.dataset.field = k;
			const error = node("p", "sg-error");
			error.id = instance + k + "-error";
			const input = field.querySelector("input");
			input.setAttribute("aria-describedby", error.id);
			field.append(error);
			fields.set(k, { input, error, group });
			group.append(field);
			return field;
		}
		const basics = group("基础", true);
		number(
			basics,
			() => SGGI18n.t("asset.progress." + (D.games[gameId].progressUnit || "round")),
			"rounds",
			1,
			() => draft.rounds,
			(v) => (draft.rounds = v),
		);
		const communication = number(
			basics,
			() => SGGI18n.t("asset.socialSteps"),
			"communication",
			0,
			() => draft.communication,
			(v) => (draft.communication = v),
		);
		const social = group("社交"),
			quotaTitle = node("p", "sg-config-quota-title", L("asset.perStep"));
		social.append(quotaTitle);
		function syncTools() {
			const any = D.tools.some((t) => draft.tools[t.id]);
			const input = communication.querySelector("input");
			input.disabled = !any;
			communication.querySelectorAll("button").forEach((b) => (b.disabled = !any));
			if (!any) {
				draft.communication = "0";
				input.value = "0";
			} else if (input.value === "0") {
				input.dispatchEvent(new Event("input", { bubbles: true }));
			}
		}
		for (const tool of D.tools) {
			const row = node("div", "sg-config-tool"),
				toggle = node("label", "sg-switch"),
				text = node("span"),
				check = node("input"),
				track = node("span", "sg-switch-track");
			check.type = "checkbox";
			check.checked = draft.tools[tool.id];
			const refreshTool = () => {
				text.textContent = tool.label;
				check.setAttribute("aria-label", SGGI18n.t("asset.enableTool", { label: tool.label }));
			};
			refreshTool();
			SGGI18n.observe(row, refreshTool);
			track.setAttribute("aria-hidden", "true");
			toggle.append(check, track, text);
			row.append(toggle);
			const f = number(
				row,
				() => SGGI18n.t("asset.toolQuota", { label: tool.label }),
				"quota-" + tool.id,
				1,
				() => draft.socialQuotas[tool.id],
				(v) => (draft.socialQuotas[tool.id] = v),
			);
			fields.get("quota-" + tool.id).group = social;
			f.querySelector("label").classList.add("sg-config-sr");
			const quota = f.querySelector("input"),
				minus = f.querySelector("button"),
				plus = f.querySelectorAll("button")[1];
			function syncQuota() {
				quota.disabled = !check.checked;
				minus.disabled = !check.checked || Number(quota.value) <= 1;
				plus.disabled = !check.checked;
			}
			check.onchange = () => {
				draft.tools[tool.id] = check.checked;
				syncQuota();
				syncTools();
				persist();
			};
			quota.addEventListener("input", syncQuota);
			syncQuota();
			social.append(row);
		}
		syncTools();
		const game = model.extraFields.length || model.rationalFields?.length ? group("游戏") : null;
		if (model.extraFields.length) {
			for (const f of model.extraFields) {
				const control = C.select(
					{ key: instance + f.key, label: f.label, labelText: () => f.label, options: f.options },
					draft[f.key],
					(v) => {
						draft[f.key] = v;
						persist();
					},
				);
				game.append(control);
			}
		}
		if (model.rationalFields) {
			game.append(node("h3", "sg-config-section-title", L("asset.payoffs")));
			game.append(node("p", "", L("asset.payoffHelp")));
			for (const f of model.rationalFields) {
				const box = node("div", ""),
					key = "payoff-" + f.key;
				const error = node("p", "sg-error");
				error.id = instance + key + "-error";
				let first;
				for (const [part, label] of [
					["n", "分子"],
					["d", "分母"],
				]) {
					const control = C.text(
						{
							key: instance + key + part,
							label: f.label + " · " + label,
							labelText: () =>
								SGGI18n.t("asset.fieldPart", { label: f.label, part: SGGI18n.systemCopy(label) }),
						},
						draft.payoffs[f.key][part],
						(v) => {
							draft.payoffs[f.key][part] = v;
							error.textContent = "";
							persist();
						},
					);
					control.classList.add("sg-config-field");
					const input = control.querySelector("input");
					input.inputMode = part === "d" ? "numeric" : "text";
					input.setAttribute("aria-describedby", error.id);
					if (!first) first = input;
					box.append(control);
				}
				box.append(error);
				fields.set(key, { input: first, error, group: game });
				game.append(box);
			}
		}

		const action = B.create({ role: "primary", labelKey: "asset.prepare" });
		action.type = "submit";
		if (document.body.dataset.creationRuntime === "pending") {
			action.disabled = true;
			window.addEventListener(
				"sgg:creation-ready",
				() => {
					action.disabled = false;
				},
				{ once: true },
			);
		}
		footer.append(status, action);
		form.noValidate = true;
		form.onsubmit = (e) => {
			e.preventDefault();
			const checked = validate(gameId, draft);
			feedback(checked.errors);
			if (Object.keys(checked.errors).length) {
				fields.get(Object.keys(checked.errors)[0])?.input?.focus();
				return;
			}
			if (!persist()) {
				SGGControls.showError(status, "未能保存设置，请重试。", "draft");
				return;
			}
			SGGControls.clearError(status, "draft");
			status.textContent = "";
			onContinue?.(checked.value);
		};
		SGGI18n.observe(form, () => {
			if ([...fields.values()].some((field) => field.error.textContent))
				feedback(validate(gameId, draft).errors);
		});
		C.enhance(form);
		B.enhance(form);
		return form;
	}
	window.SGGGameConfiguration = Object.freeze({ defaults, validate, mount, key });
})();

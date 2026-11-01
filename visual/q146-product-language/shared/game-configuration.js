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
	function fieldModels(id, schema) {
		const properties = schema?.properties || {};
		return (D.games[id]?.extraFields || []).map((field) => {
			const declared = properties[field.key] || {};
			const rule =
				Array.isArray(declared.anyOf) &&
				declared.anyOf.length === 2 &&
				declared.anyOf.some((v) => v.type === "null")
					? declared.anyOf.find((v) => v.type !== "null")
					: declared;
			return Object.defineProperty(
				{
					...field,
					type: field.type || "enum",
					schema: rule,
					defaultValue: Object.hasOwn(declared, "default")
						? declared.default
						: Object.hasOwn(rule, "default")
							? rule.default
							: field.defaultValue,
					minimum: rule.minimum ?? field.minimum ?? Number.MIN_SAFE_INTEGER,
					maximum: rule.maximum ?? field.maximum ?? Number.MAX_SAFE_INTEGER,
				},
				"label",
				{ enumerable: true, get: () => field.label },
			);
		});
	}
	function fraction(q) {
		if (
			!q ||
			typeof q !== "object" ||
			Object.keys(q).sort().join(",") !== "d,n" ||
			typeof q.n !== "string" ||
			typeof q.d !== "string" ||
			!/^(0|-?[1-9][0-9]*)$/.test(q.n) ||
			!/^[1-9][0-9]*$/.test(q.d)
		)
			return false;
		let a = BigInt(q.n);
		if (a < 0n) a = -a;
		let b = BigInt(q.d);
		while (b) {
			const r = a % b;
			a = b;
			b = r;
		}
		return a === 1n;
	}
	function boundedFraction(q, bounds = {}) {
		if (!fraction(q)) return false;
		return Object.entries(bounds).every(([kind, bound]) => {
			if (!fraction(bound)) return false;
			const delta = BigInt(q.n) * BigInt(bound.d) - BigInt(bound.n) * BigInt(q.d);
			return (
				{
					minimum: delta >= 0n,
					maximum: delta <= 0n,
					exclusiveMinimum: delta > 0n,
					exclusiveMaximum: delta < 0n,
				}[kind] === true
			);
		});
	}
	function fractionBounds(bounds) {
		return ["minimum", "exclusiveMinimum", "maximum", "exclusiveMaximum"]
			.filter((kind) => bounds[kind] !== undefined)
			.map((kind) => {
				const q = bounds[kind];
				return SGGI18n.t("configuration.fractionBound." + kind, {
					bound: q.d === "1" ? q.n : q.n + "/" + q.d,
				});
			})
			.join(SGGI18n.t("configuration.boundsAnd"));
	}

	function defaultList(f, count) {
		if (!boundedFraction(f.defaultItem, f.itemBounds)) throw Error("Invalid rational list default");
		return Array.from({ length: count }, () => ({ ...f.defaultItem }));
	}

	const copy = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
	function participantBounds(schema, inputSchema) {
		const annotated = schema?.["x-sgg-minimum-participants"];
		if (
			schema &&
			Object.hasOwn(schema, "x-sgg-minimum-participants") &&
			(!Number.isSafeInteger(annotated) || annotated < 2)
		)
			throw Error("Invalid participant minimum");
		return {
			minimum: Math.max(inputSchema?.minimum ?? 2, annotated ?? 2),
			maximum: inputSchema?.maximum ?? Number.MAX_SAFE_INTEGER,
		};
	}
	function resizeStructuredDraft(id, value, count, schema, inputSchema) {
		const limits = participantBounds(schema, inputSchema);
		if (!Number.isSafeInteger(count) || count < limits.minimum || count > limits.maximum)
			throw Error("Invalid participant count");
		const draft = copy(value),
			cache = copy(draft.structuredDrafts || {});
		for (const f of fieldModels(id, schema).filter((f) => f.type === "ordered-rational-list")) {
			if (f.length !== "participantCount") continue;
			const active = draft[f.key],
				generated = draft.structuredDefaults?.[f.key];
			if (
				active == null ||
				(generated !== undefined && JSON.stringify(active) === JSON.stringify(generated))
			) {
				draft[f.key] = defaultList(f, count);
				draft.structuredDefaults = { ...draft.structuredDefaults, [f.key]: copy(draft[f.key]) };
			}
		}
		for (const f of fieldModels(id, schema).filter((f) =>
			["ordered-string-list", "rational-matrix"].includes(f.type),
		)) {
			if (f.type === "ordered-string-list" && f.length !== "participantCount") continue;
			const active = draft[f.key];
			let remembered = copy(cache[f.key]);
			if (Array.isArray(active)) {
				if (!Array.isArray(remembered)) remembered = [];
				active.forEach((row, i) => {
					if (f.type === "rational-matrix" && Array.isArray(row)) {
						if (!Array.isArray(remembered[i])) remembered[i] = [];
						row.forEach((cell, j) => (remembered[i][j] = copy(cell)));
					} else remembered[i] = copy(row);
				});
			} else if (active !== undefined) remembered = copy(active);
			cache[f.key] = copy(remembered);
			if (remembered !== undefined && !Array.isArray(remembered)) {
				draft[f.key] = copy(remembered);
				continue;
			}
			draft[f.key] = Array.from({ length: count }, (_, i) => {
				if (f.type === "ordered-string-list")
					return remembered && Object.hasOwn(remembered, i) ? copy(remembered[i]) : "";
				const row = remembered?.[i];
				if (row !== undefined && !Array.isArray(row)) return copy(row);
				return Array.from({ length: count }, (_, j) =>
					row && Object.hasOwn(row, j) ? copy(row[j]) : { n: "", d: "" },
				);
			});
		}
		return {
			...draft,
			participantCount: String(count),
			structuredCount: count,
			structuredDrafts: cache,
		};
	}
	function textValue(value, rule) {
		return (
			typeof value === "string" &&
			[...value].length >= (rule.minLength ?? 1) &&
			[...value].length <= (rule.maxLength ?? Infinity) &&
			(!rule.pattern || new RegExp(rule.pattern, "u").test(value))
		);
	}
	function socialDisabled(id, context) {
		return (
			(context ? context.sessionConstraints : D.games[id]?.sessionConstraints)?.externalSocial ===
			"disabled"
		);
	}
	function defaults(id, schema, inputSchema, context) {
		const g = D.games[id];
		if (!g) return null;
		return {
			rounds: String(g.rounds),
			participantCount: String(participantBounds(schema, inputSchema).minimum),
			communication: socialDisabled(id, context) ? "0" : String(g.communication),
			tools: Object.fromEntries(D.tools.map((t) => [t.id, !socialDisabled(id, context)])),
			socialQuotas: Object.fromEntries(D.tools.map((t) => [t.id, "1"])),
			socialQuotaPolicy: {
				reset: "communication_round",
				scope: "participant_tool",
				sharedActions: ["create", "edit"],
			},
			...Object.fromEntries(
				fieldModels(id, schema)
					.filter((f) => f.defaultValue !== undefined)
					.map((f) => [f.key, copy(f.defaultValue)]),
			),
			...(g.disclosure ? { disclosure: g.disclosure } : {}),
			...(g.rationalFields
				? { payoffs: Object.fromEntries(g.rationalFields.map((f) => [f.key, { ...f.value }])) }
				: {}),
		};
	}
	function validate(id, value, schema, inputSchema, context) {
		const g = D.games[id];
		if (!g) return { value: null, errors: { game: SGGI18n.t("asset.unavailable") } };
		const clean = defaults(id, schema, inputSchema, context),
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
		const limits = participantBounds(schema, inputSchema),
			rawCount = value?.participantCount ?? clean.participantCount;
		const count =
			typeof rawCount === "number" ||
			(typeof rawCount === "string" && /^(0|[1-9][0-9]*)$/.test(rawCount))
				? Number(rawCount)
				: NaN;
		if (!Number.isSafeInteger(count) || count < limits.minimum || count > limits.maximum)
			errors.participantCount = SGGI18n.t("asset.integerValid");
		else clean.participantCount = count;
		if (
			fieldModels(id, schema).some(
				(f) => f.length === "participantCount" || f.rows === "participantCount",
			) &&
			value?.structuredCount !== undefined &&
			value.structuredCount !== count
		)
			errors.participantCount = SGGI18n.t("configuration.applySizeRequired");
		for (const t of D.tools) {
			const enabled =
				value?.tools && Object.hasOwn(value.tools, t.id) ? value.tools[t.id] : clean.tools[t.id];
			if (typeof enabled !== "boolean") errors.communication = SGGI18n.t("asset.booleanRequired");
			else clean.tools[t.id] = enabled;
			const quota = value?.socialQuotas?.[t.id] ?? 1;
			if (!integer(quota, 1)) {
				if (clean.tools[t.id]) errors["quota-" + t.id] = SGGI18n.t("asset.integerOne");
			} else clean.socialQuotas[t.id] = String(Number(quota));
		}
		if (g.fixedRounds && clean.rounds !== String(g.rounds))
			errors.rounds = SGGI18n.t("asset.unavailable");
		if (
			socialDisabled(id, context) &&
			(D.tools.some((t) => clean.tools[t.id]) || clean.communication !== "0")
		)
			errors.communication = SGGI18n.t("configuration.socialUnavailable");
		if (!D.tools.some((t) => clean.tools[t.id])) clean.communication = "0";
		for (const f of fieldModels(id, schema)) {
			let selected = value?.[f.key] === undefined ? clean[f.key] : value[f.key];
			if (
				f.type === "ordered-rational-list" &&
				selected == null &&
				f.length === "participantCount" &&
				!errors.participantCount
			)
				selected = defaultList(f, count);
			if (f.type === "integer") {
				const parsed =
					typeof selected === "number"
						? selected
						: typeof selected === "string" && /^(0|-?[1-9][0-9]*)$/.test(selected)
							? Number(selected)
							: NaN;
				if (!Number.isSafeInteger(parsed) || parsed < f.minimum || parsed > f.maximum)
					errors[f.key] = SGGI18n.t("asset.integerValid");
				else clean[f.key] = parsed;
			} else if (f.type === "rational") {
				if (!fraction(selected)) errors[f.key] = SGGI18n.t("asset.fractionRequired");
				else clean[f.key] = { ...selected };
			} else if (f.type === "ordered-string-list") {
				if (
					!Array.isArray(selected) ||
					(f.length === "participantCount" && selected.length !== count) ||
					(Array.isArray(selected) &&
						(selected.length < (f.schema.minItems ?? 0) ||
							selected.length > (f.schema.maxItems ?? Infinity)))
				)
					errors[f.key] = SGGI18n.t(
						f.length === "participantCount"
							? "configuration.taskListRequired"
							: "configuration.listInvalid",
						{ count, label: f.label },
					);
				else {
					selected.forEach((item, i) => {
						if (
							!textValue(item, f.schema.items || {}) ||
							((f.schema.uniqueItems ?? f.unique) && selected.indexOf(item) !== i)
						)
							errors[f.key + ":" + i] = SGGI18n.t(
								f.length === "participantCount"
									? "configuration.taskListRequired"
									: "configuration.listInvalid",
								{ count, label: f.label },
							);
					});
					clean[f.key] = copy(selected);
				}
			} else if (f.type === "ordered-rational-list") {
				if (
					!Array.isArray(selected) ||
					(f.length === "participantCount" && selected.length !== count) ||
					selected.length < (f.schema.minItems ?? 0) ||
					selected.length > (f.schema.maxItems ?? Infinity)
				)
					errors[f.key] = SGGI18n.t("configuration.listInvalid", { count, label: f.label });
				else {
					selected.forEach((q, i) => {
						if (!fraction(q)) errors[f.key + ":" + i] = SGGI18n.t("asset.fractionRequired");
						else if (!boundedFraction(q, f.itemBounds))
							errors[f.key + ":" + i] = SGGI18n.t("configuration.fractionBounds", {
								bounds: fractionBounds(f.itemBounds),
							});
					});
					clean[f.key] = copy(selected);
				}
			} else if (f.type === "rational-matrix") {
				const columns = f.columns ? (value?.[f.columns] ?? clean[f.columns]) : undefined;
				if (
					!Array.isArray(selected) ||
					(f.rows === "participantCount" && selected.length !== count) ||
					(f.columns && !Array.isArray(columns))
				)
					errors[f.key] = SGGI18n.t("configuration.matrixShape");
				else {
					selected.forEach((row, i) => {
						if (!Array.isArray(row) || (f.columns && row.length !== columns.length))
							errors[f.key] = SGGI18n.t("configuration.matrixShape");
						else
							row.forEach((q, j) => {
								if (
									!fraction(q) ||
									(typeof f.minimum === "object" &&
										BigInt(q.n) * BigInt(f.minimum.d) < BigInt(f.minimum.n) * BigInt(q.d))
								)
									errors[f.key + ":" + i + ":" + j] = SGGI18n.t(
										"configuration.nonnegativeFraction",
									);
							});
					});
					clean[f.key] = copy(selected);
				}
			} else if (f.type === "boolean") {
				if (typeof selected !== "boolean") errors[f.key] = SGGI18n.t("asset.booleanRequired");
				else clean[f.key] = selected;
			} else if (!f.options?.some((o) => o.value === selected))
				errors[f.key] = SGGI18n.t("asset.chooseField", { label: f.label });
			else clean[f.key] = selected;
		}
		if (g.rationalFields) {
			for (const f of g.rationalFields) {
				const q = value?.payoffs === undefined ? clean.payoffs[f.key] : value.payoffs?.[f.key];
				if (!fraction(q)) {
					errors["payoff-" + f.key] = SGGI18n.t("asset.fractionRequired");
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
	function mount({
		gameId,
		gameName,
		initial,
		configurationSchema,
		configurationContext,
		participantCountSchema,
		onContinue,
		onDraftSaved,
		onClose,
	}) {
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
		let draft = defaults(gameId, configurationSchema, participantCountSchema, configurationContext),
			storageError = false;
		try {
			const saved = initial || JSON.parse(localStorage.getItem(key(gameId)) || "null");
			if (saved) {
				draft = {
					...draft,
					...saved,
					tools: {
						...draft.tools,
						...(saved.tools && typeof saved.tools === "object" ? saved.tools : {}),
					},
					socialQuotas: {
						...draft.socialQuotas,
						...(saved.socialQuotas && typeof saved.socialQuotas === "object"
							? saved.socialQuotas
							: {}),
					},
				};
			}
		} catch {
			storageError = true;
		}
		const structures = fieldModels(gameId, configurationSchema).filter((f) =>
			["ordered-string-list", "ordered-rational-list", "rational-matrix"].includes(f.type),
		);
		const countLimits = participantBounds(configurationSchema, participantCountSchema);
		const rawInitialCount = Number(draft.participantCount);
		const allowedCount = (count) =>
			Number.isSafeInteger(count) && count >= countLimits.minimum && count <= countLimits.maximum;
		let activeCount = allowedCount(draft.structuredCount)
			? draft.structuredCount
			: allowedCount(rawInitialCount)
				? rawInitialCount
				: countLimits.minimum;
		for (const f of structures)
			if (f.type === "ordered-rational-list") {
				if (draft[f.key] == null && f.length === "participantCount") {
					draft[f.key] = defaultList(f, activeCount);
					draft.structuredDefaults = { ...draft.structuredDefaults, [f.key]: copy(draft[f.key]) };
				}
			} else if (!Object.hasOwn(draft, f.key))
				draft[f.key] = Array.from(
					{
						length:
							f.type === "ordered-string-list" && f.length !== "participantCount"
								? (f.schema.minItems ?? 0)
								: activeCount,
					},
					() =>
						f.type === "ordered-string-list"
							? ""
							: Array.from({ length: activeCount }, () => ({ n: "", d: "" })),
				);
		const rosterStructures = structures.filter(
			(f) => f.length === "participantCount" || f.rows === "participantCount",
		);
		if (rosterStructures.length && draft.structuredCount === undefined)
			draft.structuredCount = activeCount;
		const structureControllers = [];
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
			try {
				localStorage.setItem(key(gameId), JSON.stringify(draft));
				storageError = false;
			} catch {
				storageError = true;
				return false;
			}
			onDraftSaved?.(draft);
			return true;
		}
		function number(group, label, k, min, read, write, max, raw = false) {
			const field = C.number(
				{
					key: instance + k,
					label: typeof label === "function" ? label() : label,
					labelText: typeof label === "function" ? label : undefined,
					min,
					max,
					raw,
					numberValue: (text) =>
						/^(0|-?[1-9][0-9]*)$/.test(text) &&
						Number.isSafeInteger(Number(text)) &&
						Number(text) >= min &&
						Number(text) <= max
							? Number(text)
							: undefined,
					stepValue: (text, delta) => {
						if (!text) return String(delta < 0 ? max : min);
						const n = Number(text),
							next = n + delta;
						return /^(0|-?[1-9][0-9]*)$/.test(text) &&
							Number.isSafeInteger(n) &&
							Number.isSafeInteger(next) &&
							next >= min &&
							next <= max
							? String(next)
							: undefined;
					},
					stepDisabled: (text, delta) =>
						text !== "" &&
						(!/^(0|-?[1-9][0-9]*)$/.test(text) ||
							!Number.isSafeInteger(Number(text)) ||
							Number(text) + delta < min ||
							Number(text) + delta > max),
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
		const disabledSocial = socialDisabled(gameId, configurationContext);
		const socialConflict = () =>
			disabledSocial &&
			(D.tools.some((t) => draft.tools[t.id] !== false) ||
				(draft.communication !== "0" && draft.communication !== 0));
		if (disabledSocial && D.games[gameId].fixedRounds && !socialConflict()) basics.hidden = true;
		number(
			basics,
			() => SGGI18n.t("asset.progress." + (D.games[gameId].progressUnit || "round")),
			"rounds",
			1,
			() => draft.rounds,
			(v) => (draft.rounds = v),
		);
		number(
			basics,
			() => SGGI18n.t("configuration.participantCount"),
			"participantCount",
			countLimits.minimum,
			() => draft.participantCount,
			(v) => (draft.participantCount = v),
			countLimits.maximum,
			true,
		);
		if (rosterStructures.length) {
			const resize = B.create({ role: "quiet", labelKey: "configuration.applySize" });
			resize.dataset.field = "resize-structures";
			resize.onclick = () => {
				const count = Number(draft.participantCount);
				if (
					!/^(0|[1-9][0-9]*)$/.test(String(draft.participantCount)) ||
					!Number.isSafeInteger(count) ||
					count < countLimits.minimum ||
					count > countLimits.maximum
				) {
					feedback({ participantCount: SGGI18n.t("asset.integerValid") });
					fields.get("participantCount").input.focus();
					return;
				}
				draft = resizeStructuredDraft(
					gameId,
					draft,
					count,
					configurationSchema,
					participantCountSchema,
				);
				activeCount = count;
				structureControllers.forEach((controller) => controller.render());
				persist();
				feedback(
					structures.some((f) => f.type === "ordered-rational-list")
						? validate(
								gameId,
								draft,
								configurationSchema,
								participantCountSchema,
								configurationContext,
							).errors
						: {},
				);
			};
			basics.append(resize);
		}
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
		if (disabledSocial) social.hidden = !socialConflict();
		communication.hidden = disabledSocial && !socialConflict();
		function syncTools(changed = false) {
			const any = D.tools.some((t) => draft.tools[t.id]);
			const input = communication.querySelector("input");
			input.disabled = disabledSocial || !any;
			communication
				.querySelectorAll("button")
				.forEach((b) => (b.disabled = disabledSocial || !any));
			if (!any && changed) {
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
			check.disabled = disabledSocial;
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
				quota.disabled = disabledSocial || !check.checked;
				minus.disabled = disabledSocial || !check.checked || Number(quota.value) <= 1;
				plus.disabled = disabledSocial || !check.checked;
			}
			check.onchange = () => {
				draft.tools[tool.id] = check.checked;
				syncQuota();
				syncTools(true);
				persist();
			};
			quota.addEventListener("input", syncQuota);
			syncQuota();
			social.append(row);
		}
		syncTools();
		let socialCorrection;
		if (disabledSocial && socialConflict()) {
			const remove = B.create({ role: "quiet", labelKey: "configuration.removeSocial" });
			remove.onclick = () => {
				for (const t of D.tools) draft.tools[t.id] = false;
				draft.communication = "0";
				communication.querySelector("input").value = "0";
				social
					.querySelectorAll('input[type="checkbox"]')
					.forEach((input) => (input.checked = false));
				syncTools();
				persist();
				feedback({});
				communication.hidden = true;
				social.hidden = true;
				if (model.fixedRounds) basics.hidden = true;
				remove.remove();
			};
			socialCorrection = remove;
			basics.append(remove);
		}
		const game = model.extraFields.length || model.rationalFields?.length ? group("游戏") : null;
		function rationalControl(f, value, write, key, target = game) {
			const box = node("div", ""),
				error = node("p", "sg-error");
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
							SGGI18n.t("asset.fieldPart", {
								label: SGGI18n.systemCopy(f.label),
								part: SGGI18n.systemCopy(label),
							}),
					},
					value?.[part] ?? "",
					(v) => {
						write(part, v);
						error.textContent = "";
						persist();
					},
				);
				control.classList.add("sg-config-field");
				control.dataset.field = key + "-" + part;
				const input = control.querySelector("input");
				input.inputMode = part === "d" ? "numeric" : "text";
				input.setAttribute("aria-describedby", error.id);
				if (!first) first = input;
				box.append(control);
			}
			box.append(error);
			fields.set(key, { input: first, error, group: game });
			target.append(box);
			return box;
		}
		function taskLabel(index, field) {
			const tasks = draft[field];
			return Array.isArray(tasks) && typeof tasks[index] === "string" && tasks[index]
				? tasks[index]
				: SGGI18n.t("configuration.taskIndex", { number: index + 1 });
		}
		function orderedList(f) {
			const section = node("div", "sg-config-list"),
				error = node("p", "sg-error");
			const rational = f.type === "ordered-rational-list";
			const independent = rational || f.length !== "participantCount";
			const blank = () => (rational ? { n: "", d: "" } : "");
			const changed = () => {
				if (rational && draft.structuredDefaults) delete draft.structuredDefaults[f.key];
			};
			game.append(section);
			const render = () => {
				for (const key of fields.keys()) if (key.startsWith(f.key + ":")) fields.delete(key);
				section.replaceChildren();
				let first;
				const size = independent
					? Array.isArray(draft[f.key])
						? draft[f.key].length
						: 0
					: activeCount;
				const itemLabel = (number) =>
					independent
						? SGGI18n.t("configuration.listItem", { label: f.label, number })
						: SGGI18n.t("configuration.taskIndex", { number });
				for (let i = 0; i < size; i++) {
					const key = f.key + ":" + i;
					let control, input;
					if (rational) {
						control = rationalControl(
							{
								get label() {
									return itemLabel(i + 1);
								},
							},
							Array.isArray(draft[f.key]) ? draft[f.key][i] : undefined,
							(part, value) => {
								changed();
								const old = draft[f.key][i];
								draft[f.key][i] = { ...(old && typeof old === "object" ? old : {}), [part]: value };
							},
							key,
							section,
						);
						input = control.querySelector("input");
					} else {
						control = C.text(
							{ key: instance + key, label: itemLabel(i + 1), labelText: () => itemLabel(i + 1) },
							Array.isArray(draft[f.key]) ? (draft[f.key][i] ?? "") : "",
							(value) => {
								if (!Array.isArray(draft[f.key])) draft[f.key] = [];
								while (draft[f.key].length < size) draft[f.key].push("");
								draft[f.key][i] = value;
								structureControllers.forEach((c) => c.refresh?.());
								persist();
							},
						);
						input = control.querySelector("input");
						const message = node("p", "sg-error");
						message.id = instance + key + "-error";
						input.setAttribute("aria-describedby", message.id);
						control.classList.add("sg-config-field");
						control.append(message);
						fields.set(key, { input, error: message, group: game });
					}
					control.dataset.field = key;
					if (independent) {
						const row = node("div", "sg-config-list-row");
						const remove = B.create({
							role: "icon",
							ariaLabelKey: "configuration.removeItem",
							ariaLabelValues: {
								get label() {
									return f.label;
								},
								number: i + 1,
							},
							icon: SGGIcons.create("close"),
						});
						remove.disabled = size <= (f.schema.minItems ?? 0);
						remove.onclick = () => {
							changed();
							draft[f.key].splice(i, 1);
							render();
							persist();
							B.enhance(section);
							C.enhance(section);
							section.querySelectorAll("input")[Math.min(i, size - 2)]?.focus();
						};
						row.append(control, remove);
						section.append(row);
					} else section.append(control);
					if (!first) first = input;
				}
				if (independent) {
					const add = B.create({
						role: "quiet",
						labelKey: "configuration.addItem",
						labelValues: {
							get label() {
								return f.label;
							},
						},
					});
					add.disabled = size >= (f.schema.maxItems ?? Number.MAX_SAFE_INTEGER);
					add.onclick = () => {
						if (!Array.isArray(draft[f.key])) draft[f.key] = [];
						changed();
						draft[f.key].push(blank());
						render();
						persist();
						B.enhance(section);
						C.enhance(section);
						section.querySelectorAll("input")[size]?.focus();
					};
					section.append(add);
				}
				error.id = instance + f.key + "-error";
				section.append(error);
				fields.set(f.key, { input: first, error, group: game });
			};
			structureControllers.push({ render });
			render();
		}
		function matrix(f) {
			const section = node("div", ""),
				error = node("p", "sg-error"),
				choice = node("div", ""),
				rowBody = node("div", "");
			section.append(choice, error, rowBody);
			game.append(section);
			let selected = 0;
			const renderRow = () => {
				for (const key of fields.keys()) if (key.startsWith(f.key + ":")) fields.delete(key);
				rowBody.replaceChildren();
				for (let j = 0; j < activeCount; j++) {
					const descriptor = Object.defineProperty({}, "label", {
							get: () => taskLabel(j, f.columns),
						}),
						key = f.key + ":" + selected + ":" + j;
					const value =
						Array.isArray(draft[f.key]) && Array.isArray(draft[f.key][selected])
							? draft[f.key][selected][j]
							: undefined;
					const control = rationalControl(
						descriptor,
						value,
						(part, value) => {
							if (!Array.isArray(draft[f.key])) draft[f.key] = [];
							if (!Array.isArray(draft[f.key][selected]))
								draft[f.key][selected] = Array.from({ length: activeCount }, () => ({
									n: "",
									d: "",
								}));
							const old = draft[f.key][selected][j];
							draft[f.key][selected][j] = {
								...(old && typeof old === "object" ? old : {}),
								[part]: value,
							};
						},
						key,
						rowBody,
					);
					control.dataset.costRow = String(selected);
					control.dataset.costColumn = String(j);
				}
			};
			const render = () => {
				if (selected >= activeCount) selected = activeCount - 1;
				const control = C.select(
					{
						key: instance + f.key + "-row",
						label: SGGI18n.t("configuration.costRow"),
						labelText: () => SGGI18n.t("configuration.costRow"),
						options: Array.from({ length: activeCount }, (_, i) => ({
							value: String(i),
							label: SGGI18n.t("configuration.playerRow", { number: i + 1 }),
							labelText: () => SGGI18n.t("configuration.playerRow", { number: i + 1 }),
						})),
					},
					String(selected),
					(value) => {
						selected = Number(value);
						renderRow();
					},
				);
				control.dataset.field = f.key + "-row";
				choice.replaceChildren(control);
				error.id = instance + f.key + "-error";
				fields.set(f.key, { input: control.querySelector("select"), error, group: game });
				renderRow();
			};
			structureControllers.push({
				render,
				refresh: () =>
					rowBody.querySelectorAll(".sg-config-field").forEach((control) => C.localize(control)),
				reveal: (errors) => {
					const key = Object.keys(errors).find((key) => key.startsWith(f.key + ":"));
					if (key) {
						selected = Number(key.split(":")[1]);
						render();
					}
				},
			});
			render();
		}
		for (const f of fieldModels(gameId, configurationSchema)) {
			if (f.type === "integer") {
				number(
					game,
					() => f.label,
					f.key,
					f.minimum,
					() => draft[f.key],
					(v) => (draft[f.key] = v),
					f.maximum,
					true,
				);
			} else if (f.type === "rational") {
				rationalControl(
					f,
					draft[f.key],
					(part, value) => {
						draft[f.key] = {
							...(draft[f.key] && typeof draft[f.key] === "object" ? draft[f.key] : {}),
							[part]: value,
						};
					},
					f.key,
				);
			} else if (f.type === "boolean") {
				const row = node("div", "sg-config-field"),
					toggle = node("label", "sg-switch"),
					check = node("input"),
					track = node("span", "sg-switch-track"),
					label = node("span");
				row.dataset.field = f.key;
				check.type = "checkbox";
				check.checked = draft[f.key] === true;
				check.indeterminate = typeof draft[f.key] !== "boolean";
				const refresh = () => {
					label.textContent = f.label;
					check.setAttribute("aria-label", f.label);
				};
				refresh();
				SGGI18n.observe(row, refresh);
				track.setAttribute("aria-hidden", "true");
				toggle.append(check, track, label);
				const error = node("p", "sg-error");
				error.id = instance + f.key + "-error";
				check.setAttribute("aria-describedby", error.id);
				check.onchange = () => {
					draft[f.key] = check.checked;
					check.indeterminate = false;
					error.textContent = "";
					persist();
				};
				row.append(toggle, error);
				fields.set(f.key, { input: check, error, group: game });
				game.append(row);
			} else if (f.type === "ordered-string-list" || f.type === "ordered-rational-list") {
				orderedList(f);
			} else if (f.type === "rational-matrix") {
				matrix(f);
			} else {
				const control = C.select(
					{ key: instance + f.key, label: f.label, labelText: () => f.label, options: f.options },
					draft[f.key],
					(v) => {
						draft[f.key] = v;
						persist();
					},
				);
				control.dataset.field = f.key;
				const error = node("p", "sg-error"),
					input = control.querySelector("select");
				error.id = instance + f.key + "-error";
				input.setAttribute("aria-describedby", error.id);
				control.append(error);
				fields.set(f.key, { input, error, group: game });
				game.append(control);
			}
		}
		if (model.rationalFields) {
			game.append(node("h3", "sg-config-section-title", L("asset.payoffs")));
			game.append(node("p", "", L(model.strictOrder ? "asset.payoffHelp" : "asset.fractionHelp")));
			for (const f of model.rationalFields)
				rationalControl(
					f,
					draft.payoffs?.[f.key],
					(part, value) => {
						if (!draft.payoffs || typeof draft.payoffs !== "object") draft.payoffs = {};
						draft.payoffs[f.key] = {
							...(draft.payoffs[f.key] && typeof draft.payoffs[f.key] === "object"
								? draft.payoffs[f.key]
								: {}),
							[part]: value,
						};
					},
					"payoff-" + f.key,
				);
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
			const checked = validate(
				gameId,
				draft,
				configurationSchema,
				participantCountSchema,
				configurationContext,
			);
			structureControllers.forEach((controller) => controller.reveal?.(checked.errors));
			feedback(checked.errors);
			if (Object.keys(checked.errors).length) {
				if (checked.errors.communication && socialCorrection?.isConnected) socialCorrection.focus();
				else fields.get(Object.keys(checked.errors)[0])?.input?.focus();
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
				feedback(
					validate(gameId, draft, configurationSchema, participantCountSchema, configurationContext)
						.errors,
				);
		});
		C.enhance(form);
		B.enhance(form);
		return form;
	}
	window.SGGGameConfiguration = Object.freeze({
		defaults,
		validate,
		resizeStructuredDraft,
		mount,
		key,
	});
})();

/* Presentation of explicit authorized stages. No session inference, commands or advancement. */
(() => {
	"use strict";
	const installed = new WeakMap(),
		activeHosts = new Set();
	const typeIcon = Object.freeze({
		social: "social-step",
		game: "game-step",
		questionnaire: "questionnaire-step",
		end: "check",
	});
	const motion = (node, from, to, options) => {
		node.style.transform = to.transform;
		node.style.opacity = to.opacity;
		window.SGGMotion?.run(node, [from, to], options);
	};
	function remove(host) {
		const state = installed.get(host);
		if (!state) return;
		for (const item of [...state.items.values(), ...state.segments.values(), state.focus])
			window.SGGMotion?.cancel(item);
		state.unsubscribe?.();
		state.route.remove();
		installed.delete(host);
		activeHosts.delete(host);
	}
	function render(
		host,
		{
			nodes,
			currentId,
			label = window.SGGI18n?.t("ui.route.label") ?? "Session progress",
			limit = 5,
			before,
			after,
			currentPosition,
			totalCount,
			event,
			immediate = false,
		} = {},
	) {
		if (!host || !Array.isArray(nodes))
			throw Error("Stage route requires host and explicit authorized nodes");
		if (
			nodes.some(
				(n) =>
					!n.id ||
					!n.label ||
					!typeIcon[n.type] ||
					!["past", "current", "upcoming"].includes(n.state),
			) ||
			new Set(nodes.map((n) => n.id)).size !== nodes.length
		)
			throw Error("Invalid authorized stage node");
		const current = nodes.findIndex((n) => n.id === currentId && n.state === "current");
		if (current < 0 || nodes.filter((n) => n.state === "current").length !== 1)
			throw Error("Stage route requires exactly one declared current node");
		const count = Math.min(nodes.length, 5, Math.max(3, Math.floor(limit) || 5));
		const start = Math.min(
			Math.max(0, current - Math.floor(count / 2)),
			Math.max(0, nodes.length - count),
		);
		const bounded =
			before !== undefined ||
			after !== undefined ||
			currentPosition !== undefined ||
			totalCount !== undefined;
		const visible = nodes.slice(start, start + count),
			left = start > 0 || before === "more",
			right = start + count < nodes.length || after === "more";
		let state = installed.get(host);
		const fresh = !state;
		if (fresh) {
			const route = document.createElement("ol"),
				rail = document.createElement("span"),
				focus = document.createElement("span");
			route.className = "sg-stage-route";
			rail.className = "sg-stage-track";
			focus.className = "sg-stage-focus";
			for (const n of [rail, focus]) {
				n.setAttribute("aria-hidden", "true");
				n.setAttribute("role", "presentation");
			}
			route.append(rail, focus);
			host.append(route);
			state = { route, rail, focus, items: new Map(), segments: new Map(), currentId: null };
			state.unsubscribe = window.SGGMotion?.onSettle(() => route.setAttribute("data-instant", ""));
			installed.set(host, state);
			activeHosts.add(host);
		}
		const { route, rail, focus, items, segments } = state;
		route.toggleAttribute(
			"data-instant",
			fresh || immediate || Boolean(window.SGGMotion?.instant(event)),
		);
		route.setAttribute("aria-label", label);
		route.dataset.hasBefore = String(left);
		route.dataset.hasAfter = String(right);
		route.dataset.currentId = currentId;
		route.dataset.windowStart = String(start);
		route.dataset.routeLength = bounded ? (totalCount ?? "unknown") : String(nodes.length);
		route.dataset.boundaryBefore = before ?? "boundary";
		route.dataset.boundaryAfter = after ?? "boundary";
		route.style.setProperty("--sg-route-count", count);
		const css = getComputedStyle(route),
			pitch = parseFloat(css.getPropertyValue("--sg-route-pitch")),
			marker = parseFloat(css.getPropertyValue("--sg-route-marker"));
		const oldFocus = getComputedStyle(focus).transform,
			direction =
				currentPosition !== undefined && state.currentPosition !== undefined
					? BigInt(currentPosition) >= BigInt(state.currentPosition)
						? 1
						: -1
					: current >= (state.currentIndex ?? current)
						? 1
						: -1;
		const nextIds = new Set(visible.map((n) => n.id));
		for (const [id, item] of items)
			if (!nextIds.has(id)) {
				window.SGGMotion?.cancel(item);
				item.remove();
				items.delete(id);
			}
		visible.forEach((node, slot) => {
			let item = items.get(node.id);
			const entering = !item;
			const from = item
				? { transform: getComputedStyle(item).transform, opacity: getComputedStyle(item).opacity }
				: null;
			if (!item) {
				item = document.createElement("li");
				item.dataset.stageId = node.id;
				const glyph = document.createElement("span");
				glyph.className = "sg-stage-marker";
				glyph.setAttribute("aria-hidden", "true");
				item.append(glyph);
				items.set(node.id, item);
			}
			if (item.dataset.stageType !== node.type) {
				item.firstElementChild.replaceChildren(SGGIcons.create(typeIcon[node.type]));
				item.dataset.stageType = node.type;
			}
			item.dataset.stageState = node.state;
			item.toggleAttribute("data-stage-conditional", Boolean(node.conditional));
			item.setAttribute(
				"aria-label",
				node.label +
					", " +
					(window.SGGI18n?.t("ui.route." + node.state) ?? node.state) +
					(node.conditional
						? ", " + (window.SGGI18n?.t("ui.route.conditional") ?? "Conditional")
						: ""),
			);
			if (bounded && node.position === undefined) item.removeAttribute("aria-posinset");
			else item.setAttribute("aria-posinset", bounded ? node.position : String(start + slot + 1));
			item.setAttribute("aria-setsize", bounded ? (totalCount ?? "-1") : String(nodes.length));
			if (node.state === "current") item.setAttribute("aria-current", "step");
			else item.removeAttribute("aria-current");
			const opacity = (slot === 0 && left) || (slot === count - 1 && right) ? 0.42 : 1;
			const to = { transform: `translate3d(${slot * pitch}px,0,0)`, opacity: String(opacity) };
			route.append(item);
			if (fresh) {
				item.style.transform = to.transform;
				item.style.opacity = to.opacity;
			} else
				motion(
					item,
					from || { transform: `translate3d(${(slot + direction) * pitch}px,0,0)`, opacity: 0 },
					to,
					{ role: entering ? "enter" : "state", event, immediate },
				);
		});
		const edgeIds = new Set();
		visible.slice(1).forEach((node, slot) => {
			const key = JSON.stringify([visible[slot].id, node.id]);
			edgeIds.add(key);
			let segment = segments.get(key);
			const entering = !segment;
			const from = segment
				? {
						transform: getComputedStyle(segment).transform,
						opacity: getComputedStyle(segment).opacity,
					}
				: null;
			if (!segment) {
				segment = document.createElement("span");
				segment.className = "sg-stage-segment";
				segment.setAttribute("aria-hidden", "true");
				segment.dataset.from = visible[slot].id;
				segment.dataset.to = node.id;
				rail.append(segment);
				segments.set(key, segment);
			}
			segment.dataset.stageState =
				node.state === "past" || node.state === "current" ? "past" : "upcoming";
			const width = Math.max(0, pitch - marker),
				x = slot * pitch + marker;
			const to = { transform: `translate3d(${x}px,0,0) scaleX(${width})`, opacity: "1" };
			if (fresh) {
				segment.style.transform = to.transform;
				segment.style.opacity = to.opacity;
			} else
				motion(
					segment,
					from || {
						transform: `translate3d(${x + direction * pitch}px,0,0) scaleX(${width})`,
						opacity: 0,
					},
					to,
					{ role: entering ? "enter" : "state", event, immediate },
				);
		});
		for (const [key, segment] of segments)
			if (!edgeIds.has(key)) {
				window.SGGMotion?.cancel(segment);
				segment.remove();
				segments.delete(key);
			}
		const focusTo = { transform: `translate3d(${(current - start) * pitch}px,0,0)`, opacity: "1" };
		if (fresh) {
			focus.style.transform = focusTo.transform;
			focus.style.opacity = "1";
		} else
			motion(focus, { transform: oldFocus, opacity: 1 }, focusTo, {
				role: "state",
				event,
				immediate,
			});
		state.currentId = currentId;
		state.currentIndex = current;
		state.currentPosition = currentPosition;
		state.definition = {
			nodes,
			currentId,
			label,
			limit,
			before,
			after,
			currentPosition,
			totalCount,
		};
		return route;
	}
	window.addEventListener(
		"resize",
		() => {
			for (const host of activeHosts) {
				const state = installed.get(host);
				if (!host.isConnected) {
					remove(host);
					continue;
				}
				render(host, { ...state.definition, immediate: true });
			}
		},
		{ passive: true },
	);
	window.addEventListener("pagehide", () => {
		for (const host of activeHosts) {
			const state = installed.get(host);
			state.route.setAttribute("data-instant", "");
			for (const n of [...state.items.values(), ...state.segments.values(), state.focus])
				window.SGGMotion?.cancel(n);
		}
	});
	window.SGGStageRoute = Object.freeze({ render, remove });
})();

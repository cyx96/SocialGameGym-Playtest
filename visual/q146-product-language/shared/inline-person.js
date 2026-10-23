/* Product-wide identity text. Only explicit authorised IDs may resolve to names. */
(() => {
	"use strict";
	const settings = { avatars: true, order: "at-name-avatar" };
	const element = (tag, cls, text) => {
		const n = document.createElement(tag);
		if (cls) n.className = cls;
		if (text != null) n.textContent = String(text);
		return n;
	};
	const localized = (n, key, live = true) => {
		n.dataset.sgCopy = key;
		if (live) SGGI18n.bind(n, key);
		else n.textContent = SGGI18n.t(key);
		return n;
	};
	const resolve = (id, identities) => {
		const value = identities && Object.hasOwn(identities, id) ? identities[id] : null;
		return typeof value?.name === "string" && value.name ? value : null;
	};
	function label(
		id,
		identities,
		{
			mention = false,
			viewerId,
			selfMarker = false,
			avatar = settings.avatars,
			order = settings.order,
			live = true,
		} = {},
	) {
		const value = resolve(id, identities);
		if (!value) return localized(element("span", "sg-person-unknown"), "asset.unknownPerson", live);
		if (mention && id === viewerId)
			return localized(element("span", "sg-person-self"), "asset.you", live);
		const n = element(
			mention ? "button" : "span",
			mention ? "sg-person-mention sg-person-link" : "sg-person-name",
		);
		n.dataset.person = id;
		if (mention) {
			n.type = "button";
			n.dataset.sgProfilePerson = id;
			n.dataset.sgPersonName = value.name;
			if (live)
				SGGI18n.bind(n, "asset.personProfile", {
					attr: "aria-label",
					values: { name: value.name },
				});
			else n.setAttribute("aria-label", SGGI18n.t("asset.personProfile", { name: value.name }));
		}
		if (mention && avatar && window.SGGAvatar) {
			n.classList.add("sg-person-inline");
			n.dataset.personOrder = order;
			const at = element("span", "sg-person-at", "@"),
				name = element("span", "sg-person-visible-name", value.name),
				image = SGGAvatar.node({ preset: value.avatar || "default", size: "message", person: id });
			at.setAttribute("aria-hidden", "true");
			if (order === "at-name-avatar") {
				const text = element("span", "sg-person-text");
				const graphemes =
					typeof Intl.Segmenter === "function"
						? Array.from(
								new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
									name.textContent,
								),
								(part) => part.segment,
							)
						: Array.from(name.textContent);
				const final = graphemes.pop() || "";
				name.textContent = graphemes.join("");
				const tail = element("span", "sg-person-tail");
				tail.append(element("span", "sg-person-visible-name", final), image);
				text.append(at, name);
				n.append(text, tail);
			} else if (order === "avatar-at-name") {
				const text = element("span", "sg-person-text");
				text.append(at, name);
				n.append(image, text);
			} else {
				n.append(at, image, name);
			}
		} else {
			if (mention) {
				const at = element("span", "sg-person-at", "@");
				at.setAttribute("aria-hidden", "true");
				n.append(at);
			}
			n.append(document.createTextNode(value.name));
		}
		if (!mention && selfMarker && id === viewerId)
			n.append(localized(element("span", "sg-person-you"), "asset.you", live));
		return n;
	}

	function person(id, identities, options = {}) {
		return label(id, identities, { ...options, mention: true });
	}
	function render(
		root,
		parts,
		{ identities, viewerId, avatar = settings.avatars, order = settings.order } = {},
	) {
		root.replaceChildren();
		for (const part of parts) {
			if (part && typeof part === "object") {
				if (typeof part.personId !== "string")
					throw new TypeError("Person part requires an explicit ID");
				root.append(person(part.personId, identities, { viewerId, avatar, order }));
			} else root.append(document.createTextNode(String(part ?? "")));
		}
		return root;
	}
	function replace(root, text, { personId, identities, viewerId } = {}) {
		if (!resolve(personId, identities)) {
			root.textContent = text;
			return;
		}
		const parts = String(text)
			.split("对方")
			.flatMap((part, i) => (i ? [{ personId }, part] : [part]));
		render(root, parts, { identities, viewerId });
	}
	function html(id, identities, options) {
		return label(id, identities, { ...options, live: false }).outerHTML;
	}
	function text(id, identities, options) {
		return label(id, identities, { ...options, live: false }).textContent;
	}
	let opener = null;
	document.addEventListener(
		"click",
		(event) => {
			const link =
				event.target instanceof Element
					? event.target.closest("button[data-sg-profile-person]")
					: null;
			if (!link || link.closest("[inert],[aria-hidden=true]")) return;
			event.preventDefault();
			event.stopPropagation();
			opener = link;
			const detail = { personId: link.dataset.sgProfilePerson, keyboard: event.detail === 0 };
			if (window.SessionApp)
				SessionApp.request("ui.open-profile", {
					target: detail.personId,
					keyboard: detail.keyboard,
				}).catch(() => {});
			else link.dispatchEvent(new CustomEvent("sgg:profile-request", { detail, bubbles: true }));
		},
		true,
	);
	addEventListener("message", (event) => {
		if (
			event.source === parent &&
			event.origin === new URL(document.baseURI).origin &&
			event.data?.channel === "q146-profile-return" &&
			opener?.isConnected
		)
			opener.focus({ preventScroll: true });
	});
	SGGI18n.subscribe(() => {
		// Serialized person HTML keeps explicit owned marker slots; names are verbatim.
		for (const slot of document.querySelectorAll(
			".sg-person-self,.sg-person-you,.sg-person-unknown",
		))
			SGGI18n.bind(
				slot,
				slot.classList.contains("sg-person-unknown") ? "asset.unknownPerson" : "asset.you",
			);
		for (const link of document.querySelectorAll(
			"button[data-sg-profile-person][data-sg-person-name]",
		))
			link.setAttribute(
				"aria-label",
				SGGI18n.t("asset.personProfile", { name: link.dataset.sgPersonName }),
			);
	});
	window.SGGInlinePerson = Object.freeze({
		label,
		person,
		render,
		replace,
		html,
		text,
		configure(options) {
			if (typeof options.avatars === "boolean") settings.avatars = options.avatars;
			if (["at-avatar-name", "avatar-at-name", "at-name-avatar"].includes(options.order))
				settings.order = options.order;
		},
	});
})();

(() => {
	const id = SGGIdentity;
	const codes = { 你: "self", 林: "lin", 许: "xu", 周: "zhou" };
	function migrate() {
		document.querySelectorAll(".avatar:not([data-identity-ready])").forEach((el) => {
			const text = el.textContent.trim();
			let who = window.SessionApp
				? el.closest(".avatar-row,.compose-copy,.newpost-byline")
					? SessionApp.context.viewer
					: null
				: el.closest(".avatar-row")
					? "self"
					: codes[text];
			const row = el.closest(".player");
			if (row) {
				if (row.classList.contains("vacant") || el.classList.contains("vacant")) return;
				who = {
					id: "seat-" + row.dataset.row,
					name: row.querySelector("strong")?.textContent || "玩家",
					family: "neutral",
				};
			}
			if (!who) return;
			const size = el.closest(".detail-head,.avatar-row")
				? "detail"
				: el.closest(".reply-item,.reply,.thread-reply")
					? "reply"
					: el.closest(".person")
						? "profile"
						: el.closest(".author")
							? "context"
							: el.closest(".compose-copy,.newpost-byline")
								? "reply"
								: "row";
			el.dataset.identityReady = "true";
			el.classList.add("identity-frame");
			el.innerHTML = id.avatar(who, size, row ? { family: "neutral" } : {});
			el.setAttribute("aria-hidden", "true");
		});
		document.querySelectorAll(".reply-avatar:not([data-identity-ready])").forEach((el) => {
			const who = codes[el.textContent.trim()];
			if (!who) return;
			el.dataset.identityReady = "true";
			el.classList.add("identity-frame");
			el.innerHTML = id.avatar(who, "reply");
		});
	}
	migrate();
	const targets = [document.querySelector(".feed"), document.querySelector("#roster")].filter(
		Boolean,
	);
	targets.forEach((target) =>
		new MutationObserver(() => migrate()).observe(target, { childList: true, subtree: true }),
	);
	// Selected profile-detail sample remains a visual sheet, with a real close action only.
	const close = document.querySelector(".sheet-toolbar [data-profile-close]"),
		sheet = document.querySelector("dialog.shade");
	if (sheet) {
		sheet.showModal();
		sheet.tabIndex = -1;
		sheet.focus({ preventScroll: true });
		if (close) close.onclick = () => sheet.close();
		sheet.addEventListener("click", (event) => {
			if (event.target === sheet) sheet.close();
		});
	}
	// Game task labels are slot identities. Never guess a hidden opponent's profile from generic “对方”.
	document.querySelectorAll(".neighbor>span:first-child").forEach((label) => {
		const text = label.textContent;
		label.classList.add("sg-identity", "neighbor-identity");
		label.innerHTML =
			id.avatar({ id: "slot-" + text, name: text, family: "neutral" }, "context") +
			'<span class="sg-name">' +
			id.escape(text) +
			"</span>";
	});
})();

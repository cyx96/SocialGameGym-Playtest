/* Explicit migration map for frozen A6 previews. New UI packages declare roles directly. */
(() => {
	const B = window.SGGButtons;
	const rules = [
		[
			".primary,.save,.config-done,.ready-button,.submit-newpost,.send-reply,.create-submit",
			"primary",
		],
		[
			".reading button,.site nav button,.phase .finish,.row-action,.add-more,.cancel,.edit,.change,.skip,.text-action,.reply-root,.reply-count,.reply-bottom,.close-inline,.edit-members,#retry-storage,.rules-link,#search-close,#room-library,#clear,.quiet.nav-back,#room-header button:not(#room-library)",
			"quiet",
		],
		[
			".native-back,.q62-back,.app-close,.icon-button,.close,.flip-return,#panel-close,#support-close,#search-toggle,.new-conversation",
			"icon",
		],
		[".send-message", "icon-primary"],
		[".menu button", "quiet"],
		[".follow", "soft"],
		[".filters button", "quiet"],
		[".stepper,button[data-step],button[data-quota-step]", "quiet"],
	];
	function migrate() {
		window.SGGControls?.enhance();
		for (const input of document.querySelectorAll(
			"textarea,input:not([type]),input[type=text],input[type=search],input[type=email],input[type=url]",
		)) {
			input.classList.add("sg-text-control");
			input.dataset.sgFieldAppearance = input.closest(
				".profile-fields,.input-frame,.composer-writing,.newpost-writing,.inline-editor,.search",
			)
				? "embedded"
				: "standalone";
		}
		for (const select of document.querySelectorAll("select"))
			select.classList.add("sg-select-control");
		for (const [selector, role] of rules)
			for (const b of document.querySelectorAll(selector)) {
				if (b.tagName !== "BUTTON") continue;
				b.dataset.sgButton = "";
				b.dataset.sgRole = role;
				if (
					b.matches(
						".submit-newpost,.send-reply,.create-submit,.dialog-head .ready-button,.app-toolbar .save,.sheet-toolbar .save,.editor-footer .primary",
					)
				)
					b.dataset.sgSize = "compact";
				if (b.matches("#panel-close") && !b.querySelector("svg"))
					b.innerHTML =
						'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
			}
		for (const group of document.querySelectorAll(".filters")) group.dataset.sgSegmented = "";
		for (const c of document.querySelectorAll(".choice-options")) c.classList.add("sg-choice");

		const icons = [
			[".native-back,.q62-back,.app-close,.quiet.nav-back", "back"],
			[".new-conversation", "compose"],
			[".close,.icon-button,#panel-close,#support-close,.flip-return", "close"],
			[".close-newpost,.close-inline,#close-editor", "chevron-down"],
			['.sheet-toolbar [aria-label="关闭玩家资料"]', "close"],
			["#search-toggle", document.body.classList.contains("search-open") ? "close" : "search"],
			[".edit,.change", "edit"],
			[".save", "check"],
			["[data-action=edit]", "settings"],
			["[data-action=menu]", "player-type"],
			["#config[data-mode=add] #config-submit", "check"],
			["#config[data-mode=edit] #config-submit", "check"],
			[".reply-root", "reply"],
			[".edit-members", "chevron-down"],
			[".send-message", "send"],
			[
				".reading button[data-support=rules],.reading button[data-panel=rules],.reading button[data-journey-reading=rules],.site nav [data-panel=rules]",
				"rules",
			],
			[
				".reading button[data-support=records],.reading button[data-panel=records],.reading button[data-journey-reading=records],.site nav [data-panel=records]",
				"records",
			],
			['button[data-step$=":-1"],button[data-quota-step="-1"],.stepper:first-child', "minus"],
			['button[data-step$=":1"],button[data-quota-step="1"],.stepper:last-child', "plus"],
		];
		// Old social headers have no binding attributes; these two labels are a migration-only lookup.
		for (const b of document.querySelectorAll(".reading button:not([aria-label])")) {
			const label = b.textContent.trim();
			if (label === "规则" || label === "记录")
				b.dataset.sgReading = label === "规则" ? "rules" : "records";
		}
		icons.push(
			[".reading button[data-sg-reading=rules]", "rules"],
			[".reading button[data-sg-reading=records]", "records"],
		);
		const selectedIcons = new Map();
		for (const [selector, name] of icons)
			for (const b of document.querySelectorAll(selector)) selectedIcons.set(b, name);
		for (const [b, name] of selectedIcons) {
			const label =
				name === "rules"
					? "游戏规则"
					: name === "records"
						? "游戏记录"
						: b.matches(".save")
							? "保存资料"
							: b.matches("#config-submit")
								? document.querySelector("#config").dataset.mode === "edit"
									? "保存配置"
									: "添加玩家"
								: b.matches("[data-action=menu]")
									? "选择玩家类型"
									: b.getAttribute("aria-label") || b.textContent.trim();
			if (label) B.iconize(b, { name, label });
		}
		for (const b of document.querySelectorAll("[data-action=copy]")) {
			const copied = b.textContent.trim() === "已复制";
			B.iconize(b, {
				name: copied ? "check" : "copy",
				label: b.textContent.trim() || b.getAttribute("aria-label"),
			});
			B.feedback(b, copied ? "confirmed" : "idle");
		}
		for (const b of document.querySelectorAll(".reply-count,.reply-bottom,.edit-members"))
			b.dataset.sgMotion = "disclosure";
		for (const b of document.querySelectorAll("[data-action=menu]")) b.dataset.sgMotion = "add";
		B.enhance();
	}
	migrate();
	new MutationObserver((records) => {
		if (records.some((r) => r.addedNodes.length)) migrate();
	}).observe(document.body, { childList: true, subtree: true });
})();

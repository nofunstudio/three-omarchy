const C = {
	fg: "#a3a5ad",
	dim: "#4b4d57",
	green: "#ff6a1a",
	white: "#f2f2f2",
};

const rule = "=".repeat(41);
const t = (s, color = C.fg) => [[s, color]];
const section = (title) => [t(rule, C.dim), t(title, C.white), t(rule, C.dim)];
const blank = () => [];

export function aboutLines() {
	return [
		[["$ ", C.green], ["nofun-debug --print --no-fun", C.fg]],
		t("Date: Tue Oct 06 14:02:11 2026"),
		t("Hostname: nofun"),
		t("No Fun Branch: main"),
		blank(),
		...section("SYSTEM INFORMATION"),
		t("Origin:"),
		t("  A terminal and Notion fucked."),
		t("  Then a magical side quest lets your agents render anything"),
		t("    in your own design language."),
		t("System:"),
		t("  Type: local-first agentic development environment base: Warp"),
		t("  Interface: Claude role: controlling interface"),
		t("Workers:"),
		t("  Coding agents, tools, and subscriptions become workers behind it."),
		t("  Agents: claude codex muse cursor (paused)"),
		t("Rendering:"),
		t("  Text stays primary."),
		t("  Rich interfaces appear only when information deserves pixels."),
		blank(),
		...section("DMESG"),
		t("(skipped - --no-fun flag used)"),
		blank(),
		...section("JOURNALCTL (CURRENT BOOT, WARNINGS+ERRORS)"),
		t("Oct 06 13:48:02 nofun claude: fleet ready: claude codex muse; cursor paused"),
		blank(),
		...section("INSTALLED PACKAGES"),
		t("warp 2026.10.01 (terminal)"),
		t("claude-code 2.1.289 (controller)"),
		t("codex-cli 0.158.0 (worker)"),
		t("muse-code 1.4.3 (worker)"),
	];
}

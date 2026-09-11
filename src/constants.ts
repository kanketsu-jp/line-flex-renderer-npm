/**
 * 色を指定していないテキストの既定色。
 *
 * 🚨 これが無いと inline style の `color` が空になり、**ホストページの文字色を継承する**。
 *    吹き出しの背景は `#ffffff` 固定（`FlexMessagePreview`）なので、
 *    ダークモードのページに置くと**白地に白**で読めなくなる。
 *
 * 🚨 LINE 公式ドキュメントに「text の color の既定値」は**書かれていない**
 *    （2026-09-12 実測: `docs/messaging-api/flex-message-elements` の EN / JA と
 *      `reference/messaging-api` を当たって 0 件。検索でも例示の hex だけで既定の明記なし）。
 *    そのため値は **この package 自身の慣習**に合わせている
 *    ——`LineTextBubble`（LINE のプレーンな吹き出し）が使っていたものと同じ値。
 *    `FlexSeparator`（`#E5E5E5`）や `FlexButton`（`#17C950` / `#42659A`）と同じく、
 *    既定は `??` でここに置く。
 */
export const DEFAULT_TEXT_COLOR = "#111111";

export const TEXT_SIZE: Record<string, string> = {
	xxs: "11px",
	xs: "12px",
	sm: "13px",
	md: "14px",
	lg: "16px",
	xl: "18px",
	xxl: "22px",
	"3xl": "26px",
	"4xl": "30px",
	"5xl": "36px",
};

export const SPACING: Record<string, string> = {
	none: "0px",
	xs: "2px",
	sm: "4px",
	md: "8px",
	lg: "12px",
	xl: "16px",
	xxl: "20px",
};

export const IMAGE_SIZE: Record<string, string> = {
	xxs: "40px",
	xs: "60px",
	sm: "80px",
	md: "100px",
	lg: "120px",
	xl: "150px",
	xxl: "180px",
	"3xl": "220px",
	"4xl": "260px",
	"5xl": "300px",
	full: "100%",
};

export const ICON_SIZE: Record<string, string> = {
	xxs: "14px",
	xs: "16px",
	sm: "18px",
	md: "20px",
	lg: "24px",
	xl: "28px",
	xxl: "32px",
};

export const BUBBLE_WIDTH: Record<string, string> = {
	nano: "120px",
	micro: "150px",
	kilo: "230px",
	mega: "300px",
	giga: "386px",
};

import type React from "react";
import { TEXT_SIZE } from "../constants";
import type { FlexSpan } from "../types";
import { resolveSize } from "../utils";

/**
 * 🚨 ここに既定色（`?? DEFAULT_TEXT_COLOR`）を置いてはいけない。
 *    span は必ず `FlexTextComponent` の `<p>` の中にあり（この component は
 *    `src/index.ts` から公開していない）、その `<p>` は色を必ず持つ。
 *    ここで既定を当てると、**親の text に指定した色を span が上書きする**。
 *    ⇒ 色未指定の span は inline color を持たず、親から継承させる。
 *    見張り: `src/__tests__/FlexTextColor.test.tsx`「span は色未指定なら inline color を持たない」
 */
export function FlexSpanComponent({ span }: { span: FlexSpan }) {
	const style: React.CSSProperties = {
		fontSize: resolveSize(span.size, TEXT_SIZE, "inherit"),
		color: span.color,
		fontWeight: span.weight === "bold" ? 700 : undefined,
		textDecoration: span.decoration !== "none" ? span.decoration : undefined,
		fontStyle: span.style,
	};
	return <span style={style}>{span.text}</span>;
}

import type React from "react";
import { useEffect, useState } from "react";

/** ref の要素の幅を ResizeObserver で観測し、breakpoint 未満なら true。
 *  ResizeObserver が無い環境（SSR / jsdom）では常に false を返し、例外を投げない。 */
export function useIsNarrow(
	ref: React.RefObject<HTMLElement | null>,
	breakpoint: number,
): boolean {
	const [isNarrow, setIsNarrow] = useState<boolean>(false);

	useEffect(() => {
		if (typeof ResizeObserver === "undefined" || ref.current == null) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			if (entries.length > 0) {
				setIsNarrow(entries[0].contentRect.width < breakpoint);
			}
		});

		observer.observe(ref.current);

		return () => {
			observer.disconnect();
		};
	}, [ref, breakpoint]);

	return isNarrow;
}

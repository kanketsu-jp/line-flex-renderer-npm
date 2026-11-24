import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ensureSection } from "../../../editor/path";
import type { FlexNodePath } from "../../../editor/types";
import type { FlexBubble } from "../../../types";
import { InteractiveTree } from "../core/InteractiveTree";
import type { useFlexDoc } from "../core/useFlexDoc";

/**
 * 統合エディタ（FlexWysiwygEditor）用の共有基盤。
 *
 * - useContainerWidth / useContainerLayout: コンテナクエリ（vw 非依存）
 *   呼び出し側のコンテナ幅でレイアウトを切替える
 * - MobilePreview: InteractiveTree の簡易ラップ
 *
 * 旧モバイル案（M1〜M6）専用部品は統合に伴い削除済み。
 */

const ContainerWidthContext = createContext<number>(390);

export function useContainerWidth(): number {
	return useContext(ContainerWidthContext);
}

/** コンテナ幅に応じたレイアウト判定 */
export function useContainerLayout(): {
	width: number;
	compact: boolean; // < 360
	narrow: boolean; // < 480（SP 相当）
} {
	const width = useContainerWidth();
	return { width, compact: width < 360, narrow: width < 480 };
}

/** コンテナ幅を測定して子へ供給するシェル */
export function ContainerQueryShell({
	children,
	className,
	style,
}: {
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(390);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setContainerWidth(entry.contentRect.width);
			}
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	return (
		<div
			ref={ref}
			className={className}
			style={{ ...style, position: "relative" }}
		>
			<ContainerWidthContext.Provider value={containerWidth}>
				{children}
			</ContainerWidthContext.Provider>
		</div>
	);
}

/** 簡易プレビュー（インタラクション付き）。width 未指定ならコンテナいっぱい（maxWidth は bubble 実幅） */
export function MobilePreview({
	doc,
	width = "100%",
	onSlotClick,
}: {
	doc: ReturnType<typeof useFlexDoc>;
	width?: number | string;
	onSlotClick?: (parentPath: FlexNodePath, index: number) => void;
}) {
	return (
		<InteractiveTree
			doc={doc}
			width={width}
			onSlotClick={onSlotClick}
			onAddSection={(s) => doc.replace(ensureSection(doc.bubble, s))}
		/>
	);
}

export type { FlexBubble };

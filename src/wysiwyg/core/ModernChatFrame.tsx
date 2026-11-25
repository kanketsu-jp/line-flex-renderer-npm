import type React from "react";

/**
 * 現行 LINE アプリ（2024+ のデザイン）に寄せたトークフレーム。
 * - 白ヘッダー + 戻る矢印 + アカウント名
 * - 薄グレーの背景
 * - 受信吹き出し（相手側）
 *
 * プロトタイプ用。採用されれば LineChatFrame の v2 として本実装に昇格。
 */

export interface ModernChatFrameProps {
	children: React.ReactNode;
	accountName?: string;
	avatarUrl?: string;
	width?: number;
	height?: number;
	/** 下部に日付ラベルを表示するか */
	showDateDivider?: boolean;
}

export function ModernChatFrame({
	children,
	accountName = "お知らせBOT",
	avatarUrl,
	width = 360,
	height = 560,
	showDateDivider = true,
}: ModernChatFrameProps) {
	return (
		<div
			style={{
				width,
				height,
				borderRadius: 18,
				overflow: "hidden",
				boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
				display: "flex",
				flexDirection: "column",
				backgroundColor: "#F4F5F7",
				fontFamily:
					'-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif',
				border: "1px solid rgba(0,0,0,0.06)",
			}}
		>
			{/* ヘッダー（現行は白背景） */}
			<div
				style={{
					backgroundColor: "#FFFFFF",
					padding: "10px 12px",
					display: "flex",
					alignItems: "center",
					gap: 10,
					borderBottom: "1px solid rgba(0,0,0,0.06)",
					flexShrink: 0,
				}}
			>
				<svg
					width={20}
					height={20}
					viewBox="0 0 24 24"
					fill="none"
					stroke="#1F2328"
					strokeWidth={2}
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-label="戻る"
				>
					<path d="M15 18l-6-6 6-6" />
				</svg>
				{avatarUrl ? (
					<img
						src={avatarUrl}
						alt=""
						style={{
							width: 30,
							height: 30,
							borderRadius: "50%",
							objectFit: "cover",
						}}
					/>
				) : (
					<div
						style={{
							width: 30,
							height: 30,
							borderRadius: "50%",
							backgroundColor: "#06C755",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "#fff",
							fontSize: 10,
							fontWeight: 700,
						}}
					>
						BOT
					</div>
				)}
				<span style={{ fontSize: 14, fontWeight: 600, color: "#1F2328" }}>
					{accountName}
				</span>
			</div>

			{/* チャット領域 */}
			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "14px 10px",
					display: "flex",
					flexDirection: "column",
					gap: 8,
					backgroundColor: "#F4F5F7",
				}}
			>
				{showDateDivider && (
					<div
						style={{
							alignSelf: "center",
							backgroundColor: "rgba(0,0,0,0.24)",
							color: "#fff",
							fontSize: 10,
							fontWeight: 600,
							borderRadius: 999,
							padding: "2px 10px",
							marginBottom: 4,
						}}
					>
						11月14日(土)
					</div>
				)}
				<div
					style={{
						display: "flex",
						alignItems: "flex-start",
						gap: 8,
					}}
				>
					{avatarUrl ? (
						<img
							src={avatarUrl}
							alt=""
							style={{
								width: 32,
								height: 32,
								borderRadius: "50%",
								objectFit: "cover",
								flexShrink: 0,
								marginTop: 2,
							}}
						/>
					) : (
						<div
							style={{
								width: 32,
								height: 32,
								borderRadius: "50%",
								backgroundColor: "#06C755",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
								marginTop: 2,
								color: "#fff",
								fontSize: 9,
								fontWeight: 700,
							}}
						>
							BOT
						</div>
					)}
					<div style={{ maxWidth: "calc(100% - 44px)", minWidth: 0 }}>
						{children}
					</div>
				</div>
			</div>

			{/* 入力バー（装飾） */}
			<div
				style={{
					backgroundColor: "#FFFFFF",
					padding: "8px 10px",
					display: "flex",
					alignItems: "center",
					gap: 8,
					borderTop: "1px solid rgba(0,0,0,0.06)",
					flexShrink: 0,
				}}
			>
				<div
					style={{
						flex: 1,
						backgroundColor: "#F2F3F5",
						borderRadius: 18,
						padding: "8px 14px",
						fontSize: 13,
						color: "#9AA0A6",
					}}
				>
					メッセージ
				</div>
				<svg width={22} height={22} viewBox="0 0 24 24" aria-label="送信">
					<circle cx="12" cy="12" r="11" fill="#06C755" />
					<path
						d="M7 12l3.5 3.5L17 9"
						stroke="#fff"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						fill="none"
					/>
				</svg>
			</div>
		</div>
	);
}

import type React from "react";

export interface LineChatFrameProps {
	children: React.ReactNode;
	/** トーク画面のヘッダー名（デフォルト: "トーク"） */
	accountName?: string;
	/** アバター画像 URL（未指定時は緑の BOT アイコン） */
	avatarUrl?: string;
	/** フレーム幅（デフォルト: 375） */
	width?: number;
}

function DefaultAvatar() {
	return (
		<div
			style={{
				width: 36,
				height: 36,
				borderRadius: "50%",
				backgroundColor: "#00B900",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flexShrink: 0,
				color: "#fff",
				fontSize: 11,
				fontWeight: 700,
			}}
		>
			BOT
		</div>
	);
}

export function LineChatFrame({
	children,
	accountName = "トーク",
	avatarUrl,
	width = 375,
}: LineChatFrameProps) {
	return (
		<div
			style={{
				width,
				minHeight: 500,
				borderRadius: 12,
				overflow: "hidden",
				boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
				display: "flex",
				flexDirection: "column",
				fontFamily:
					'-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Arial, sans-serif',
			}}
		>
			{/* Header bar */}
			<div
				style={{
					backgroundColor: "#00B900",
					color: "#fff",
					padding: "12px 16px",
					fontSize: 16,
					fontWeight: 700,
					display: "flex",
					alignItems: "center",
					gap: 8,
				}}
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					role="img"
					aria-label="Back"
				>
					<path d="M15 18l-6-6 6-6" />
				</svg>
				<span>{accountName}</span>
			</div>

			{/* Chat area */}
			<div
				style={{
					backgroundColor: "#7B9EB0",
					flex: 1,
					padding: "16px 12px",
					display: "flex",
					flexDirection: "column",
					gap: 8,
				}}
			>
				{/* Message row */}
				<div
					style={{
						display: "flex",
						alignItems: "flex-end",
						gap: 8,
					}}
				>
					{avatarUrl ? (
						<img
							src={avatarUrl}
							alt=""
							style={{
								width: 36,
								height: 36,
								borderRadius: "50%",
								objectFit: "cover",
								flexShrink: 0,
							}}
						/>
					) : (
						<DefaultAvatar />
					)}
					<div style={{ maxWidth: "calc(100% - 52px)" }}>{children}</div>
				</div>
			</div>

			{/* Input bar */}
			<div
				style={{
					backgroundColor: "#F7F7F7",
					padding: "10px 12px",
					display: "flex",
					alignItems: "center",
					gap: 8,
					borderTop: "1px solid #E0E0E0",
				}}
			>
				<div
					style={{
						flex: 1,
						backgroundColor: "#fff",
						borderRadius: 20,
						padding: "8px 14px",
						fontSize: 14,
						color: "#999",
					}}
				>
					Aa
				</div>
			</div>
		</div>
	);
}

import type React from "react";
import { useRef, useState } from "react";
import { TextField } from "../../editor/fields";
import { font, w } from "./theme";

/**
 * 画像アップロード フィールド（WYSIWYG 用）。
 *
 * - ファイル選択 / ドラッグ&ドロップで画像を指定
 * - onUpload があればホストのアップローダ（例: S3 へ上げて URL を返す）を使用
 * - onUpload がなければ data URL にして即プレビュー（オフライン体験）。
 *   ※ data URL は LINE API で送信できないため、注意書きを表示
 * - 「URL で直接指定」は詳細設定として折りたたみで残す
 */

export interface ImageUploadFieldProps {
	/** 現在の url（空文字可） */
	value?: string;
	/** url を確定させる（patch 側へ渡す） */
	onUrlChange: (url: string) => void;
	/** ホスト側アップローダ。File を受け取り公開 URL を返す */
	onUpload?: (file: File) => Promise<string>;
}

const MAX_SIZE_MB = 10;

export function ImageUploadField({
	value,
	onUrlChange,
	onUpload,
}: ImageUploadFieldProps): React.ReactElement {
	const inputRef = useRef<HTMLInputElement>(null);
	// アップロード完了時には「開始時でなく最新」の onUrlChange を呼ぶ（NM2:
	// 保留中に選択が変わった/消えた場合、最新のハンドラが正しくガードできる）
	const onUrlChangeRef = useRef(onUrlChange);
	onUrlChangeRef.current = onUrlChange;
	const [dragging, setDragging] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const isDataUrl = value?.startsWith("data:");

	const readFileAsDataUrl = (file: File) =>
		new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () =>
				reject(new Error("ファイルを読み込めませんでした"));
			reader.readAsDataURL(file);
		});

	const handleFile = async (file: File | undefined) => {
		if (!file) return;
		setError(null);
		if (!file.type.startsWith("image/")) {
			setError("画像ファイルを選んでください");
			return;
		}
		if (file.size > MAX_SIZE_MB * 1024 * 1024) {
			setError(`ファイルサイズは ${MAX_SIZE_MB}MB までです`);
			return;
		}
		setBusy(true);
		try {
			const url = onUpload
				? await onUpload(file)
				: await readFileAsDataUrl(file);
			setFileName(file.name);
			onUrlChangeRef.current(url);
		} catch (e) {
			setError(e instanceof Error ? e.message : "アップロードに失敗しました");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div style={{ fontFamily: font }}>
			{/* ドロップゾーン */}
			{/* biome-ignore lint/a11y/useSemanticElements: ドロップ受付＋プレビュー表示を兼ねる領域のため div+role */}
			<div
				role="button"
				tabIndex={0}
				aria-label="画像をアップロード"
				onClick={() => inputRef.current?.click()}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
				}}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					handleFile(e.dataTransfer.files?.[0]);
				}}
				style={{
					border: `2px dashed ${dragging || busy ? w.green : w.border}`,
					borderRadius: 10,
					backgroundColor: dragging ? w.greenSoft : w.panelBg,
					padding: value ? 10 : "22px 12px",
					textAlign: "center",
					cursor: busy ? "wait" : "pointer",
					transition: "all .15s ease",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 6,
				}}
			>
				{value ? (
					<>
						<img
							src={value}
							alt="選択した画像のプレビュー"
							style={{
								maxHeight: 140,
								maxWidth: "100%",
								objectFit: "contain",
								borderRadius: 6,
							}}
						/>
						<span
							style={{ fontSize: 11, color: w.subText, wordBreak: "break-all" }}
						>
							{fileName ?? "現在の画像"} — クリックで変更
						</span>
					</>
				) : (
					<>
						<span style={{ fontSize: 26 }}>🖼</span>
						<span style={{ fontSize: 12, fontWeight: 700, color: w.text }}>
							画像をアップロード
						</span>
						<span style={{ fontSize: 11, color: w.subText }}>
							クリックして選択、またはここにドロップ
						</span>
					</>
				)}
				{busy && (
					<span style={{ fontSize: 11, color: w.green, fontWeight: 700 }}>
						アップロード中…
					</span>
				)}
			</div>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				hidden
				onChange={(e) => {
					handleFile(e.target.files?.[0]);
					e.target.value = ""; // 同じファイルを再選択可能に
				}}
			/>

			{error && (
				<p
					role="alert"
					style={{ fontSize: 11, color: w.danger, margin: "6px 0 0" }}
				>
					{error}
				</p>
			)}
			{isDataUrl && (
				<p style={{ fontSize: 11, color: w.subText, margin: "6px 0 0" }}>
					⚠ 一時的な埋め込み画像です。送信前に公開 URL へ差し替えてください
					（onUpload で自動化できます）
				</p>
			)}

			{/* URL 直指定は詳細設定として残す */}
			<details style={{ marginTop: 8 }}>
				<summary
					style={{
						fontSize: 11,
						color: w.subText,
						cursor: "pointer",
						userSelect: "none",
					}}
				>
					URL で直接指定する
				</summary>
				<div style={{ marginTop: 6 }}>
					<TextField
						label="画像URL（https://）"
						placeholder="https://example.com/image.png"
						value={isDataUrl ? "" : (value ?? "")}
						onChange={(v) => onUrlChange(v.trim() === "" ? "" : v)}
					/>
				</div>
			</details>
		</div>
	);
}

import type { EditorTemplate } from "./types";

export const defaultTemplates: EditorTemplate[] = [
	{
		id: "notice",
		name: "お知らせ",
		description: "見出しと本文だけのシンプルなお知らせ",
		bubble: {
			type: "bubble",
			header: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "text",
						text: "重要なお知らせ",
						weight: "bold",
						size: "lg",
						color: "#06C755",
					},
				],
			},
			body: {
				type: "box",
				layout: "vertical",
				spacing: "md",
				contents: [
					{
						type: "text",
						text: "システムメンテナンスのお知らせ",
						weight: "bold",
						size: "md",
						color: "#111111",
						wrap: true,
					},
					{
						type: "text",
						text: "いつもサービスをご利用いただきありがとうございます。下記の日程でシステムメンテナンスを実施いたします。ご不便をおかけしますが、ご理解のほどよろしくお願いいたします。",
						size: "sm",
						color: "#666666",
						wrap: true,
					},
					{
						type: "separator",
						margin: "lg",
						color: "#E5E5E5",
					},
					{
						type: "box",
						layout: "vertical",
						margin: "md",
						spacing: "sm",
						contents: [
							{
								type: "text",
								text: "日時: 2026年9月15日(火) 02:00〜06:00",
								size: "xs",
								color: "#888888",
								wrap: true,
							},
							{
								type: "text",
								text: "影響: メンテナンス中はすべてのサービスが停止します",
								size: "xs",
								color: "#888888",
								wrap: true,
							},
						],
					},
				],
			},
		},
	},
	{
		id: "coupon",
		name: "クーポン",
		description: "画像・割引・利用ボタンつきのクーポン",
		bubble: {
			type: "bubble",
			hero: {
				type: "image",
				url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png",
				size: "full",
				aspectRatio: "20:13",
				aspectMode: "cover",
			},
			body: {
				type: "box",
				layout: "vertical",
				spacing: "md",
				contents: [
					{
						type: "text",
						text: "特別ご優待クーポン",
						weight: "bold",
						size: "xl",
						color: "#111111",
					},
					{
						type: "text",
						text: "全品 20% OFF",
						weight: "bold",
						size: "3xl",
						color: "#06C755",
					},
					{
						type: "text",
						text: "お会計時にこの画面をスタッフにご提示ください。他クーポンとの併用はできません。",
						size: "sm",
						color: "#666666",
						wrap: true,
					},
					{
						type: "separator",
						margin: "lg",
						color: "#E5E5E5",
					},
					{
						type: "text",
						text: "有効期限: 2026年9月30日まで",
						size: "xs",
						color: "#888888",
						margin: "md",
					},
				],
			},
			footer: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						style: "primary",
						color: "#06C755",
						height: "md",
						action: {
							type: "uri",
							label: "クーポンを使う",
							uri: "https://example.com",
						},
					},
				],
			},
		},
	},
	{
		id: "product",
		name: "商品紹介",
		description: "商品写真と価格と購入ボタン",
		bubble: {
			type: "bubble",
			hero: {
				type: "image",
				url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_2_restaurant.png",
				size: "full",
				aspectRatio: "20:13",
				aspectMode: "cover",
			},
			body: {
				type: "box",
				layout: "vertical",
				spacing: "sm",
				contents: [
					{
						type: "text",
						text: "自家製ブレンドコーヒー",
						weight: "bold",
						size: "xl",
						color: "#111111",
						wrap: true,
					},
					{
						type: "text",
						text: "深煎りの香ばしさと豊かなコクが特徴のオリジナルブレンド。毎日の一杯におすすめです。",
						size: "sm",
						color: "#666666",
						wrap: true,
						margin: "md",
					},
					{
						type: "box",
						layout: "baseline",
						margin: "md",
						contents: [
							{
								type: "text",
								text: "¥1,200",
								weight: "bold",
								size: "xxl",
								color: "#111111",
							},
							{
								type: "text",
								text: "(税込)",
								size: "xs",
								color: "#888888",
								margin: "xs",
							},
						],
					},
				],
			},
			footer: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						style: "primary",
						color: "#06C755",
						height: "md",
						action: {
							type: "uri",
							label: "購入する",
							uri: "https://example.com",
						},
					},
				],
			},
		},
	},
	{
		id: "event",
		name: "イベント案内",
		description: "日時・場所と申し込みボタン",
		bubble: {
			type: "bubble",
			header: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "text",
						text: "イベント開催のお知らせ",
						weight: "bold",
						size: "md",
						color: "#06C755",
					},
				],
			},
			body: {
				type: "box",
				layout: "vertical",
				spacing: "md",
				contents: [
					{
						type: "text",
						text: "春のクラフト体験ワークショップ",
						weight: "bold",
						size: "xl",
						color: "#111111",
						wrap: true,
					},
					{
						type: "text",
						text: "初心者の方もお気軽にご参加いただけるものづくり体験です。道具はすべて会場でご用意します。",
						size: "sm",
						color: "#666666",
						wrap: true,
					},
					{
						type: "separator",
						margin: "lg",
						color: "#E5E5E5",
					},
					{
						type: "box",
						layout: "vertical",
						margin: "md",
						spacing: "sm",
						contents: [
							{
								type: "box",
								layout: "horizontal",
								spacing: "sm",
								contents: [
									{
										type: "text",
										text: "日時",
										size: "xs",
										color: "#888888",
										flex: 1,
									},
									{
										type: "text",
										text: "2026年10月10日(土) 14:00〜16:00",
										size: "xs",
										color: "#111111",
										flex: 4,
										wrap: true,
									},
								],
							},
							{
								type: "box",
								layout: "horizontal",
								spacing: "sm",
								contents: [
									{
										type: "text",
										text: "場所",
										size: "xs",
										color: "#888888",
										flex: 1,
									},
									{
										type: "text",
										text: "渋谷コミュニティセンター 3F",
										size: "xs",
										color: "#111111",
										flex: 4,
										wrap: true,
									},
								],
							},
							{
								type: "box",
								layout: "horizontal",
								spacing: "sm",
								contents: [
									{
										type: "text",
										text: "定員",
										size: "xs",
										color: "#888888",
										flex: 1,
									},
									{
										type: "text",
										text: "先着20名（要事前予約）",
										size: "xs",
										color: "#111111",
										flex: 4,
										wrap: true,
									},
								],
							},
						],
					},
				],
			},
			footer: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						style: "primary",
						color: "#06C755",
						height: "md",
						action: {
							type: "uri",
							label: "参加を申し込む",
							uri: "https://example.com",
						},
					},
				],
			},
		},
	},
	{
		id: "profile",
		name: "店舗紹介",
		description: "店舗の写真・住所・電話ボタン",
		bubble: {
			type: "bubble",
			hero: {
				type: "image",
				url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png",
				size: "full",
				aspectRatio: "20:13",
				aspectMode: "cover",
			},
			body: {
				type: "box",
				layout: "vertical",
				spacing: "md",
				contents: [
					{
						type: "text",
						text: "カフェ・ド・ボヌール",
						weight: "bold",
						size: "xl",
						color: "#111111",
					},
					{
						type: "text",
						text: "焼きたてのパンとハンドドリップ珈琲が自慢のカフェです。テラス席ではペットと同伴でご利用いただけます。",
						size: "sm",
						color: "#666666",
						wrap: true,
					},
					{
						type: "separator",
						margin: "lg",
						color: "#E5E5E5",
					},
					{
						type: "box",
						layout: "vertical",
						margin: "md",
						spacing: "sm",
						contents: [
							{
								type: "box",
								layout: "horizontal",
								spacing: "sm",
								contents: [
									{
										type: "text",
										text: "住所",
										size: "xs",
										color: "#888888",
										flex: 1,
									},
									{
										type: "text",
										text: "東京都渋谷区神南1-2-3",
										size: "xs",
										color: "#111111",
										flex: 4,
										wrap: true,
									},
								],
							},
							{
								type: "box",
								layout: "horizontal",
								spacing: "sm",
								contents: [
									{
										type: "text",
										text: "営業時間",
										size: "xs",
										color: "#888888",
										flex: 1,
									},
									{
										type: "text",
										text: "10:00〜19:00（水曜定休）",
										size: "xs",
										color: "#111111",
										flex: 4,
										wrap: true,
									},
								],
							},
						],
					},
				],
			},
			footer: {
				type: "box",
				layout: "vertical",
				contents: [
					{
						type: "button",
						style: "primary",
						color: "#06C755",
						height: "md",
						action: {
							type: "uri",
							label: "電話する",
							uri: "tel:0312345678",
						},
					},
				],
			},
		},
	},
];

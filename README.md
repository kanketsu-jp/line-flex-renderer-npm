# line-flex-message-renderer

React component to render LINE Flex Message JSON as a visual preview — pixel-accurate to the LINE app.

## Installation

```bash
npm install line-flex-message-renderer
# or
pnpm add line-flex-message-renderer
```

## Quick Start

```tsx
import { FlexMessagePreview, LineChatFrame } from 'line-flex-message-renderer';

const flexJson = {
  type: 'bubble',
  body: {
    type: 'box',
    layout: 'vertical',
    contents: [
      { type: 'text', text: 'Hello, World!', weight: 'bold', size: 'xl' },
    ],
  },
};

function App() {
  return (
    <LineChatFrame>
      <FlexMessagePreview json={flexJson} />
    </LineChatFrame>
  );
}
```

## Components

### FlexMessagePreview

Renders a Flex Message bubble or carousel.

```tsx
<FlexMessagePreview json={flexBubbleOrCarousel} className="my-class" style={{ margin: 8 }} />
```

| Prop | Type | Description |
|------|------|-------------|
| `json` | `FlexContainer` | Flex Message JSON (bubble or carousel) |
| `className` | `string?` | Additional CSS class |
| `style` | `CSSProperties?` | Additional inline styles |

### LineChatFrame

Wraps content in a LINE chat UI frame.

```tsx
<LineChatFrame accountName="My Bot" width={375}>
  <FlexMessagePreview json={flexJson} />
</LineChatFrame>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Content to display |
| `accountName` | `string?` | `"トーク"` | Header title |
| `avatarUrl` | `string?` | — | Avatar image URL (defaults to green BOT icon) |
| `width` | `number?` | `375` | Frame width in pixels |

### LineTextBubble

Renders a plain text message bubble.

```tsx
<LineTextBubble text="Hello!" />
```

### FlexEditor

Interactive WYSIWYG editor for LINE Flex Messages with live preview, component outline tree, and property inspectors.

```tsx
<FlexEditor onChange={(json) => console.log(json)} />
```

See [Visual Editor (FlexEditor)](#visual-editor-flexeditor) below for full documentation, props, and examples.

## Visual Editor (FlexEditor)

A WYSIWYG editor for people who don't write JSON. It provides a two-column layout on desktop (preview on the left, editing form on the right); on narrow screens it switches to "Preview" / "Edit" tabs automatically.

```tsx
import { FlexEditor } from 'line-flex-message-renderer';

<FlexEditor onChange={(json) => console.log(json)} />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `FlexContainer?` | `templates[0].bubble` | Initial Flex Message JSON (bubble or carousel) |
| `onChange` | `((json: FlexContainer) => void)?` | — | Callback fired whenever the message is modified |
| `templates` | `EditorTemplate[]?` | Built-in 5 templates | Custom template list to display in the editor |
| `mobileBreakpoint` | `number?` | `768` | Width in pixels below which the layout switches to tabs |
| `forceLayout` | `"desktop" \| "mobile"?` | — | Force desktop (two-column) or mobile (tabbed) layout |
| `showChatFrame` | `boolean?` | `true` | Whether to wrap the preview in `LineChatFrame` |
| `accountName` | `string?` | `"トーク"` | Header title displayed in the chat frame |
| `className` | `string?` | — | Additional CSS class for the root container |
| `style` | `CSSProperties?` | — | Additional inline styles for the root container |

### Editing Existing JSON

Pass any existing Flex Message JSON (bubble or carousel) to `value` to start editing:

```tsx
<FlexEditor value={existingFlexJson} onChange={setJson} />
```

### What You Can Edit Without Touching JSON

- **Text**: content, font size, weight, color, alignment, wrap toggle, and top spacing
- **Image**: image URL, size, aspect ratio, aspect mode (cover/fit), alignment, background color, and top spacing
- **Button**: button label, action type (open URL or send message), link URL / message text, style (primary/secondary/link), color, height, and top spacing
- **Box (Group)**: layout direction (vertical/horizontal/baseline), component spacing, padding (`paddingAll`), background color, corner radius, and top spacing
- **Component tree**: reorder components with move up / down buttons, add new components (text, image, button, separator, box), and delete components

### Built-in Templates

The editor includes 5 built-in templates to jumpstart message creation:

| ID | Name | Description |
|----|------|-------------|
| `notice` | お知らせ | 見出しと本文だけのシンプルなお知らせ (Simple notice with header and body) |
| `coupon` | クーポン | 画像・割引・利用ボタンつきのクーポン (Promotional coupon with image, discount, and action button) |
| `product` | 商品紹介 | 商品写真と価格と購入ボタン (Product photo, price, and purchase button) |
| `event` | イベント案内 | 日時・場所と申し込みボタン (Event invitation with date, location, and apply button) |
| `profile` | 店舗紹介 | 店舗の写真・住所・電話ボタン (Store profile with photo, address, and call button) |

### Validation

`validateFlex(container)` validates a Flex container against the official LINE Flex Message specification and returns issues (`error` / `warning`):
- Image URLs must be HTTPS, non-empty, and up to 2,000 characters
- Action objects must be present for buttons; URI actions are limited to `http`, `https`, `line`, and `tel` schemes (up to 1,000 characters); message actions require text (up to 300 characters)
- Text components must have non-empty `text` or `contents`
- Carousels must contain between 1 and 12 bubbles, and all bubbles must share the same size
- Baseline boxes can only contain icons, text, and fillers

`toFlexMessage(container, altText)` wraps the validated container into a Messaging API `flex` message:

```tsx
import { validateFlex, toFlexMessage } from 'line-flex-message-renderer';

const issues = validateFlex(json);
if (issues.every((i) => i.severity !== 'error')) {
  await client.pushMessage(userId, toFlexMessage(json, 'Notification'));
}
```

#### Validating edited Flex Message JSON

Use `parseFlexMessage` for JSON text from an editor, or `validateFlexMessage` for an already parsed value. Both functions return either the typed `FlexMessage` or all errors with JSON paths. Use `formatFlexJson` to display JSON with two-space indentation.

Flex Message validation has two layers:

| Function | Layer | Purpose |
|----------|-------|---------|
| `validateFlexMessage` | Structural validation | Checks whether an unknown value has the supported Flex Message shape and reports JSON paths |
| `validateFlex` | Semantic validation | Checks LINE-specific meaning and constraints after the value has its Flex types |

Unknown keys are passed through without validation and are preserved when the validated value is saved.

```tsx
import {
  formatFlexJson,
  parseFlexMessage,
  validateFlexMessage,
} from 'line-flex-message-renderer';

const result = parseFlexMessage(jsonText);
if (result.ok) {
  const prettyJson = formatFlexJson(result.value);
  // Save result.value or display prettyJson.
} else {
  console.error(result.errors);
}
```

### Customizing the Editor UI

For custom workflows or building your own layout, the editor subcomponents are exported individually. You can combine `Outline`, `NodeInspector`, `JsonPanel`, and `EditorPanel` to compose a custom editing experience tailored to your application.

### Zero Dependencies

The editor adds no runtime dependencies. Like the rest of the library, all styling is implemented in pure CSS-in-JS without external stylesheets or CSS runtime overhead.

## Supported Flex Message Components

- **box** — vertical / horizontal / baseline layouts
- **text** — with span support, wrapping, max lines
- **image** — aspect ratio, aspect mode (cover/fit)
- **button** — primary / secondary / link styles
- **separator** — horizontal line
- **spacer** — flexible space
- **filler** — flex-grow space
- **icon** — inline icon image

## Bubble Sizes

| Size | Width |
|------|-------|
| nano | 120px |
| micro | 150px |
| kilo | 230px |
| mega (default) | 300px |
| giga | 386px |

## Carousel Support

Pass a carousel container to render multiple bubbles with horizontal scrolling:

```tsx
<FlexMessagePreview
  json={{
    type: 'carousel',
    contents: [bubble1, bubble2, bubble3],
  }}
/>
```

## Development

```bash
pnpm install
pnpm storybook    # Start Storybook dev server
pnpm test         # Run tests
pnpm build        # Build for production
pnpm typecheck    # Type check
pnpm lint         # Lint
```

## License

MIT

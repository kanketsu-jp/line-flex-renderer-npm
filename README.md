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

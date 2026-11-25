import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import type * as React from "react";
import { cn } from "./utils";

const toggleGroupItemClasses =
	"inline-flex min-w-9 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all cursor-pointer hover:bg-muted disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:shadow-xs [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

function ToggleGroup({
	className,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
	return (
		<ToggleGroupPrimitive.Root
			data-slot="toggle-group"
			className={cn(
				"flex w-full items-center justify-center gap-0.5 rounded-lg bg-muted p-0.5",
				className,
			)}
			{...props}
		/>
	);
}

function ToggleGroupItem({
	className,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
	return (
		<ToggleGroupPrimitive.Item
			data-slot="toggle-group-item"
			className={cn(toggleGroupItemClasses, className)}
			{...props}
		/>
	);
}

export { ToggleGroup, ToggleGroupItem };

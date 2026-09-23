# `@ui` UI Components

A shared UI component library built with React, Tailwind CSS, and Radix UI primitives.

> **Note:** Most of the components in this library are sourced from [shadcn/ui](https://ui.shadcn.com/). For the license, see the [shadcn license](./src/components/ui/LICENSE-shadcn.md).

## Components & Hooks

### Toast System

The toast system provides a simple way to display temporary notifications to users. It is built on top of [Radix UI Toast](https://www.radix-ui.com/docs/primitives/components/toast) and supports success, default, and destructive variants.

#### Setup

To use toasts in your application, add the `<Toaster />` component to your root layout:

```tsx
import { Toaster } from "@ui/components/ui/toaster";

export default function App() {
  return (
    <>
      <YourAppContent />
      <Toaster />
    </>
  );
}
```

#### Usage

Use the `useToast` hook to display toast notifications:

```tsx
import { useToast } from "@ui/hooks/use-toast";

export function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      variant: "success",
      title: "Success",
      description: "Your changes have been saved.",
    });
  };

  return <button onClick={handleSuccess}>Save</button>;
}
```

#### Available Variants

- **`success`** — Green background for successful operations
- **`default`** — Standard toast with border
- **`destructive`** — Red background for errors or destructive actions

#### Toast Properties

```tsx
toast({
  variant?: "default" | "success" | "destructive", // Toast style variant
  title?: React.ReactNode,                          // Toast title
  description?: React.ReactNode,                    // Toast message
  action?: ToastActionElement,                      // Optional action button
});
```

#### Examples

**Success notification:**

```tsx
const { toast } = useToast();

toast({
  variant: "success",
  title: "Course created",
  description: "Your new course has been created successfully.",
});
```

**Error notification:**

```tsx
toast({
  variant: "destructive",
  title: "Error",
  description: "Failed to save your changes. Please try again.",
});
```

**Toast with action button:**

```tsx
toast({
  title: "Undo?",
  description: "Your item was deleted.",
  action: <button onClick={() => console.log("Undo")}>Undo</button>,
});
```

#### Behavior

- Only **one toast** is displayed at a time (configured by `TOAST_LIMIT = 1`)
- Toasts automatically dismiss after **1 second** (configured by `TOAST_REMOVE_DELAY = 1000`)
- Users can manually close toasts by clicking the close button
- On mobile, toasts appear at the bottom; on desktop, they appear at the bottom-right

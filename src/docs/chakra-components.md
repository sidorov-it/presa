# Chakra UI Component Structure

## Overview

Chakra UI 3.0+ uses a compositional pattern for components with namespaces. Instead of importing individual components like `SliderTrack`, you now access them through the main component's namespace like `Slider.Track`.

## Component Patterns

### Basic Pattern

Most components follow this pattern:

```tsx
import { Component } from '@chakra-ui/react'

<Component.Root>
  <Component.Part1 />
  <Component.Part2 />
</Component.Root>
```

### Common Examples

#### Select

```tsx
import { Select, createListCollection } from '@chakra-ui/react'

const options = createListCollection({
  items: [
    { label: "Option 1", value: "option1" },
    { label: "Option 2", value: "option2" },
  ],
})

<Select.Root collection={options}>
  <Select.HiddenSelect name="my-select" />
  <Select.Label>Select an option</Select.Label>
  <Select.Control>
    <Select.Trigger>
      <Select.ValueText placeholder="Select option" />
    </Select.Trigger>
    <Select.IndicatorGroup>
      <Select.Indicator />
    </Select.IndicatorGroup>
  </Select.Control>
  <Portal>
    <Select.Positioner>
      <Select.Content>
        {options.items.map((option) => (
          <Select.Item key={option.value} item={option}>
            {option.label}
            <Select.ItemIndicator />
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Positioner>
  </Portal>
</Select.Root>
```

#### Tabs

```tsx
import { Tabs } from '@chakra-ui/react'

<Tabs.Root>
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.ContentGroup>
    <Tabs.Content value="tab1">Content 1</Tabs.Content>
    <Tabs.Content value="tab2">Content 2</Tabs.Content>
  </Tabs.ContentGroup>
</Tabs.Root>
```

#### Slider

```tsx
import { Slider } from '@chakra-ui/react'

<Slider.Root min={0} max={100} defaultValue={50}>
  <Slider.Track>
    <Slider.Range />
  </Slider.Track>
  <Slider.Thumb index={0} />
</Slider.Root>
```

#### Checkbox

```tsx
import { Checkbox } from '@chakra-ui/react'

<Checkbox.Root defaultChecked>
  <Checkbox.Control>
    <Checkbox.Indicator />
  </Checkbox.Control>
  <Checkbox.Label>Label text</Checkbox.Label>
</Checkbox.Root>
```

## Theming

Chakra UI 3.0+ uses Panda CSS for its theming system. Theme configuration is now done using `defineConfig` and `createSystem`:

```tsx
import { defineConfig, createSystem, defaultConfig } from '@chakra-ui/react'

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        primary: { /* colors */ },
      },
    },
    semanticTokens: {
      colors: {
        brand: { value: "{colors.primary.500}" },
      },
    },
  },
})

const system = createSystem(defaultConfig, config)

// In your provider
<ChakraProvider value={system}>
  {children}
</ChakraProvider>
```

## Props Changes

Many boolean props have been renamed:

- `isDisabled` → `disabled`
- `isChecked` → `checked`
- `isInvalid` → `invalid`
- `isRequired` → `required`
- etc.

## References

- [Chakra UI Documentation](https://chakra-ui.com/docs)
- [Theming Overview](https://chakra-ui.com/docs/theming/overview)
- [Component Documentation](https://chakra-ui.com/docs/components) 
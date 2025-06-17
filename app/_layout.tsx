// app/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  // This sets up a "stack" navigator. Since we only have one screen (index.tsx),
  // it will just show that screen. We hide the default header because our
  // screen component manages its own header.
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
export const haptic = {
  light: () => navigator.vibrate?.(30),
  medium: () => navigator.vibrate?.(60),
  heavy: () => navigator.vibrate?.(100),
  success: () => navigator.vibrate?.([40, 30, 80]),
  error: () => navigator.vibrate?.([80, 40, 80]),
  win: () => navigator.vibrate?.([50, 30, 50, 30, 150]),
};

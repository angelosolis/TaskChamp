/**
 * Walks up the component tree to find if a button is disabled.
 * React Native Paper Button sets accessibilityState.disabled on a parent View.
 */
export function isButtonDisabled(element: any): boolean {
  let node = element;
  for (let i = 0; i < 8; i++) {
    if (!node) return false;
    if (node.props?.accessibilityState?.disabled === true) return true;
    if (node.props?.disabled === true) return true;
    node = node.parent;
  }
  return false;
}

/**
 * True while the tab is visible. Used to pause background polling so hidden
 * admin/tracking tabs stop consuming serverless invocations.
 */
export function isPageVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}

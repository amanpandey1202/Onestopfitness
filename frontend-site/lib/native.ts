// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
async function getCapacitor() {
  try {
    return await import("@capacitor/core");
  } catch {
    return null;
  }
}

async function isNative(): Promise<boolean> {
  const cap = await getCapacitor();
  return cap?.Capacitor?.isNativePlatform?.() ?? false;
}

async function hapticSuccess(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (e) { console.warn("[native] hapticSuccess failed", e); }
}

async function hapticError(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Error });
  } catch (e) { console.warn("[native] hapticError failed", e); }
}

async function hapticLight(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) { console.warn("[native] hapticLight failed", e); }
}

async function boostBrightness(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { ScreenBrightness } = await import("@capacitor-community/screen-brightness");
    await ScreenBrightness.setBrightness({ brightness: 1.0 });
  } catch (e) { console.warn("[native] boostBrightness failed", e); }
}

async function restoreBrightness(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { ScreenBrightness } = await import("@capacitor-community/screen-brightness");
    await ScreenBrightness.setBrightness({ brightness: -1 });
  } catch (e) { console.warn("[native] restoreBrightness failed", e); }
}

async function keepScreenOn(keep: boolean): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { KeepAwake } = await import("@capacitor-community/keep-awake");
    if (keep) { await KeepAwake.keepAwake(); } else { await KeepAwake.allowSleep(); }
  } catch (e) { console.warn("[native] keepScreenOn failed", e); }
}

async function setDarkStatusBar(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0C1010" });
  } catch (e) { console.warn("[native] setDarkStatusBar failed", e); }
}

async function scheduleExpiryReminder(daysRemaining: number, expiryDateStr: string): Promise<void> {
  if (!(await isNative()) || daysRemaining > 7) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return;
    const fireAt = new Date(new Date(expiryDateStr).getTime() - daysRemaining * 86400000);
    if (fireAt < new Date()) return;
    await LocalNotifications.schedule({
      notifications: [{
        id: 1001,
        title: "Membership Expiring Soon",
        body: `Your gym membership expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}. Renew now!`,
        schedule: { at: fireAt },
        extra: { route: "/member/pay" },
      }],
    });
  } catch (e) { console.warn("[native] scheduleExpiryReminder failed", e); }
}

async function cancelAllLocalNotifications(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch (e) { console.warn("[native] cancelAllLocalNotifications failed", e); }
}

async function registerForPushAndGetToken(): Promise<string | null> {
  if (!(await isNative())) return null;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return null;
    await PushNotifications.register();
    return new Promise((resolve) => {
      PushNotifications.addListener("registration", (token) => resolve(token.value));
      PushNotifications.addListener("registrationError", () => resolve(null));
      setTimeout(() => resolve(null), 5000);
    });
  } catch (e) { console.warn("[native] registerForPushAndGetToken failed", e); return null; }
}

async function isConnected(): Promise<boolean> {
  if (!(await isNative())) return navigator.onLine;
  try {
    const { Network } = await import("@capacitor/network");
    const status = await Network.getStatus();
    return status.connected;
  } catch { return navigator.onLine; }
}

function onForeground(callback: () => void): () => void {
  let handle: { remove: () => void } | null = null;
  isNative().then((native) => {
    if (!native) return;
    import("@capacitor/app").then(({ App }) => {
      App.addListener("appStateChange", (state: { isActive: boolean }) => {
        if (state.isActive) callback();
      }).then((h: { remove: () => void }) => { handle = h; });
    }).catch(console.warn);
  });
  return () => { if (handle) handle.remove(); };
}

function playCheckInSound(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    gain.connect(ctx.destination);
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + 0.5);
    });
  } catch { /* silent fail */ }
}

export const native = {
  hapticSuccess,
  hapticError,
  hapticLight,
  boostBrightness,
  restoreBrightness,
  keepScreenOn,
  setDarkStatusBar,
  scheduleExpiryReminder,
  cancelAllLocalNotifications,
  registerForPushAndGetToken,
  isConnected,
  onForeground,
  playCheckInSound,
};

import { getPushPublicKey, removePushSubscription, savePushSubscription } from './api';

/** VAPID keys travel as base64url but pushManager.subscribe wants bytes. */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);

  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
};

export const isPushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

let registrationPromise = null;

/** Registers the worker once per page load and resolves to its registration. */
export const getRegistration = () => {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);

  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => navigator.serviceWorker.ready.then(() => registration))
      .catch((error) => {
        console.warn('Service worker registration failed:', error);
        registrationPromise = null;
        return null;
      });
  }

  return registrationPromise;
};

/**
 * Subscribes this browser to push for the signed-in room and stores the
 * endpoint server-side. Safe to call repeatedly — it reuses any existing
 * subscription and just refreshes the server record.
 */
export const subscribeToPush = async () => {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };

  const registration = await getRegistration();
  if (!registration) return { ok: false, reason: 'no-service-worker' };

  const { publicKey, enabled } = await getPushPublicKey();

  if (!enabled || !publicKey) return { ok: false, reason: 'server-disabled' };

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await savePushSubscription(subscription.toJSON());

  return { ok: true };
};

/** Stops push for this browser and forgets the endpoint server-side. */
export const unsubscribeFromPush = async () => {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  const subscription = await registration?.pushManager.getSubscription();

  if (!subscription) return;

  try {
    await removePushSubscription(subscription.endpoint);
  } catch {
    // Even if the server call fails, drop the local subscription.
  }

  await subscription.unsubscribe();
};

/**
 * Shows a notification from the page. Android Chrome forbids `new Notification`,
 * so the service worker registration is used whenever one is available.
 */
export const showLocalNotification = async (title, options) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const registration = await getRegistration();

  if (registration) {
    await registration.showNotification(title, options);
    return;
  }

  try {
    new Notification(title, options);
  } catch {
    /* no notification channel available */
  }
};

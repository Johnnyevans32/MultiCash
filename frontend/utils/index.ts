import moment from "moment";
import { getToken } from "firebase/messaging";
import { notify } from "@kyvg/vue3-notification";
import { useUserStore } from "~/store/user";

export const formatMoney = (value?: number, maxFractionDigits = 2) =>
  value?.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFractionDigits,
  });

export const formatDate = (date: string, format = "MMM Do YY") =>
  moment(date).format(format);

export const convertTime = (
  time: number,
  from: moment.unitOfTime.Base,
  to: moment.unitOfTime.Base
) => moment.duration(time, from).as(to);

export const groupByDate = <T>(
  array: T[],
  dateField: keyof T,
  format = "MMM Do YY"
) => {
  return array.reduce((result: Record<string, T[]>, item: T) => {
    const key = formatDate(item[dateField] as string, format);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {});
};

export const generateMailToLink = () => {
  const config = useRuntimeConfig();
  const subject = encodeURIComponent(`issue with ${config.public.appName}`);
  return `mailto:${config.public.email}?subject=${subject}`;
};

export const groupBy = <T extends Record<string | number, any>>(
  array: T[],
  property: keyof T
): Record<string | number, T[]> => {
  return array.reduce((acc: Record<string | number, T[]>, obj: T) => {
    const key = obj[property];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {} as Record<string | number, T[]>);
};

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const uploadFile = async (
  base64File: string,
  fileType: string,
  fileName: string
) => {
  const payload = {
    file: base64File,
    fileName,
    fileType,
  };
  const { $api } = useNuxtApp();
  const resp = await $api.userService.uploadFile(payload);
  return resp.secure_url;
};

export const getCurrencySign = (currency: string) => {
  return {
    NGN: "₦",
    GHS: "₵",
    KES: "KSh",
    USD: "$",
    GBP: "£",
    EUR: "€",
    USDC: "USDC",
    BTC: "₿",
    AUD: "A$",
    MXN: "$",
    ZAR: "R",
  }[currency];
};

export async function requestNotificationPermission() {
  if (!window.Notification) {
    notify({
      title: "This browser does not support web notification",
      type: "info",
    });
    return false;
  }

  if (window.Notification.permission === "granted") {
    setToken();
    return true;
  }
  const permissionResult = await window.Notification.requestPermission();
  if (permissionResult === "granted") {
    notify({
      title:
        "You've enabled notifications. You'll now receive push notification updates.",
      type: "info",
    });
    setToken();
    return true;
  }
  notify({
    title: `You have denied notification permission. To re-enable, go to browser settings > Notifications.`,
    type: "info",
  });
  return false;
}

export async function setToken(isFromRetry = false) {
  try {
    const { deviceId } = storeToRefs(useUserStore());
    const { $messaging, $api } = useNuxtApp();
    const token = await getToken($messaging, {
      vapidKey:
        "BIARmEHojCDE1iSgKRLzAZveSlZf2RhzNFjlV0MSuUv66AKeNiP5_bTdbz4vCHXLpvwGnvhtZ3C3Pu_hRnReKI8",
    });

    await $api.userService.saveDeviceFcmToken(deviceId.value, token);
  } catch (err) {
    if (!isFromRetry) {
      await setToken(true);
    }
  }
}

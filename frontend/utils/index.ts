import moment from "moment";

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

export const truncateString = (data: string) =>
  `${data.substring(0, 7)}...${data.slice(data.length - 4)}`;

export const generateMailToLink = () => {
  const config = useRuntimeConfig();
  const subject = encodeURIComponent(`issue with ${config.public.appName}`);
  return `mailto:${config.public.email}?subject=${subject}`;
};

export const shortenString = (str: string, maxLength = 20) => {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength) + "...";
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

export const generateRandomDigits = (length = 6) => {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
};

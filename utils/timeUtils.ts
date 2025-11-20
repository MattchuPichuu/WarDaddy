
import { PRO_START_OFFSET_MS, PRO_END_OFFSET_MS } from "../constants";

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  // Using en-GB for DD/MM/YYYY format
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(',', '');
};

export const calculateProWindows = (shotTime: number) => {
  return {
    start: shotTime + PRO_START_OFFSET_MS,
    end: shotTime + PRO_END_OFFSET_MS
  };
};

export const getRemainingTime = (targetTime: number, now: number): string => {
  const diff = targetTime - now;
  if (diff <= 0) return "00:00:00";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

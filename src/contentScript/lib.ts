export const convertSecondsToTimestamp = (seconds: number): string => {
  const date = new Date(null);
  date.setSeconds(seconds);
  return date.toISOString().substr(11, 8);
};

export const convertTimestampToSeconds = (timestamp: string): number => {
  const [hours, minutes, seconds] = timestamp.split(":");
  return +hours * 3600 + +minutes * 60 + +seconds;
};

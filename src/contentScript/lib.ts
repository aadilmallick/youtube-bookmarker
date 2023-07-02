export const convertSecondsToTimestamp = (seconds: number): string => {
  const date = new Date(null);
  date.setSeconds(seconds);
  return date.toISOString().substr(11, 8);
};

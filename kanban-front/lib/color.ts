const DOTS = [
  "#7EB8DA",
  "#E8A87C",
  "#C3AED6",
  "#E2C044",
  "#E07A5F",
  "#81B29A",
  "#F2CC8F",
];

export function colorFromId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return DOTS[Math.abs(hash) % DOTS.length];
}

export function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

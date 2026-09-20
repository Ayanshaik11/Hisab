const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// 1234567 -> "12,34,567"  (Indian digit grouping, no Intl needed)
function groupIndian(intStr) {
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  const rest = intStr.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
}

export function formatMoney(amount) {
  const n = Number(amount) || 0;
  const abs = Math.round(Math.abs(n) * 1000) / 1000;
  const [intPart, decPart] = String(abs).split(".");
  return (n < 0 ? "−" : "") + "₹" + groupIndian(intPart) + (decPart ? "." + decPart : "");
}

// Date -> "YYYY-MM-DD" in local time (same format the app has always stored)
export function toYMD(d) {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function todayString() {
  return toYMD(new Date());
}

export function parseYMD(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "2026-09-19" -> "19 Sep 2026"
export function formatDate(dateString) {
  if (!dateString) return "";
  const [y, m, d] = dateString.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

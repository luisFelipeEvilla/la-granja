import { format, isSameDay, isSameYear } from "date-fns";
import { es } from "date-fns/locale";

// "20 oct 2026" (Spanish short months come with a trailing dot in some versions: drop it)
const shortMonth = (date: Date, pattern: string) => format(date, pattern, { locale: es }).replace(/\./g, "");

export const formatPickerDate = (date: Date) => shortMonth(date, "d MMM yyyy");

// "1 oct – 20 oct 2026" (the year once when both dates share it)
export function formatPickerRange(from?: Date, to?: Date) {
    if (!from) return "";
    if (!to || isSameDay(from, to)) return formatPickerDate(from);
    return isSameYear(from, to)
        ? `${shortMonth(from, "d MMM")} – ${formatPickerDate(to)}`
        : `${formatPickerDate(from)} – ${formatPickerDate(to)}`;
}

export const startOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

import { DateRangePickerItem } from "@/components/ui/form/DatePicker";

const daysAgo = (days: number) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return date;
};

const today = () => daysAgo(0);

// quick ranges shown next to the calendar in Tremor's DateRangePicker
export const dateRangePresets = () => {
    const now = today();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    return [
        <DateRangePickerItem key="today" value="today" from={now} to={now}>Hoy</DateRangePickerItem>,
        <DateRangePickerItem key="7d" value="7d" from={daysAgo(6)} to={now}>Últimos 7 días</DateRangePickerItem>,
        <DateRangePickerItem key="30d" value="30d" from={daysAgo(29)} to={now}>Últimos 30 días</DateRangePickerItem>,
        <DateRangePickerItem key="month" value="month" from={monthStart} to={now}>Este mes</DateRangePickerItem>,
        <DateRangePickerItem key="last-month" value="last-month" from={lastMonthStart} to={lastMonthEnd}>Mes anterior</DateRangePickerItem>,
    ];
};

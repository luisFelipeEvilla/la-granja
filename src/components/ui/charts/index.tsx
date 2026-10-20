"use client";
import {
    Bar,
    BarChart as RechartsBarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart as RechartsLineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

// Tremor color names -> Tailwind v4 palette (500 shades)
const palette: Record<string, string> = {
    slate: "#64748b", gray: "#6b7280", zinc: "#71717a", neutral: "#737373", stone: "#78716c",
    red: "#ef4444", orange: "#f97316", amber: "#f59e0b", yellow: "#eab308", lime: "#84cc16",
    green: "#22c55e", emerald: "#10b981", teal: "#14b8a6", cyan: "#06b6d4", sky: "#0ea5e9",
    blue: "#3b82f6", indigo: "#6366f1", violet: "#8b5cf6", purple: "#a855f7", fuchsia: "#d946ef",
    pink: "#ec4899", rose: "#f43f5e",
};

const defaultColors = ["emerald", "blue", "amber", "violet", "cyan", "rose", "lime", "indigo", "orange", "teal"];

const colorOf = (colors: string[] | undefined, index: number) => {
    const list = colors?.length ? colors : defaultColors;
    const name = list[index % list.length];
    return palette[name] ?? name;
};

type Formatter = (value: number) => string;
const defaultFormatter: Formatter = (value) => new Intl.NumberFormat("es-CO").format(value);

const tick = { fill: "#64748b", fontSize: 12 };

type Datum = Record<string, any>;

type SeriesChartProps = {
    data: Datum[],
    index: string,
    categories: string[],
    colors?: string[],
    valueFormatter?: Formatter,
    yAxisWidth?: number,
    showLegend?: boolean,
    className?: string,
};

function Legend({ items }: { items: { name: string, color: string }[] }) {
    return (
        <ul className="mb-2 flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs text-slate-600">
            {items.map((item) => (
                <li key={item.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                </li>
            ))}
        </ul>
    );
}

function ChartTooltip({ active, payload, label, formatter }: { active?: boolean, payload?: any[], label?: any, formatter: Formatter }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="min-w-[10rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
            {label !== undefined && label !== "" && <p className="mb-1 font-medium text-slate-900">{label}</p>}
            <ul className="space-y-1">
                {payload.map((entry) => (
                    <li key={String(entry.dataKey ?? entry.name)} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-slate-600">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color ?? entry.payload?.fill }} />
                            {entry.name}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900">{formatter(Number(entry.value))}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const summary = (kind: string, data: Datum[], categories: string[]) =>
    `Gráfico de ${kind} con ${data.length} ${data.length === 1 ? "punto" : "puntos"}: ${categories.join(", ")}`;

function SeriesFrame({ className, legend, ariaLabel, children }: { className?: string, legend?: { name: string, color: string }[], ariaLabel: string, children: React.ReactElement }) {
    return (
        <div role="img" aria-label={ariaLabel} className={`flex w-full flex-col ${className ?? "h-72"}`}>
            {legend && legend.length > 0 && <Legend items={legend} />}
            <div className="min-h-0 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
            </div>
        </div>
    );
}

export function BarChart({ data, index, categories, colors, valueFormatter = defaultFormatter, yAxisWidth = 56, showLegend = true, className }: SeriesChartProps) {
    const legend = showLegend ? categories.map((name, i) => ({ name, color: colorOf(colors, i) })) : undefined;
    return (
        <SeriesFrame className={className} legend={legend} ariaLabel={summary("barras", data, categories)}>
            <RechartsBarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey={index} tick={tick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} tickMargin={8} />
                <YAxis width={yAxisWidth} tick={tick} axisLine={false} tickLine={false} tickFormatter={(value) => valueFormatter(Number(value))} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} content={(props: any) => <ChartTooltip {...props} formatter={valueFormatter} />} />
                {categories.map((category, i) => (
                    <Bar key={category} dataKey={category} name={category} fill={colorOf(colors, i)} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                ))}
            </RechartsBarChart>
        </SeriesFrame>
    );
}

export function LineChart({ data, index, categories, colors, valueFormatter = defaultFormatter, yAxisWidth = 56, showLegend = true, className }: SeriesChartProps) {
    const legend = showLegend ? categories.map((name, i) => ({ name, color: colorOf(colors, i) })) : undefined;
    return (
        <SeriesFrame className={className} legend={legend} ariaLabel={summary("líneas", data, categories)}>
            <RechartsLineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey={index} tick={tick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} tickMargin={8} />
                <YAxis width={yAxisWidth} tick={tick} axisLine={false} tickLine={false} tickFormatter={(value) => valueFormatter(Number(value))} />
                <Tooltip cursor={{ stroke: "#cbd5e1" }} content={(props: any) => <ChartTooltip {...props} formatter={valueFormatter} />} />
                {categories.map((category, i) => (
                    <Line
                        key={category}
                        type="monotone"
                        dataKey={category}
                        name={category}
                        stroke={colorOf(colors, i)}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                        isAnimationActive={false}
                    />
                ))}
            </RechartsLineChart>
        </SeriesFrame>
    );
}

type DonutChartProps = {
    data: Datum[],
    index: string,
    category: string,
    colors?: string[],
    valueFormatter?: Formatter,
    className?: string,
    showLabel?: boolean,
    label?: string,
};

export function DonutChart({ data, index, category, colors, valueFormatter = defaultFormatter, className, showLabel = true, label }: DonutChartProps) {
    const total = data.reduce((sum, item) => sum + (Number(item[category]) || 0), 0);
    const center = label ?? valueFormatter(total);
    return (
        <div role="img" aria-label={`Gráfico circular de ${data.length} partes, total ${valueFormatter(total)}`} className={`relative w-full ${className ?? "h-60"}`}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip content={(props: any) => <ChartTooltip {...props} label="" formatter={valueFormatter} />} />
                    <Pie
                        data={data}
                        dataKey={category}
                        nameKey={index}
                        innerRadius="70%"
                        outerRadius="90%"
                        paddingAngle={1}
                        stroke="none"
                        isAnimationActive={false}
                    >
                        {data.map((item, i) => <Cell key={String(item[index] ?? i)} fill={colorOf(colors, i)} />)}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            {showLabel && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="max-w-[60%] text-center text-lg font-semibold tabular-nums text-slate-900">{center}</span>
                </div>
            )}
        </div>
    );
}

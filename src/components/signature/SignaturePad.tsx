"use client";
import { forwardRef, PointerEvent, useCallback, useEffect, useImperativeHandle, useRef } from "react";

type Point = { x: number, y: number };

export type SignaturePadHandle = {
    clear: () => void,
    isEmpty: () => boolean,
    // PNG with a white background (not transparent), ready to upload
    toDataURL: () => string
};

type Props = {
    onChange?: (isEmpty: boolean) => void,
    disabled?: boolean,
    className?: string
};

const INK = "#1e293b"; // slate-800
const LINE_WIDTH = 2.5;

// Dependency-free signature pad. Strokes are kept as points in CSS pixels, so when the pad
// changes size (rotation, resize) the drawing is scaled and redrawn instead of being lost.
const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad({ onChange, disabled, className = "" }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const strokes = useRef<Point[][]>([]);
    const drawing = useRef(false);
    const size = useRef({ width: 0, height: 0 });

    const context = () => canvasRef.current?.getContext("2d") ?? null;

    const drawStroke = (ctx: CanvasRenderingContext2D, points: Point[]) => {
        if (points.length === 0) return;
        ctx.beginPath();
        if (points.length === 1) {
            // a tap leaves a dot
            ctx.arc(points[0].x, points[0].y, LINE_WIDTH / 2, 0, Math.PI * 2);
            ctx.fill();
            return;
        }
        // quadratic curves through the midpoints give smooth lines
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
            const mid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 };
            ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
        }
        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
    };

    const redraw = useCallback(() => {
        const ctx = context();
        if (!ctx) return;
        ctx.clearRect(0, 0, size.current.width, size.current.height);
        strokes.current.forEach((points) => drawStroke(ctx, points));
    }, []);

    // fits the canvas to its box with devicePixelRatio for crisp lines
    const fit = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { width, height } = canvas.getBoundingClientRect();
        if (!width || !height) return;

        const previous = size.current;
        if (previous.width && previous.height && (previous.width !== width || previous.height !== height)) {
            const scaleX = width / previous.width, scaleY = height / previous.height;
            strokes.current = strokes.current.map((points) => points.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY })));
        }
        size.current = { width, height };

        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);

        const ctx = context();
        if (!ctx) return;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = LINE_WIDTH;
        ctx.strokeStyle = INK;
        ctx.fillStyle = INK;
        redraw();
    }, [redraw]);

    useEffect(() => {
        fit();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const observer = new ResizeObserver(() => fit());
        observer.observe(canvas);
        return () => observer.disconnect();
    }, [fit]);

    const pointFrom = (event: { clientX: number, clientY: number }): Point => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const handleDown = (event: PointerEvent<HTMLCanvasElement>) => {
        if (disabled) return;
        event.preventDefault();
        canvasRef.current?.setPointerCapture(event.pointerId);
        drawing.current = true;
        const wasEmpty = strokes.current.length === 0;
        strokes.current.push([pointFrom(event)]);
        redraw();
        if (wasEmpty) onChange?.(false);
    };

    const handleMove = (event: PointerEvent<HTMLCanvasElement>) => {
        if (!drawing.current || disabled) return;
        event.preventDefault();
        const stroke = strokes.current[strokes.current.length - 1];
        // coalesced events keep fast strokes (Apple Pencil) smooth
        const events = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
        events.forEach((e) => stroke.push(pointFrom(e)));
        redraw();
    };

    const handleUp = (event: PointerEvent<HTMLCanvasElement>) => {
        if (!drawing.current) return;
        drawing.current = false;
        canvasRef.current?.releasePointerCapture?.(event.pointerId);
    };

    useImperativeHandle(ref, () => ({
        clear() {
            strokes.current = [];
            redraw();
            onChange?.(true);
        },
        isEmpty: () => strokes.current.length === 0,
        toDataURL() {
            const canvas = canvasRef.current!;
            const output = document.createElement("canvas");
            output.width = canvas.width;
            output.height = canvas.height;
            const ctx = output.getContext("2d")!;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, output.width, output.height);
            ctx.drawImage(canvas, 0, 0);
            return output.toDataURL("image/png");
        }
    }), [onChange, redraw]);

    return (
        <div className={`relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white ${disabled ? "opacity-60" : ""} ${className}`}>
            {/* guides are HTML (not drawn on the canvas) so they are not part of the exported signature */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 bottom-12 flex items-end gap-2">
                <span className="text-xl font-light leading-none text-slate-300">×</span>
                <span className="mb-0.5 h-px flex-1 bg-slate-300" />
            </div>
            <canvas
                ref={canvasRef}
                role="img"
                aria-label="Recuadro para firmar. Dibuja tu firma con el dedo, un lápiz o el mouse."
                className="relative block h-52 w-full cursor-crosshair touch-none select-none sm:h-60"
                style={{ touchAction: "none" }}
                onPointerDown={handleDown}
                onPointerMove={handleMove}
                onPointerUp={handleUp}
                onPointerCancel={handleUp}
                onPointerLeave={handleUp}
            />
            <p className="sr-only">Para firmar se necesita una pantalla táctil, un lápiz o un mouse.</p>
        </div>
    );
});

export default SignaturePad;

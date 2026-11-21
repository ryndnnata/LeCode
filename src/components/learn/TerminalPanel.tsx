"use client";

import "@xterm/xterm/css/xterm.css";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type Tone = "info" | "ok" | "err" | "dim" | "warn" | "cmd";

export interface TerminalHandle {
  clear: () => void;
  write: (text: string, tone?: Tone) => void;
  writeBlock: (lines: string[], tone?: Tone) => void;
}

const colors: Record<Tone, string> = {
  info: "\x1b[36m",
  ok: "\x1b[32m",
  err: "\x1b[31m",
  dim: "\x1b[90m",
  warn: "\x1b[33m",
  cmd: "\x1b[35m",
};

const RESET = "\x1b[0m";

export const TerminalPanel = forwardRef<TerminalHandle, { className?: string }>(
  function TerminalPanel({ className }, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const termRef = useRef<import("@xterm/xterm").Terminal | null>(null);
    const queueRef = useRef<string[]>([]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        termRef.current?.clear();
        termRef.current?.write("\x1b[2J\x1b[H");
      },
      write: (text, tone = "dim") => {
        const formatted = `${colors[tone]}${text}${RESET}\r\n`;
        if (termRef.current) termRef.current.write(formatted);
        else queueRef.current.push(formatted);
      },
      writeBlock: (lines, tone = "dim") => {
        lines.forEach((line) => {
          const formatted = `${colors[tone]}${line}${RESET}\r\n`;
          if (termRef.current) termRef.current.write(formatted);
          else queueRef.current.push(formatted);
        });
      },
    }));

    useEffect(() => {
      let disposed = false;
      let fitAddon: import("@xterm/addon-fit").FitAddon | null = null;
      let resizeObserver: ResizeObserver | null = null;

      (async () => {
        const [{ Terminal }, { FitAddon }] = await Promise.all([
          import("@xterm/xterm"),
          import("@xterm/addon-fit"),
        ]);
        if (disposed || !hostRef.current) return;

        const term = new Terminal({
          convertEol: true,
          cursorBlink: true,
          fontSize: 12.5,
          lineHeight: 1.45,
          scrollback: 2000,
          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
          theme: {
            background: "#111110",
            foreground: "#e5e5e0",
            cursor: "#6e8cff",
            selectionBackground: "#6e8cff44",
            black: "#111110",
            brightBlack: "#6b6b64",
            red: "#f87171",
            green: "#4ade80",
            yellow: "#fbbf24",
            blue: "#93b4ff",
            magenta: "#c084fc",
            cyan: "#5eead4",
            white: "#e5e5e0",
          },
        });

        fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(hostRef.current);
        try {
          fitAddon.fit();
        } catch {
        }

        termRef.current = term;

        term.writeln("\x1b[37m LeCode Terminal \x1b[0m\x1b[90m· Python 3 (WASM)\x1b[0m");
        term.writeln("\x1b[90m Tekan \"Jalankan kode\" untuk mengeksekusi.\x1b[0m");
        term.writeln("");

        while (queueRef.current.length > 0) {
          term.write(queueRef.current.shift() as string);
        }

        resizeObserver = new ResizeObserver(() => {
          try {
            fitAddon?.fit();
          } catch {
          }
        });
        resizeObserver.observe(hostRef.current);
      })();

      return () => {
        disposed = true;
        resizeObserver?.disconnect();
        termRef.current?.dispose();
        termRef.current = null;
      };
    }, []);

    return (
      <div
        className={className}
        style={{ background: "#0a0f1f" }}
        onMouseDown={() => termRef.current?.focus()}
      >
        <div ref={hostRef} className="h-full w-full px-3 py-2" />
      </div>
    );
  },
);

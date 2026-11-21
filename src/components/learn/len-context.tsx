"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Question } from "@/lib/types";

export interface LenRuntimeContext {
  code: string;
  lastOutput: string;
}

interface LenStateValue {
  question: Question | null;
  context: LenRuntimeContext;
  register: (question: Question | null, context: LenRuntimeContext) => void;
}

const EMPTY_CONTEXT: LenRuntimeContext = { code: "", lastOutput: "" };

const LenContext = createContext<LenStateValue | null>(null);

export function LenProvider({ children }: { children: ReactNode }) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [context, setContext] = useState<LenRuntimeContext>(EMPTY_CONTEXT);

  const register = useCallback((next: Question | null, nextContext: LenRuntimeContext) => {
    setQuestion(next);
    setContext(nextContext);
  }, []);

  const value = useMemo(
    () => ({ question, context, register }),
    [question, context, register],
  );

  return <LenContext.Provider value={value}>{children}</LenContext.Provider>;
}

export function useLenState() {
  const value = useContext(LenContext);
  if (!value) throw new Error("useLenState harus dipakai di dalam LenProvider");
  return value;
}

export function useRegisterLen(question: Question | undefined, context: LenRuntimeContext) {
  const { register } = useLenState();

  useEffect(() => {
    if (!question) return;
    register(question, context);
  }, [question, context, register]);

  useEffect(() => () => register(null, EMPTY_CONTEXT), [register]);
}

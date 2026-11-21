import { seedQuestions } from "./seed";
import type { FeedbackItem, Question } from "./types";

interface DemoStore {
  questions: Question[];
  feedback: FeedbackItem[];
}

const globalStore = globalThis as unknown as { __lecodeDemoStore?: DemoStore };

export function getDemoStore(): DemoStore {
  if (!globalStore.__lecodeDemoStore) {
    globalStore.__lecodeDemoStore = {
      questions: structuredClone(seedQuestions),
      feedback: [],
    };
  }
  return globalStore.__lecodeDemoStore;
}

export function newDemoId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

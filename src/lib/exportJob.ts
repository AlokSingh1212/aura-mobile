export type ExportPhase =
  | "idle"
  | "composing"
  | "uploading"
  | "publishing"
  | "done"
  | "error";

export type ExportJob = {
  phase: ExportPhase;
  label: string;
  progress: number;
  error?: string;
};

let currentJob: ExportJob = { phase: "idle", label: "", progress: 0 };
const listeners = new Set<(job: ExportJob) => void>();

function emit(): void {
  listeners.forEach((fn) => fn(currentJob));
}

export function getExportJob(): ExportJob {
  return currentJob;
}

export function subscribeExportJob(fn: (job: ExportJob) => void): () => void {
  listeners.add(fn);
  fn(currentJob);
  return () => listeners.delete(fn);
}

export function setExportJob(partial: Partial<ExportJob>): void {
  currentJob = { ...currentJob, ...partial };
  emit();
}

export function resetExportJob(): void {
  currentJob = { phase: "idle", label: "", progress: 0 };
  emit();
}

export async function runExportJob<T>(
  steps: { label: string; progress: number; run: (prev: unknown) => Promise<unknown> }[]
): Promise<T> {
  try {
    let prev: unknown = undefined;
    for (const step of steps) {
      setExportJob({ phase: "composing", label: step.label, progress: step.progress });
      prev = await step.run(prev);
    }
    setExportJob({ phase: "done", label: "Published", progress: 100 });
    return prev as T;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Export failed";
    setExportJob({ phase: "error", label: message, error: message });
    throw e;
  }
}

export const STATUS_NONE = 1;
export const STATUS_CHATTING = 2;
export const STATUS_FAILED = 3;
export const STATUS_PENDING = 5;

export const CONTENT_ERROR = 0;
export const CONTENT_TEXT = 1;

export const STREAM_ENDED_KEY =
  'The response stream ended unexpectedly. Reload this conversation to check the saved reply.';

type LooseContent = {
  i?: string;
  $type?: number;
  c?: unknown;
};

type LooseStep = {
  id?: string;
  contents?: LooseContent[];
  edited?: boolean;
  createdAt?: string;
};

type LooseMessage = {
  id?: string;
  status?: number;
  steps?: LooseStep[];
  siblingIds?: string[];
};

function lastContents(message: LooseMessage): LooseContent[] {
  const steps = Array.isArray(message.steps) ? message.steps : [];
  if (steps.length === 0) return [];
  const contents = steps[steps.length - 1]?.contents;
  return Array.isArray(contents) ? contents.slice() : [];
}

function allContents(message: LooseMessage): LooseContent[] {
  const steps = Array.isArray(message.steps) ? message.steps : [];
  const out: LooseContent[] = [];
  for (const step of steps) {
    if (Array.isArray(step?.contents)) out.push(...step.contents);
  }
  return out;
}

export function hasErrorContent(
  message: LooseMessage | null | undefined,
): boolean {
  if (!message) return false;
  return allContents(message).some(
    (content) => content?.$type === CONTENT_ERROR,
  );
}

function stepHasError(step: LooseStep | null | undefined): boolean {
  if (!step || !Array.isArray(step.contents)) return false;
  return step.contents.some((content) => content?.$type === CONTENT_ERROR);
}

function stripEmptyText(contents: LooseContent[]): LooseContent[] {
  return contents.filter((content) => {
    if (!content) return false;
    if (
      content.$type === CONTENT_TEXT &&
      (content.c === '' || content.c == null)
    ) {
      return false;
    }
    return true;
  });
}

function withLastStepContents<T extends LooseMessage>(
  message: T,
  contents: LooseContent[],
): T {
  const steps: LooseStep[] = Array.isArray(message.steps)
    ? (message.steps as LooseStep[]).slice()
    : [];
  if (steps.length === 0) {
    steps.push({
      id: '',
      contents,
      edited: false,
      createdAt: '',
    });
  } else {
    steps[steps.length - 1] = {
      ...steps[steps.length - 1],
      contents,
    };
  }
  return { ...message, steps } as T;
}

function upsertError(contents: LooseContent[], errorText: string): LooseContent[] {
  const next = stripEmptyText(contents);
  const index = next.findIndex((content) => content.$type === CONTENT_ERROR);
  if (index >= 0) {
    next[index] = { ...next[index], c: errorText };
  } else {
    next.push({ i: '', $type: CONTENT_ERROR, c: errorText });
  }
  return next;
}

export function applyErrorEvent<T extends LooseMessage>(
  message: T,
  errorText: string,
): T {
  const contents = upsertError(lastContents(message), errorText);
  return {
    ...withLastStepContents(message, contents),
    status: STATUS_FAILED,
  };
}

export function applyEndStep<T extends LooseMessage>(
  message: T,
  stepData: LooseStep,
): T {
  const steps: LooseStep[] = Array.isArray(message.steps)
    ? (message.steps as LooseStep[]).slice()
    : [];
  if (steps.length > 0) {
    steps[steps.length - 1] = stepData;
  } else {
    steps.push(stepData);
  }
  const failed =
    message.status === STATUS_FAILED ||
    stepHasError(stepData) ||
    steps.some((step) => stepHasError(step));
  if (!failed) {
    steps.push({
      id: '',
      contents: [],
      edited: false,
      createdAt: '',
    });
  }
  return { ...message, steps } as T;
}

function mergeSiblingIds(
  tempIds: unknown,
  persistedIds: unknown,
  extra?: string,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (value: unknown) => {
    if (typeof value !== 'string' || !value || seen.has(value)) return;
    seen.add(value);
    out.push(value);
  };
  if (Array.isArray(tempIds)) tempIds.forEach(push);
  if (Array.isArray(persistedIds)) persistedIds.forEach(push);
  push(extra);
  return out;
}

export function applyResponseMessage<T extends LooseMessage>(
  temp: T,
  persisted: LooseMessage,
): T {
  const failed =
    temp.status === STATUS_FAILED ||
    hasErrorContent(temp) ||
    hasErrorContent(persisted);
  if (!failed) {
    return {
      ...temp,
      status: STATUS_NONE,
      id: persisted.id ?? temp.id,
      siblingIds: mergeSiblingIds(
        temp.siblingIds,
        persisted.siblingIds,
        persisted.id,
      ),
    };
  }
  const persistedHasSteps =
    Array.isArray(persisted.steps) && persisted.steps.length > 0;
  const persistedSteps = persistedHasSteps ? persisted.steps : temp.steps;
  return {
    ...temp,
    id: persisted.id ?? temp.id,
    steps: persistedSteps,
    status: STATUS_FAILED,
    siblingIds: mergeSiblingIds(
      temp.siblingIds,
      persisted.siblingIds,
      persisted.id ?? temp.id,
    ),
  } as T;
}

export function applyNetworkFailure<T extends LooseMessage>(
  message: T,
  errorText: string,
): T {
  if (hasErrorContent(message)) {
    return { ...message, status: STATUS_FAILED };
  }
  const contents = upsertError(lastContents(message), errorText);
  return {
    ...withLastStepContents(message, contents),
    status: STATUS_FAILED,
  };
}

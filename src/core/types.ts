export type ExerciseId = string;

export type ModeId = 'extended' | 'original' | 'short' | 'bloodPressure';

export type DayVariant = 'A' | 'B';

export interface Exercise {
  readonly id: ExerciseId;
  /** Anzeigename (Originalbezeichnung, z. B. „Horse Stance“). */
  readonly name: string;
  /** Ein Satz Ausführungshinweis auf Deutsch. */
  readonly hint: string;
}

/** Unterteilung eines Schritts mit Wechselton an jeder Grenze. */
export type Segments =
  | { readonly kind: 'sides'; readonly count: number }
  | { readonly kind: 'hold'; readonly seconds: number }
  | { readonly kind: 'breath'; readonly inSeconds: number; readonly outSeconds: number };

/** Entweder eine feste Übung oder je nach A/B-Tag eine andere. */
export type StepExercise = ExerciseId | { readonly A: ExerciseId; readonly B: ExerciseId };

/** Segmente je A/B-Variante, falls sich die Varianten unterscheiden. */
export type VariantSegments = { readonly A?: Segments; readonly B?: Segments };

export interface ScaledStep {
  readonly kind: 'scaled';
  readonly exercise: StepExercise;
  /** Dauer = round(base × weight) Sekunden. */
  readonly weight: number;
  /** Empfohlene Höchstdauer dieses Schritts in Sekunden. */
  readonly maxSeconds: number;
  readonly segments?: Segments;
  readonly variantSegments?: VariantSegments;
}

export interface FixedStep {
  readonly kind: 'fixed';
  readonly exercise: StepExercise;
  readonly seconds: number;
  readonly segments?: Segments;
  readonly variantSegments?: VariantSegments;
}

export type Step = ScaledStep | FixedStep;

export interface Mode {
  readonly id: ModeId;
  readonly name: string;
  readonly description: string;
  /** Standard-Grunddauer; `null` bedeutet: fester Ablauf ohne Regler. */
  readonly defaultBase: number | null;
  /** Wechselpause zwischen zwei Schritten in Sekunden. */
  readonly transitionSeconds: number;
  readonly steps: readonly Step[];
}

export interface PlannedStep {
  readonly exerciseId: ExerciseId;
  readonly seconds: number;
  readonly segments?: Segments;
}

export interface Plan {
  readonly modeId: ModeId;
  readonly base: number | null;
  readonly day: DayVariant;
  readonly transitionSeconds: number;
  readonly steps: readonly PlannedStep[];
  /** Summe aller Schritte plus Wechselpausen. */
  readonly totalSeconds: number;
}

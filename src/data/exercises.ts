import type { Exercise, ExerciseId } from '../core/types';

const list = [
  { id: 'lymphatic-hops', name: 'Lymphatic Hops', hint: 'Kleine federnde Sprünge auf den Fußballen, Knie weich.' },
  { id: 'body-wave', name: 'Body Wave', hint: 'Wirbel für Wirbel nach unten rollen und wieder aufrichten, ca. 4 s pro Welle.' },
  { id: 'arm-swings', name: 'Arm Swings', hint: 'Arme wechselseitig locker vor und zurück pendeln, Schultern entspannt.' },
  { id: 'dead-arms', name: 'Dead Arms', hint: 'Arme völlig schlaff, Rumpf dreht, Arme schwingen um den Körper.' },
  { id: 'trunk-twist', name: 'Trunk Twist', hint: 'Becken bleibt frontal, nur der Oberkörper dreht.' },
  { id: 'marching-claps', name: 'Marching Claps', hint: 'Knie auf Hüfthöhe, gegenüberliegende Hand tippt ans Knie.' },
  { id: 'golf-swings', name: 'Golf Swings', hint: 'Hände zusammen, ganzer Körper rotiert, hintere Ferse dreht mit.' },
  { id: 'ballet-squats', name: 'Ballet Squats', hint: 'Breiter Stand, Zehen ausgedreht, Knie über den Zehen, Rumpf aufrecht.' },
  { id: 'horse-stance', name: 'Horse Stance', hint: 'Tief sitzen, Rumpf senkrecht, ruhig atmen – nicht pressen.' },
] as const satisfies readonly Exercise[];

export type KnownExerciseId = (typeof list)[number]['id'];

export const EXERCISES: ReadonlyMap<ExerciseId, Exercise> = new Map(list.map((e) => [e.id, e]));

export function getExercise(id: ExerciseId): Exercise {
  const exercise = EXERCISES.get(id);
  if (!exercise) throw new Error(`Unbekannte Übung: ${id}`);
  return exercise;
}

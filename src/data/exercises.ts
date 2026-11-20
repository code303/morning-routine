import type { Exercise, ExerciseId } from '../core/types';

const list = [
  { id: 'lymphatic-hops', name: 'Lymphatic Hops', hint: 'Kleine federnde Sprünge auf den Fußballen, Knie weich.' },
  { id: 'body-wave', name: 'Body Wave', hint: 'In die Knie gehen, Oberkörper bleibt aufrecht; Arme schwingen mit, ca. 4 s pro Welle.' },
  { id: 'arm-swings', name: 'Arm Swings', hint: 'Arme wechselseitig locker vor und zurück pendeln, Schultern entspannt.' },
  { id: 'dead-arms', name: 'Dead Arms', hint: 'Arme völlig schlaff, Rumpf dreht, Arme schwingen um den Körper.' },
  { id: 'trunk-twist', name: 'Trunk Twist', hint: 'Hände auf den Schultern, Ellbogen außen; Becken bleibt frontal, nur der Oberkörper dreht.' },
  { id: 'marching-claps', name: 'Marching Claps', hint: 'Knie auf Hüfthöhe, beide Hände klatschen ans Knie, dann Arme gestreckt nach hinten federn.' },
  { id: 'golf-swings', name: 'Golf Swings', hint: 'Hände zusammen, ganzer Körper rotiert, hintere Ferse dreht mit.' },
  { id: 'ballet-squats', name: 'Ballet Squats', hint: 'Breiter Stand, Zehen ausgedreht, Knie über den Zehen, Rumpf aufrecht.' },
  { id: 'horse-stance', name: 'Horse Stance', hint: 'Tief sitzen, Rumpf senkrecht, ruhig atmen – nicht pressen.' },
  // Ergänzungen aus dem Bericht (Codes A–L)
  { id: 'hip-hinge', name: 'Hip Hinge', hint: 'Hüfte nach hinten schieben, Rücken gerade, langsam, ca. 4 s pro Wiederholung.' },
  { id: 'calf-raises', name: 'Wadenheben + Wippen', hint: '1 s hoch, 3 s runter; danach Knie im Schrittstand über die Zehen schieben.' },
  { id: 'push-up-ladder', name: 'Liegestütz-Leiter', hint: 'Stufe nach Gefühl: Wand, Arbeitsplatte, Knie, Boden. Körper bleibt eine Linie.' },
  { id: 'wall-angels', name: 'Wall Angels', hint: 'Rücken, Kopf und Arme an der Wand, langsam vom Torpfosten ins Y gleiten.' },
  { id: 'golden-rooster', name: 'Goldener Hahn', hint: 'Einbeinstand, Knie auf Hüfthöhe, Seite wechselt beim Signal.' },
  { id: 'bird-dog', name: 'Bird Dog', hint: 'Gegenarm und -bein strecken, 10 s halten, beim Signal Seite wechseln.' },
  { id: 'side-plank', name: 'Seitstütz', hint: 'Auf dem Unterarm, Knie gebeugt, Hüfte heben – Seite wechselt beim Signal.' },
  { id: 'glute-bridge', name: 'Glute Bridge', hint: 'Über die Fersen Becken heben, kurz halten, Wirbel für Wirbel abrollen.' },
  { id: 'dead-bug', name: 'Dead Bug', hint: 'Unterer Rücken bleibt am Boden, Gegenarm und -bein langsam strecken.' },
  { id: 'hip-flexor-stretch', name: 'Hüftbeuger-Dehnung', hint: 'Halbkniestand, Becken aufrichten, Gesäß anspannen – Seite wechselt beim Signal.' },
  { id: 'floor-rise', name: 'Aufstehen vom Boden', hint: 'Möglichst ohne Hände aufstehen.' },
  { id: 'slow-breathing', name: 'Langsame Bauchatmung', hint: 'Mit dem Kreis atmen: 4 s ein, 6 s aus.' },
] as const satisfies readonly Exercise[];

export type KnownExerciseId = (typeof list)[number]['id'];

export const EXERCISES: ReadonlyMap<ExerciseId, Exercise> = new Map(list.map((e) => [e.id, e]));

export function getExercise(id: ExerciseId): Exercise {
  const exercise = EXERCISES.get(id);
  if (!exercise) throw new Error(`Unbekannte Übung: ${id}`);
  return exercise;
}

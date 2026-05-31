import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Camera,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  FastForward,
  HelpCircle,
  ImagePlus,
  Info,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Sparkles,
  Timer,
  Video,
  X,
} from "lucide-react";
import "./styles.css";
import {
  clearCloudProgramDays,
  isSupabaseConfigured,
  loadCloudProgramDays,
  loadCloudSessions,
  saveCloudProgramDays,
  saveCloudSession,
} from "./supabaseClient";

const EXERCISES = {
  squat: {
    title: "Squat",
    muscles: "Quads, glutes, core",
    equipment: "Bodyweight, dumbbell, kettlebell, or barbell",
    cues: ["Brace your core before each rep.", "Keep knees tracking over toes.", "Stand tall by driving through mid-foot."],
    diagram: "squat",
    mediaUrl: "https://static.exercisedb.dev/media/0lQnxMZ.gif",
    mediaCredit: "ExerciseDB: weighted sissy squat",
    priority: 1,
    swaps: ["lunge", "romanian deadlift"],
  },
  "bench press": {
    title: "Bench Press",
    muscles: "Chest, triceps, shoulders",
    equipment: "Bench and barbell or dumbbells",
    cues: ["Plant your feet and squeeze shoulder blades back.", "Lower with control to mid-chest.", "Press up without bouncing the weight."],
    diagram: "press",
    mediaUrl: "https://static.exercisedb.dev/media/EIeI8Vf.gif",
    mediaCredit: "ExerciseDB: barbell bench press",
    priority: 2,
    swaps: ["push up", "shoulder press"],
  },
  "push up": {
    title: "Push-Up",
    muscles: "Chest, triceps, core",
    equipment: "Bodyweight",
    cues: ["Make a straight line from head to heels.", "Lower chest toward the floor.", "Press away while keeping elbows controlled."],
    diagram: "pushup",
    mediaUrl: "https://static.exercisedb.dev/media/I4hDWkc.gif",
    mediaCredit: "ExerciseDB: push-up",
    priority: 2,
    swaps: ["bench press", "shoulder press"],
  },
  "deadlift": {
    title: "Deadlift",
    muscles: "Hamstrings, glutes, back",
    equipment: "Barbell, kettlebell, or dumbbells",
    cues: ["Hinge at the hips with a neutral spine.", "Keep the weight close to your body.", "Stand by pushing the floor away."],
    diagram: "hinge",
    mediaUrl: "https://static.exercisedb.dev/media/nUwVh7b.gif",
    mediaCredit: "ExerciseDB: dumbbell deadlift",
    priority: 1,
    swaps: ["romanian deadlift", "squat"],
  },
  "romanian deadlift": {
    title: "Romanian Deadlift",
    muscles: "Hamstrings, glutes",
    equipment: "Barbell or dumbbells",
    cues: ["Soften your knees and push hips back.", "Lower until hamstrings feel loaded.", "Return by squeezing glutes."],
    diagram: "hinge",
    mediaUrl: "https://static.exercisedb.dev/media/wQ2c4XD.gif",
    mediaCredit: "ExerciseDB: barbell romanian deadlift",
    priority: 1,
    swaps: ["deadlift", "lunge"],
  },
  lunge: {
    title: "Lunge",
    muscles: "Quads, glutes, balance",
    equipment: "Bodyweight or dumbbells",
    cues: ["Step far enough to keep your front heel down.", "Lower under control.", "Push through the front foot to stand."],
    diagram: "lunge",
    mediaUrl: "https://static.exercisedb.dev/media/IZVHb27.gif",
    mediaCredit: "ExerciseDB: walking lunge",
    priority: 2,
    swaps: ["squat", "romanian deadlift"],
  },
  row: {
    title: "Row",
    muscles: "Back, biceps",
    equipment: "Cable, dumbbell, machine, or band",
    cues: ["Start with shoulders down and back.", "Pull elbows toward your ribs.", "Pause briefly before lowering."],
    diagram: "row",
    mediaUrl: "https://static.exercisedb.dev/media/wd4ds3s.gif",
    mediaCredit: "ExerciseDB: bodyweight standing row",
    priority: 2,
    swaps: ["lat pulldown", "curl"],
  },
  "lat pulldown": {
    title: "Lat Pulldown",
    muscles: "Lats, upper back, biceps",
    equipment: "Cable machine",
    cues: ["Lean back slightly with ribs down.", "Pull bar toward upper chest.", "Control the return overhead."],
    diagram: "pulldown",
    mediaUrl: "https://static.exercisedb.dev/media/0MlxeMn.gif",
    mediaCredit: "ExerciseDB: cable pulldown",
    priority: 2,
    swaps: ["row", "curl"],
  },
  "shoulder press": {
    title: "Shoulder Press",
    muscles: "Shoulders, triceps, core",
    equipment: "Dumbbells, machine, or barbell",
    cues: ["Brace before pressing.", "Press overhead without arching your back.", "Lower to shoulder height with control."],
    diagram: "press",
    mediaUrl: "https://static.exercisedb.dev/media/SpYC0Kp.gif",
    mediaCredit: "ExerciseDB: dumbbell bench press fallback",
    priority: 2,
    swaps: ["push up", "bench press"],
  },
  curl: {
    title: "Biceps Curl",
    muscles: "Biceps",
    equipment: "Dumbbells, cable, or barbell",
    cues: ["Keep elbows close to your sides.", "Curl without swinging.", "Lower slowly."],
    diagram: "curl",
    mediaUrl: "https://static.exercisedb.dev/media/0IgNjSM.gif",
    mediaCredit: "ExerciseDB: dumbbell standing reverse curl",
    priority: 4,
    swaps: ["row", "lat pulldown"],
  },
  plank: {
    title: "Plank",
    muscles: "Core, shoulders",
    equipment: "Bodyweight",
    cues: ["Stack elbows under shoulders.", "Squeeze glutes and brace abs.", "Stop before your lower back sags."],
    diagram: "plank",
    mediaUrl: "https://static.exercisedb.dev/media/I4hDWkc.gif",
    mediaCredit: "ExerciseDB: push-up fallback",
    priority: 5,
    swaps: ["squat", "lunge"],
  },
};

const GOALS = {
  balanced: "Balanced",
  strength: "Strength",
  beginner: "Beginner",
  quick: "Quick session",
};

const SET_WINS = [
  "Set logged. That is real work in the bank.",
  "Nice set. You showed up and moved forward.",
  "Good work. One more brick added.",
  "Strong follow-through. Keep the pace steady.",
];

const EXERCISE_WINS = [
  "Exercise complete. That is a clean win.",
  "Finished. Your future self gets credit for this.",
  "That movement is done. Solid progress.",
  "Exercise checked off. Gains are built like this.",
];

function pickMessage(messages, seed) {
  return messages[seed % messages.length];
}

function normalize(text) {
  return text.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

function findExerciseName(line) {
  const clean = normalize(line);
  const aliases = [
    ["romanian deadlift", ["romanian deadlift", "rdl"]],
    ["bench press", ["bench press", "db bench", "dumbbell bench"]],
    ["lat pulldown", ["lat pulldown", "pulldown"]],
    ["shoulder press", ["shoulder press", "overhead press", "ohp"]],
    ["push up", ["push-up", "push up", "pushup"]],
    ["deadlift", ["deadlift"]],
    ["squat", ["squat"]],
    ["lunge", ["lunge", "split squat"]],
    ["row", ["row"]],
    ["curl", ["curl"]],
    ["plank", ["plank"]],
  ];
  return aliases.find(([, names]) => names.some((name) => clean.includes(name)))?.[0] ?? null;
}

function inferExerciseTitle(line) {
  const cleaned = line
    .replace(/\b\d+\s*(?:x|sets?|reps?|repetitions?|sec|secs|seconds|min|mins|minutes|rounds?)\b/gi, "")
    .replace(/\b\d+\s*[-–—]\s*\d+\b/g, "")
    .replace(/\brest\b.*$/i, "")
    .replace(/[-:•|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!/[a-z]/i.test(cleaned)) return "";
  return cleaned.split(" ").slice(0, 5).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}

function genericExercise(title) {
  return {
    key: `custom-${normalize(title)}`,
    title,
    muscles: "From your program screenshot",
    equipment: "Check the screenshot for equipment notes",
    cues: ["Use the screenshot as the source of truth.", "Start light enough to move with control.", "Stop if the movement causes sharp pain."],
    diagram: "press",
    priority: 3,
    swaps: [],
  };
}

function parseDetails(line) {
  const setsReps = line.match(/(\d+)\s*(?:x|×|sets?\s*(?:of)?|sets?\s*x|rounds?\s*(?:of)?)\s*(\d+\s*(?:[-–—]\s*\d+)?)/i);
  const repsOnly = line.match(/(\d+\s*(?:[-–—]\s*\d+)?)\s*(?:reps?|repetitions?)\b/i);
  const setsOnly = line.match(/(\d+)\s*(?:sets?|rounds?)\b/i);
  const duration = line.match(/(\d+)\s*(sec|secs|seconds|min|mins|minutes)/i);
  const rest = line.match(/rest\s*(\d+)\s*(sec|secs|seconds|min|mins|minutes)/i);
  return {
    sets: setsReps ? Number(setsReps[1]) : setsOnly ? Number(setsOnly[1]) : duration ? 3 : 3,
    reps: setsReps ? setsReps[2].replace(/\s/g, "") : repsOnly ? repsOnly[1].replace(/\s/g, "") : duration ? `${duration[1]} ${duration[2]}` : "8-12",
    rest: rest ? toSeconds(rest[1], rest[2]) : 75,
  };
}

function toSeconds(value, unit) {
  const number = Number(value);
  return unit.toLowerCase().startsWith("min") ? number * 60 : number;
}

function buildWorkout(text, goal, options = {}) {
  const lines = normalizeWorkoutText(text);
  const found = [];
  for (let index = 0; index < lines.length; index += 1) {
    let line = lines[index];
    if (looksLikeNameOnly(line) && lines[index + 1] && looksLikeDetailsOnly(lines[index + 1])) {
      line = `${line} ${lines[index + 1]}`;
      index += 1;
    }
    const key = findExerciseName(line);
    const inferredTitle = key ? "" : inferExerciseTitle(line);
    if (!key && !inferredTitle) continue;
    const base = key ? EXERCISES[key] : genericExercise(inferredTitle);
    found.push({ key, source: line, ...base, ...parseDetails(line) });
  }

  const unique = [];
  const seen = new Set();
  for (const item of found) {
    const id = `${item.key}-${item.source}`;
    if (!seen.has(id)) {
      unique.push(item);
      seen.add(id);
    }
  }

  if (options.keepOrder) return unique;

  const ordered = unique.sort((a, b) => {
    const priorityA = goal === "beginner" ? a.priority + (a.key.includes("deadlift") ? 2 : 0) : a.priority;
    const priorityB = goal === "beginner" ? b.priority + (b.key.includes("deadlift") ? 2 : 0) : b.priority;
    return priorityA - priorityB;
  });

  return goal === "quick" ? ordered.slice(0, 5) : ordered;
}

function normalizeWorkoutText(text) {
  return text
    .replace(/[|]/g, "\n")
    .replace(/[•]/g, "\n")
    .split(/\n|;/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => !/^(week|day|workout|phase|warm\s?up|cool\s?down)$/i.test(line))
    .flatMap(splitMultiExerciseLine);
}

function splitMultiExerciseLine(line) {
  const knownTitles = Object.values(EXERCISES).map((exercise) => exercise.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`\\s+(?=(${knownTitles.join("|")})\\b)`, "i");
  return line.split(pattern).map((part) => part.trim()).filter(Boolean);
}

function hasTrainingDetails(line) {
  return /(\d+\s*(?:x|×|sets?|rounds?|reps?|repetitions?|sec|secs|seconds|min|mins|minutes))|(?:rest\s*\d+)/i.test(line);
}

function looksLikeNameOnly(line) {
  return /[a-z]/i.test(line) && !hasTrainingDetails(line) && line.length <= 60;
}

function looksLikeDetailsOnly(line) {
  return hasTrainingDetails(line) && !findExerciseName(line) && inferExerciseTitle(line).split(" ").length <= 2;
}

function Diagram({ type, large = false }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: "8", strokeLinecap: "round", strokeLinejoin: "round" };
  const guide = { fill: "none", stroke: "#d94f30", strokeWidth: "4", strokeLinecap: "round", strokeDasharray: "8 8" };
  return (
    <svg viewBox="0 0 260 190" aria-hidden="true" className={large ? "diagram diagramLarge" : "diagram"}>
      <rect x="14" y="14" width="232" height="162" rx="8" fill="#f4efe5" />
      <circle cx="88" cy="48" r="15" fill="currentColor" />
      {type === "squat" && <>
        <path {...guide} d="M150 42 C125 78 120 112 143 145" /><path {...common} d="M90 64 L112 101 L151 105" /><path {...common} d="M112 101 L82 151" /><path {...common} d="M151 105 L181 151" /><path {...common} d="M57 86 H188" /><text x="158" y="38">hips back</text>
      </>}
      {type === "hinge" && <>
        <path {...guide} d="M96 73 C124 70 154 84 181 118" /><path {...common} d="M91 63 L143 91 L182 143" /><path {...common} d="M143 91 L110 153" /><path {...common} d="M143 91 L194 92" /><path {...common} d="M55 158 H207" /><text x="137" y="72">flat back</text>
      </>}
      {type === "press" && <>
        <path {...guide} d="M72 70 V29 M106 70 V29" /><path {...common} d="M88 64 L88 124" /><path {...common} d="M88 78 L58 40" /><path {...common} d="M88 78 L121 40" /><path {...common} d="M55 36 H124" /><path {...common} d="M88 124 L61 160" /><path {...common} d="M88 124 L116 160" /><text x="137" y="42">press up</text>
      </>}
      {type === "pushup" && <>
        <path {...guide} d="M63 82 H191" /><path {...common} d="M55 91 L149 94 L208 128" /><path {...common} d="M107 93 L84 146" /><path {...common} d="M165 102 L153 148" /><path {...common} d="M46 153 H215" /><text x="70" y="69">straight line</text>
      </>}
      {type === "lunge" && <>
        <path {...guide} d="M82 62 C110 82 134 106 158 145" /><path {...common} d="M90 64 L118 108 L158 108" /><path {...common} d="M118 108 L78 154" /><path {...common} d="M158 108 L199 151" /><path {...common} d="M51 158 H216" /><text x="151" y="90">front heel down</text>
      </>}
      {type === "row" && <>
        <path {...guide} d="M200 80 H147" /><path {...common} d="M88 64 L139 92 L183 80" /><path {...common} d="M139 92 L108 154" /><path {...common} d="M139 92 L180 154" /><path {...common} d="M177 76 H217" /><text x="143" y="64">elbows back</text>
      </>}
      {type === "pulldown" && <>
        <path {...guide} d="M62 37 V97 M143 37 V97" /><path {...common} d="M55 36 H153" /><path {...common} d="M88 64 L88 132" /><path {...common} d="M88 82 L57 111" /><path {...common} d="M88 82 L121 111" /><path {...common} d="M88 132 L65 163" /><path {...common} d="M88 132 L113 163" /><text x="151" y="82">pull to chest</text>
      </>}
      {type === "curl" && <>
        <path {...guide} d="M127 116 C155 97 154 69 128 55" /><path {...common} d="M88 64 L88 130" /><path {...common} d="M88 85 L126 111 L153 82" /><path {...common} d="M88 130 L61 163" /><path {...common} d="M88 130 L116 163" /><text x="146" y="126">curl up</text>
      </>}
      {type === "plank" && <>
        <path {...guide} d="M55 94 H203" /><path {...common} d="M55 97 L142 98 L208 129" /><path {...common} d="M92 99 L75 148" /><path {...common} d="M157 105 L149 150" /><path {...common} d="M49 155 H216" /><text x="73" y="77">brace core</text>
      </>}
    </svg>
  );
}

function ExerciseMedia({ exercise, large = false }) {
  const [failed, setFailed] = useState(false);
  if (exercise.mediaUrl && !failed) {
    return (
      <figure className={large ? "exerciseMedia exerciseMediaLarge" : "exerciseMedia"}>
        <img src={exercise.mediaUrl} alt={`${exercise.title} demonstration`} onError={() => setFailed(true)} />
        <figcaption>{exercise.mediaCredit}</figcaption>
      </figure>
    );
  }
  return <Diagram type={exercise.diagram} large={large} />;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function splitIntoWeeks(days) {
  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

function fileFingerprint(file) {
  return `${file.name}-${file.size}-${file.type}-${file.lastModified}`;
}

function uniqueProgramDays(days) {
  const seen = new Set();
  return days.filter((day) => {
    const key = day.fingerprint || `${day.fileName || day.title}-${day.mediaType || "image"}-${day.text?.slice(0, 80) || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchingTips(exercise, tips) {
  const title = normalize(exercise.title);
  return tips.filter((tip) => normalize(`${tip.title} ${tip.text}`).includes(title));
}

function TipsLibrary({ tips, currentExercise }) {
  const shownTips = currentExercise ? matchingTips(currentExercise, tips) : tips;
  if (!shownTips.length) {
    return <div className="emptyState">No tips saved for this exercise yet.</div>;
  }
  return (
    <div className="tipsGrid">
      {shownTips.map((tip) => (
        <article className="tipCard" key={tip.id}>
          <video src={tip.mediaUrl} controls playsInline />
          <div>
            <h3>{tip.title}</h3>
            {tip.text && <p>{tip.text}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}

function GymMode({ workout, tips, onExit }) {
  const [items, setItems] = useState(workout);
  const [index, setIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [restLeft, setRestLeft] = useState(0);
  const [showHelp, setShowHelp] = useState(true);
  const [completedSets, setCompletedSets] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(0);
  const [validation, setValidation] = useState("You are here. Start with the first set and take it one rep at a time.");
  const current = items[index];
  const finished = index >= items.length;

  useEffect(() => {
    if (restLeft <= 0) return;
    const timer = setInterval(() => setRestLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [restLeft]);

  function completeSet() {
    if (!current) return;
    const nextCompletedSets = completedSets + 1;
    setCompletedSets(nextCompletedSets);
    if (setNumber < current.sets) {
      setSetNumber(setNumber + 1);
      setRestLeft(current.rest);
      setValidation(pickMessage(SET_WINS, nextCompletedSets));
      return;
    }
    setCompletedExercises(completedExercises + 1);
    setValidation(pickMessage(EXERCISE_WINS, completedExercises));
    setIndex(index + 1);
    setSetNumber(1);
    setRestLeft(0);
    setShowHelp(true);
  }

  function swapExercise() {
    if (!current) return;
    const replacementKey = current.swaps?.find((key) => !items.some((item) => item.key === key)) ?? current.swaps?.[0];
    const replacement = EXERCISES[replacementKey];
    if (!replacement) return;
    const next = [...items];
    next[index] = { key: replacementKey, source: "swap", ...replacement, sets: current.sets, reps: current.reps, rest: current.rest };
    setItems(next);
    setShowHelp(true);
  }

  if (finished) {
    return (
      <main className="gymMode">
        <section className="gymDone">
          <CheckCircle2 size={64} />
          <span className="validationKicker">Workout win logged</span>
          <h1>You did it.</h1>
          <p>You finished {items.length} exercises and {completedSets} sets. That is proof you are building the habit, not just thinking about it.</p>
          <button className="gymPrimary" onClick={onExit}><X size={24} />Exit gym mode</button>
        </section>
      </main>
    );
  }

  return (
    <main className="gymMode">
      <section className="gymShell">
        <div className="gymTop">
          <button className="gymQuiet" onClick={onExit}><X size={22} />Exit</button>
          <strong>{index + 1} of {items.length}</strong>
        </div>

        <div className="currentExercise">
          <span>Current exercise</span>
          <h1>{current.title}</h1>
          <p>{current.muscles}</p>
        </div>

        <div className="gymStats">
          <div><span>Set</span><strong>{setNumber} / {current.sets}</strong></div>
          <div><span>Reps</span><strong>{current.reps}</strong></div>
          <div><span>Rest</span><strong>{restLeft ? formatTime(restLeft) : `${current.rest}s`}</strong></div>
        </div>

        <div className="validationBanner" aria-live="polite">
          <CheckCircle2 size={24} />
          <div>
            <strong>{validation}</strong>
            <span>{completedSets} sets completed today</span>
          </div>
        </div>

        <div className="gymDiagram">
          <ExerciseMedia exercise={current} large />
        </div>

        {showHelp && (
          <div className="gymHelp">
            <h2>How do I do this?</h2>
            <ul>{current.cues.map((cue) => <li key={cue}><CheckCircle2 size={20} />{cue}</li>)}</ul>
            <h2 className="tipsHeading">Tips and tricks</h2>
            <TipsLibrary tips={tips} currentExercise={current} />
          </div>
        )}

        <div className="gymActions">
          <button className="gymSecondary" onClick={() => setShowHelp(!showHelp)}><HelpCircle size={24} />How do I do this?</button>
          <button className="gymSecondary" onClick={swapExercise}><FastForward size={24} />Too busy, swap exercise</button>
          <button className="gymPrimary" onClick={completeSet}><CheckCircle2 size={26} />Done</button>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [programDays, setProgramDays] = useState(() => uniqueProgramDays(JSON.parse(localStorage.getItem("programDays") || "[]")));
  const [selectedDayId, setSelectedDayId] = useState(() => uniqueProgramDays(JSON.parse(localStorage.getItem("programDays") || "[]"))[0]?.id ?? null);
  const [ocrStatus, setOcrStatus] = useState("");
  const [syncStatus, setSyncStatus] = useState(isSupabaseConfigured ? "Connecting to Supabase..." : "Local-only mode");
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem("gymPlans") || "[]"));
  const [tips, setTips] = useState(() => JSON.parse(localStorage.getItem("exerciseTips") || "[]"));
  const [inGymMode, setInGymMode] = useState(false);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const tipVideoRef = useRef(null);
  const selectedDay = programDays.find((day) => day.id === selectedDayId) ?? programDays[0] ?? null;
  const planText = selectedDay?.text ?? "";

  const workout = useMemo(() => {
    return buildWorkout(planText, "balanced", { keepOrder: true });
  }, [planText]);
  const calendarWeeks = useMemo(() => splitIntoWeeks(programDays), [programDays]);

  const totalSets = workout.reduce((sum, item) => sum + item.sets, 0);
  const estimatedMinutes = Math.max(18, Math.round(totalSets * 2.8 + workout.length * 1.5));

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    async function loadCloudData() {
      try {
        const [cloudDays, cloudSessions] = await Promise.all([loadCloudProgramDays(), loadCloudSessions()]);
        if (cancelled) return;
        if (cloudDays.length) {
          const uniqueDays = uniqueProgramDays(cloudDays);
          setProgramDays(uniqueDays);
          setSelectedDayId(uniqueDays[0].id);
          localStorage.setItem("programDays", JSON.stringify(uniqueDays));
        }
        if (cloudSessions.length) {
          setSaved(cloudSessions);
          localStorage.setItem("gymPlans", JSON.stringify(cloudSessions));
        }
        setSyncStatus("Supabase sync on");
      } catch (error) {
        setSyncStatus(`Supabase unavailable: ${error.message}`);
      }
    }
    loadCloudData();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persistProgramDays(next) {
    const uniqueDays = uniqueProgramDays(next);
    setProgramDays(uniqueDays);
    localStorage.setItem("programDays", JSON.stringify(uniqueDays));
    if (!uniqueDays.some((day) => day.id === selectedDayId)) setSelectedDayId(uniqueDays[0]?.id ?? null);
    if (!isSupabaseConfigured) return;
    try {
      await saveCloudProgramDays(uniqueDays);
      setSyncStatus("Saved to Supabase");
    } catch (error) {
      setSyncStatus(`Local saved. Supabase failed: ${error.message}`);
    }
  }

  function updateSelectedDayText(text) {
    if (!selectedDay) return;
    const next = programDays.map((day) => day.id === selectedDay.id ? { ...day, text } : day);
    persistProgramDays(next);
  }

  function updateSelectedDayTitle(title) {
    if (!selectedDay) return;
    const next = programDays.map((day) => day.id === selectedDay.id ? { ...day, title } : day);
    persistProgramDays(next);
  }

  function deleteProgramDay(id) {
    const next = programDays.filter((day) => day.id !== id);
    persistProgramDays(next);
  }

  function readMedia(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function seekVideo(video, time) {
    return new Promise((resolve, reject) => {
      const done = () => {
        video.removeEventListener("seeked", done);
        resolve();
      };
      video.addEventListener("seeked", done, { once: true });
      video.onerror = reject;
      video.currentTime = Math.min(time, Math.max(0, video.duration - 0.2));
    });
  }

  function loadVideo(url) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.src = url;
      video.onloadedmetadata = () => resolve(video);
      video.onerror = reject;
    });
  }

  async function extractVideoFrames(videoUrl, sampleCount = 6) {
    const video = await loadVideo(videoUrl);
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const canvas = document.createElement("canvas");
    const width = Math.min(960, video.videoWidth || 960);
    const height = Math.round(width * ((video.videoHeight || 540) / (video.videoWidth || 960)));
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    const frames = [];
    for (let index = 0; index < sampleCount; index += 1) {
      const time = sampleCount === 1 ? 0 : (duration * index) / (sampleCount - 1);
      await seekVideo(video, time);
      context.drawImage(video, 0, 0, width, height);
      frames.push(canvas.toDataURL("image/png"));
    }
    video.removeAttribute("src");
    video.load();
    return frames;
  }

  function mergeOcrText(chunks) {
    const seen = new Set();
    return chunks
      .flatMap((chunk) => chunk.split(/\n/))
      .map((line) => line.trim())
      .filter((line) => {
        const key = normalize(line);
        if (!key || key.length < 3 || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .join("\n");
  }

  function mediaUrlFor(day) {
    return day?.mediaUrl || day?.imageUrl || "";
  }

  function mediaTypeFor(day) {
    if (day?.mediaType) return day.mediaType;
    if (day?.imageUrl) return "image";
    return "";
  }

  async function handleFile(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const needsOcr = files.some((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    const worker = needsOcr ? await (await import("tesseract.js")).createWorker("eng") : null;
    const imported = [];
    const existingFingerprints = new Set(programDays.map((day) => day.fingerprint).filter(Boolean));
    let skipped = 0;
    setOcrStatus(`Importing ${files.length} file${files.length > 1 ? "s" : ""}...`);
    for (const [index, file] of files.entries()) {
      const fingerprint = fileFingerprint(file);
      if (existingFingerprints.has(fingerprint)) {
        skipped += 1;
        continue;
      }
      const isImage = file.type.startsWith("image/");
      const mediaUrl = await readMedia(file);
      let text = "";
      if (isImage && worker) {
        setOcrStatus(`Reading screenshot ${index + 1} of ${files.length}: ${file.name}`);
        const result = await worker.recognize(file);
        text = result.data.text.trim();
      } else if (file.type.startsWith("video/") && worker) {
        setOcrStatus(`Reading video ${index + 1} of ${files.length}: sampling frames from ${file.name}`);
        const frames = await extractVideoFrames(mediaUrl);
        const chunks = [];
        for (const [frameIndex, frame] of frames.entries()) {
          setOcrStatus(`Reading video ${index + 1} of ${files.length}: frame ${frameIndex + 1} of ${frames.length}`);
          const result = await worker.recognize(frame);
          chunks.push(result.data.text);
        }
        text = mergeOcrText(chunks);
      } else {
        setOcrStatus(`Adding file ${index + 1} of ${files.length}: ${file.name}`);
      }
      imported.push({
        id: Date.now() + index,
        title: `Day ${programDays.length + imported.length + 1}`,
        imageUrl: isImage ? mediaUrl : "",
        mediaUrl,
        mediaType: isImage ? "image" : "video",
        fingerprint,
        text,
        fileName: file.name,
        createdAt: new Date().toLocaleDateString(),
      });
    }
    if (worker) await worker.terminate();
    const next = [...programDays, ...imported];
    persistProgramDays(next);
    setSelectedDayId(imported[0]?.id ?? selectedDayId);
    setOcrStatus(`Imported ${imported.length} program day${imported.length > 1 ? "s" : ""}${skipped ? ` and skipped ${skipped} duplicate${skipped > 1 ? "s" : ""}` : ""}. Review the interpreted text before gym mode.`);
    event.target.value = "";
  }

  async function handleTipVideos(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const nextTips = [];
    setOcrStatus(`Importing ${files.length} tip video${files.length > 1 ? "s" : ""}...`);
    for (const [index, file] of files.entries()) {
      const mediaUrl = await readMedia(file);
      const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
      nextTips.push({
        id: Date.now() + index,
        title,
        mediaUrl,
        text: "",
        fileName: file.name,
        createdAt: new Date().toLocaleDateString(),
      });
    }
    const next = [...tips, ...nextTips];
    setTips(next);
    localStorage.setItem("exerciseTips", JSON.stringify(next));
    setOcrStatus(`Imported ${nextTips.length} tip video${nextTips.length > 1 ? "s" : ""}. Rename the title if needed so it matches the exercise.`);
    event.target.value = "";
  }

  function updateTipText(id, text) {
    const next = tips.map((tip) => tip.id === id ? { ...tip, text } : tip);
    setTips(next);
    localStorage.setItem("exerciseTips", JSON.stringify(next));
  }

  function updateTipTitle(id, title) {
    const next = tips.map((tip) => tip.id === id ? { ...tip, title } : tip);
    setTips(next);
    localStorage.setItem("exerciseTips", JSON.stringify(next));
  }

  async function saveWorkout() {
    if (!selectedDay || !workout.length) return;
    const next = [{ id: Date.now(), date: new Date().toLocaleDateString(), goal: selectedDay.title, workout }, ...saved].slice(0, 6);
    setSaved(next);
    localStorage.setItem("gymPlans", JSON.stringify(next));
    if (!isSupabaseConfigured) return;
    try {
      await saveCloudSession(next[0]);
      setSyncStatus("Session saved to Supabase");
    } catch (error) {
      setSyncStatus(`Session saved locally. Supabase failed: ${error.message}`);
    }
  }

  async function resetProgram() {
    setProgramDays([]);
    setSelectedDayId(null);
    setOcrStatus("");
    localStorage.removeItem("programDays");
    if (!isSupabaseConfigured) return;
    try {
      await clearCloudProgramDays();
      setSyncStatus("Program cleared from Supabase");
    } catch (error) {
      setSyncStatus(`Local reset. Supabase failed: ${error.message}`);
    }
  }

  if (inGymMode) {
    return <GymMode workout={workout} tips={tips} onExit={() => setInGymMode(false)} />;
  }

  return (
    <main>
      <section className="topbar">
        <div className="brand"><Dumbbell size={24} /><span>Gym Plan Helper</span></div>
        <div className="topActions">
          <button className="gymStart" disabled={!workout.length} onClick={() => setInGymMode(true)}><Dumbbell size={18} />Gym mode</button>
          <button className="ghost" onClick={resetProgram}><RefreshCw size={18} />Reset</button>
        </div>
      </section>

      <section className="hero">
        <div>
          <p className="eyebrow"><Sparkles size={16} />Follow your real program</p>
          <h1>Turn your 3-month screenshot plan into daily gym mode.</h1>
          <p className="subhead">Upload screenshots or videos from your program, review the workout text for each day, then run the selected day exactly from the source order.</p>
        </div>
        <div className="sessionPanel">
          <div><Timer size={20} /><span>{estimatedMinutes} min</span></div>
          <div><ClipboardList size={20} /><span>{workout.length} exercises</span></div>
          <div><Activity size={20} /><span>{totalSets} total sets</span></div>
        </div>
      </section>

      <section className="calendarPanel">
        <div className="sectionHeader">
          <h2>Program Calendar</h2>
          <span>{programDays.length ? `${programDays.length} days imported` : "Bulk upload media"}</span>
        </div>
        <div className="calendarToolbar">
          <button onClick={() => fileRef.current?.click()}><ImagePlus size={18} />Add screenshots/videos</button>
          <button onClick={() => cameraRef.current?.click()}><Camera size={18} />Take photo</button>
          <button onClick={() => tipVideoRef.current?.click()}><Video size={18} />Add tip videos</button>
          <button className="ghost" disabled={!selectedDay} onClick={() => setInGymMode(true)}><Dumbbell size={18} />Start selected day</button>
        </div>
        <div className="calendarGrid">
          {calendarWeeks.map((week, weekIndex) => (
            <div className="calendarWeek" key={`week-${weekIndex}`}>
              <div className="weekLabel">Week {weekIndex + 1}</div>
              <div className="dayTiles">
                {week.map((day, dayIndex) => {
                  const exercises = buildWorkout(day.text, "balanced", { keepOrder: true });
                  const globalIndex = weekIndex * 7 + dayIndex + 1;
                  return (
                    <button key={day.id} className={selectedDay?.id === day.id ? "dayTile active" : "dayTile"} onClick={() => setSelectedDayId(day.id)}>
                      <span>Day {globalIndex}</span>
                      <strong>{day.title}</strong>
                      <small>{exercises.length ? `${exercises.length} exercises` : "Review OCR"}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!programDays.length && <div className="emptyState">Select screenshots or videos from your 3-month program at once. They will appear here as clickable days.</div>}
        </div>
      </section>

      <section className="workspace">
        <aside className="inputPane">
          <label className="label">Selected day</label>
          <input
            className="dayTitleInput"
            value={selectedDay?.title ?? ""}
            onChange={(event) => updateSelectedDayTitle(event.target.value)}
            placeholder="Select a day from the calendar"
            disabled={!selectedDay}
          />

          <label className="label">Imported days</label>
          <div className="programDays">
            {programDays.map((day, index) => (
              <button key={day.id} className={selectedDay?.id === day.id ? "active" : ""} onClick={() => setSelectedDayId(day.id)}>
                <span>Day {index + 1}</span>
                <strong>{day.title}</strong>
                <small>{day.fileName}</small>
              </button>
            ))}
            {!programDays.length && <div className="emptyState">Upload screenshots to build your program.</div>}
          </div>
          {selectedDay && <button className="dangerButton" onClick={() => deleteProgramDay(selectedDay.id)}>Delete selected day</button>}

          <label className="label" htmlFor="plan">Workout text from selected media</label>
          <textarea
            id="plan"
            value={planText}
            onChange={(event) => updateSelectedDayText(event.target.value)}
            placeholder={"Images and videos are OCR-read here. Review the interpreted text and correct anything the app missed."}
            disabled={!selectedDay}
          />

          <div className="uploadRow">
            <button onClick={() => fileRef.current?.click()}><ImagePlus size={18} />Add media</button>
            <button onClick={() => cameraRef.current?.click()}><Camera size={18} />Use phone camera</button>
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleFile} hidden />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} hidden />
            <input ref={tipVideoRef} type="file" accept="video/*" multiple onChange={handleTipVideos} hidden />
            <button onClick={() => fileRef.current?.click()}><Video size={18} />Add video</button>
            <button disabled={!workout.length} onClick={saveWorkout}><Save size={18} />Save day</button>
          </div>

          {ocrStatus && <div className="note"><Loader2 size={18} />{ocrStatus}</div>}
          <div className="note"><Info size={18} />{syncStatus}</div>
          {mediaUrlFor(selectedDay) && mediaTypeFor(selectedDay) === "video" && (
            <video className="preview" src={mediaUrlFor(selectedDay)} controls playsInline />
          )}
          {mediaUrlFor(selectedDay) && mediaTypeFor(selectedDay) !== "video" && (
            <img className="preview" src={mediaUrlFor(selectedDay)} alt="Uploaded workout plan reference" />
          )}

          <div className="note"><Info size={18} />The uploaded photo or video is the source of truth. Review the workout text before starting Gym Mode.</div>
          <div className="note"><Camera size={18} />Images are OCR-read directly. Videos are sampled into frames, then interpreted from visible on-screen text.</div>
          <div className="note"><Camera size={18} />Exercise demos use online GIFs from ExerciseDB where available, with local diagrams as fallback.</div>
        </aside>

        <section className="planPane">
          <div className="sectionHeader">
            <h2>{selectedDay ? selectedDay.title : "Upload A Program Day"}</h2>
            <span>{workout.length ? `${workout.length} exercises` : "No screenshot loaded"}</span>
          </div>

          <div className="exerciseList">
            {!workout.length && <div className="emptyState">No parsed exercises yet. Upload a screenshot, then correct the OCR text if needed.</div>}
            {workout.map((exercise, index) => (
              <article className="exerciseCard" key={`${exercise.title}-${index}`}>
                <div className="order">{index + 1}</div>
                <div className="exerciseMain">
                  <div className="exerciseTitle">
                    <h3>{exercise.title}</h3>
                    <span>{exercise.sets} sets x {exercise.reps}</span>
                  </div>
                  <p>{exercise.muscles} • {exercise.equipment} • Rest {exercise.rest}s</p>
                  <p className="sourceLine">Parsed from: {exercise.source}</p>
                  <ul>
                    {exercise.cues.map((cue) => <li key={cue}><CheckCircle2 size={16} />{cue}</li>)}
                  </ul>
                </div>
                <ExerciseMedia exercise={exercise} />
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="tipsPanel">
        <div className="sectionHeader">
          <h2>Tips And Tricks</h2>
          <span>{tips.length ? `${tips.length} videos saved` : "Add exercise help videos"}</span>
        </div>
        <div className="calendarToolbar">
          <button onClick={() => tipVideoRef.current?.click()}><Video size={18} />Add tip videos</button>
        </div>
        {!tips.length && <div className="emptyState">Upload videos that explain form, setup, cues, or common mistakes. Put the exercise name in the title so it appears in Gym Mode for that exercise.</div>}
        <div className="tipsGrid">
          {tips.map((tip) => (
            <article className="tipCard" key={tip.id}>
              <video src={tip.mediaUrl} controls playsInline />
              <input value={tip.title} onChange={(event) => updateTipTitle(tip.id, event.target.value)} />
              <textarea value={tip.text} onChange={(event) => updateTipText(tip.id, event.target.value)} placeholder="Optional notes, cues, or transcript for matching." />
            </article>
          ))}
        </div>
      </section>

      <section className="history">
        <div className="sectionHeader">
          <h2>Saved Sessions</h2>
          <span>{saved.length ? "Stored on this device" : "No saved sessions yet"}</span>
        </div>
        <div className="historyGrid">
          {saved.map((session) => (
            <button className="historyItem" key={session.id}>
              <Play size={17} />
              <span>{session.date}</span>
              <strong>{session.goal}</strong>
              <small>{session.workout.length} exercises</small>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

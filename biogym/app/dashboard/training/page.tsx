"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { saveExerciseLog } from "@/lib/firestore";
import PremiumGate from "@/components/PremiumGate";

interface Exercise {
    name: string;
    reps: string;
    sets: string;
    time: string;
    focus: string;
    exerciseType?: 'standing' | 'floor' | 'seated';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    why?: string;
    workoutId?: string;
}

interface Recommendation {
    protocol_name?: string;
    focus_area?: string;
    exercises?: Exercise[] | string[];
}

interface AnalysisResult {
    recommendation?: Recommendation;
    [key: string]: unknown;
}

// Available workout images mapping - maps exercise names to their image files
const WORKOUT_IMAGES: Record<string, string> = {
    // Arm exercises
    "arm circle": "/workouts/arm_circle.webp",
    "arm circles": "/workouts/arm_circle.webp",
    "bicep curl": "/workouts/bicep_curl.jpeg",
    "bicep curls": "/workouts/bicep_curl.jpeg",
    "hammer curl": "/workouts/hammer_curl.webp",
    "hammer curls": "/workouts/hammer_curl.webp",
    "tricep dip": "/workouts/tricep_dip.webp",
    "tricep dips": "/workouts/tricep_dip.webp",
    "tricep kickback": "/workouts/tricep_kickback.webp",
    "tricep kickbacks": "/workouts/tricep_kickback.webp",

    // Chest exercises
    "push up": "/workouts/push_up.webp",
    "push ups": "/workouts/push_up.webp",
    "pushup": "/workouts/push_up.webp",
    "pushups": "/workouts/push_up.webp",
    "push-up": "/workouts/push_up.webp",
    "push-ups": "/workouts/push_up.webp",
    "diamond pushup": "/workouts/diamond_pushup.webp",
    "diamond push up": "/workouts/diamond_pushup.webp",
    "diamond push-up": "/workouts/diamond_pushup.webp",
    "wide pushup": "/workouts/wide_pushup.jpeg",
    "wide push up": "/workouts/wide_pushup.jpeg",
    "wide push-up": "/workouts/wide_pushup.jpeg",
    "pike pushup": "/workouts/pike_pushup.webp",
    "pike push up": "/workouts/pike_pushup.webp",
    "pike push-up": "/workouts/pike_pushup.webp",
    "chest fly": "/workouts/chest_fly.jpg",
    "chest flys": "/workouts/chest_fly.jpg",
    "chest flies": "/workouts/chest_fly.jpg",
    "pullover": "/workouts/pullover.webp",

    // Back exercises
    "bent over row": "/workouts/bent_over_row.webp",
    "bent over rows": "/workouts/bent_over_row.webp",
    "row": "/workouts/bent_over_row.webp",
    "rows": "/workouts/bent_over_row.webp",
    "upright row": "/workouts/upright_row.webp",
    "upright rows": "/workouts/upright_row.webp",
    "superman": "/workouts/superman.webp",
    "supermans": "/workouts/superman.webp",
    "good morning": "/workouts/good_morning.webp",
    "good mornings": "/workouts/good_morning.webp",
    "deadlift": "/workouts/deadlift.webp",
    "deadlifts": "/workouts/deadlift.webp",

    // Shoulder exercises
    "front raise": "/workouts/front_raise.webp",
    "front raises": "/workouts/front_raise.webp",
    "lateral raise": "/workouts/lateral_raise.webp",
    "lateral raises": "/workouts/lateral_raise.webp",
    "overhead press": "/workouts/overhead_press.jpg",
    "shoulder press": "/workouts/overhead_press.jpg",
    "shrug": "/workouts/shrug.webp",
    "shrugs": "/workouts/shrug.webp",

    // Leg exercises
    "squat": "/workouts/squat.webp",
    "squats": "/workouts/squat.webp",
    "goblet squat": "/workouts/goblet_squat.jpg",
    "goblet squats": "/workouts/goblet_squat.jpg",
    "sumo squat": "/workouts/sumo_squat.webp",
    "sumo squats": "/workouts/sumo_squat.webp",
    "squat jump": "/workouts/squat_jump.webp",
    "squat jumps": "/workouts/squat_jump.webp",
    "jump squat": "/workouts/squat_jump.webp",
    "jump squats": "/workouts/squat_jump.webp",
    "split squat": "/workouts/split_squat_left.webp",
    "split squats": "/workouts/split_squat_left.webp",
    "lunge": "/workouts/lunge_left.webp",
    "lunges": "/workouts/lunge_left.webp",
    "walking lunge": "/workouts/lunge_left.webp",
    "walking lunges": "/workouts/lunge_left.webp",
    "calf raise": "/workouts/calf-raise.webp",
    "calf raises": "/workouts/calf-raise.webp",
    "wall sit": "/workouts/wall_sit.webp",
    "step up": "/workouts/step_up_left.webp",
    "step ups": "/workouts/step_up_left.webp",
    "box jump": "/workouts/box_jump.webp",
    "box jumps": "/workouts/box_jump.webp",

    // Glute exercises
    "glute bridge": "/workouts/glute_bridge.jpeg",
    "bridge": "/workouts/glute_bridge.jpeg",
    "hip thrust": "/workouts/hip_thrust.jpg",
    "hip thrusts": "/workouts/hip_thrust.jpg",
    "donkey kick": "/workouts/donkey_kick_left.webp",
    "donkey kicks": "/workouts/donkey_kick_left.webp",

    // Core exercises
    "crunch": "/workouts/crunch.jpeg",
    "crunches": "/workouts/crunch.jpeg",
    "bicycle crunch": "/workouts/bicycle_crunch.jpg",
    "bicycle crunches": "/workouts/bicycle_crunch.jpg",
    "reverse crunch": "/workouts/reverse_crunch.webp",
    "reverse crunches": "/workouts/reverse_crunch.webp",
    "plank": "/workouts/plank.webp",
    "planks": "/workouts/plank.webp",
    "side plank": "/workouts/side_plank_left.webp",
    "side planks": "/workouts/side_plank_left.webp",
    "leg raise": "/workouts/leg_raise.webp",
    "leg raises": "/workouts/leg_raise.webp",
    "russian twist": "/workouts/russian_twist.jpeg",
    "russian twists": "/workouts/russian_twist.jpeg",
    "mountain climber": "/workouts/mountain_climber.jpg",
    "mountain climbers": "/workouts/mountain_climber.jpg",

    // Cardio/Full body
    "burpee": "/workouts/burpee.webp",
    "burpees": "/workouts/burpee.webp",
    "jumping jack": "/workouts/jumping_jack.webp",
    "jumping jacks": "/workouts/jumping_jack.webp",
    "high knee": "/workouts/high_knees.jpeg",
    "high knees": "/workouts/high_knees.jpeg",
    "butt kick": "/workouts/butt_kicks.webp",
    "butt kicks": "/workouts/butt_kicks.webp",
};

// Function to match exercise name to workout image
function getWorkoutImagePath(exerciseName: string): string | null {
    if (!exerciseName) return null;

    const normalizedName = exerciseName.toLowerCase().trim();

    // Direct match
    if (WORKOUT_IMAGES[normalizedName]) {
        return WORKOUT_IMAGES[normalizedName];
    }

    // Partial match - check if any key is contained in the exercise name
    for (const [key, path] of Object.entries(WORKOUT_IMAGES)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
            return path;
        }
    }

    // Fuzzy match - check for common exercise patterns
    const patterns = [
        { pattern: /push\s*up|pushup/i, path: "/workouts/push_up.webp" },
        { pattern: /squat/i, path: "/workouts/squat.webp" },
        { pattern: /lunge/i, path: "/workouts/lunge_left.webp" },
        { pattern: /curl/i, path: "/workouts/bicep_curl.jpeg" },
        { pattern: /plank/i, path: "/workouts/plank.webp" },
        { pattern: /crunch/i, path: "/workouts/crunch.jpeg" },
        { pattern: /row/i, path: "/workouts/bent_over_row.webp" },
        { pattern: /raise/i, path: "/workouts/lateral_raise.webp" },
        { pattern: /press/i, path: "/workouts/overhead_press.jpg" },
        { pattern: /jump/i, path: "/workouts/squat_jump.webp" },
        { pattern: /dip/i, path: "/workouts/tricep_dip.webp" },
        { pattern: /bridge|thrust/i, path: "/workouts/glute_bridge.jpeg" },
        { pattern: /dead\s*lift/i, path: "/workouts/deadlift.webp" },
    ];

    for (const { pattern, path } of patterns) {
        if (pattern.test(normalizedName)) {
            return path;
        }
    }

    return null;
}

// Generate expectation text based on exercise focus
function getExpectation(focus: string): string {
    const expectations: Record<string, string> = {
        chest: "Expect improved chest definition and reduced adipose tissue. Your next scan should show a 0.5-1.5 point improvement in chest density.",
        arms: "Consistent training will increase arm muscle visibility. Expect bicep/tricep peaks to become more pronounced in 3-4 weeks.",
        biceps: "Focus on mind-muscle connection. Your next scan should reveal improved arm density and visible bicep separation.",
        triceps: "Tricep definition will improve significantly. Expect better arm symmetry and reduced underarm fat storage.",
        shoulders: "Shoulder width and caps will become more defined. Look for improved upper body V-taper in your next analysis.",
        core: "Core stability and visible abs will improve. Expect a noticeable reduction in mid-section density score.",
        abs: "Abdominal definition will increase with consistent effort. Your next scan should show clearer muscle separation.",
        legs: "Quadricep and hamstring definition will improve. Expect better leg shape and reduced thigh adipose tissue.",
        quadriceps: "Quad sweep and separation will become visible. Your next scan should show improved lower body composition.",
        glutes: "Glute activation improves hip-to-waist ratio. Expect better posterior chain development visible in scans.",
        back: "Back width and definition will improve. Look for better lat development and reduced back fat in your next scan.",
        full: "Overall body composition will improve. Expect balanced improvements across all measured regions.",
    };

    const lowerFocus = focus.toLowerCase();
    for (const [key, value] of Object.entries(expectations)) {
        if (lowerFocus.includes(key)) {
            return value;
        }
    }
    return "Consistent training with this exercise will contribute to overall physique improvement. Track your progress with regular scans.";
}

export default function TrainingLabPage() {
    const { user } = useUser();
    const { theme } = useTheme();
    const isLight = theme === "light";
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
    const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<number>(0);

    // Timer and rep counter state
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [repCount, setRepCount] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Load result from sessionStorage on mount (clears when browser closes)
    // With user validation to prevent cross-user data leakage
    useEffect(() => {
        // Validate that session data belongs to current user
        const storedUserId = sessionStorage.getItem("biogym-session-user");
        const currentUserId = user?.id;

        if (storedUserId && currentUserId && storedUserId !== currentUserId) {
            // Data belongs to different user, don't load it
            console.log("[Training Lab] Session data belongs to different user, skipping");
            return;
        }

        const savedResult = sessionStorage.getItem("scanlab-result");
        console.log("=== TRAINING LAB DEBUG ===");
        console.log("Raw sessionStorage result:", savedResult);
        if (savedResult) {
            try {
                const parsed = JSON.parse(savedResult);
                console.log("Parsed result:", parsed);
                console.log("Recommendation:", parsed?.recommendation);
                console.log("Exercises array:", parsed?.recommendation?.exercises);
                setAnalysisResult(parsed);
            } catch (e) {
                console.error("Failed to parse scan result:", e);
            }
        }
    }, [user?.id]);



    // Timer logic
    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isTimerRunning]);

    const toggleTimer = () => setIsTimerRunning(!isTimerRunning);

    const resetTimer = () => {
        setIsTimerRunning(false);
        setTimeElapsed(0);
        setRepCount(0);
        setCurrentSet(1);
    };

    const incrementReps = () => setRepCount(prev => prev + 1);
    const decrementReps = () => setRepCount(prev => Math.max(0, prev - 1));

    const nextSet = () => {
        setCurrentSet(prev => prev + 1);
        setRepCount(0);
    };

    const toggleComplete = async (index: number) => {
        if (!user) {
            toast.error("Please sign in to track progress");
            return;
        }

        const isCompleting = !completedExercises.has(index);

        setCompletedExercises(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });

        // Only log to Firestore when marking as complete (ticking the box)
        if (isCompleting) {
            const exercise = exercises[index];
            const isString = typeof exercise === "string";

            const exerciseData = {
                name: isString ? exercise : (exercise.name || "Exercise"),
                sets: isString ? "3" : (exercise.sets || "3"),
                reps: isString ? "12" : (exercise.reps || "12"),
                time: isString ? "45-60s" : (exercise.time || "45-60s"),
                actualDuration: timeElapsed > 0 ? timeElapsed : undefined,
                focus: isString ? "General" : (exercise.focus || "General"),
                difficulty: isString ? "intermediate" : (exercise.difficulty || "intermediate"),
                workoutId: isString ? undefined : exercise.workoutId
            };

            try {
                await saveExerciseLog(user.id, exerciseData);
                toast.success("Exercise logged!");
            } catch (error) {
                console.error("Failed to save exercise log:", error);
                toast.error("Failed to save progress");
            }
        }
    };


    const recommendation = analysisResult?.recommendation;
    const exercises = recommendation?.exercises || [];
    const progress = exercises.length > 0 ? (completedExercises.size / exercises.length) * 100 : 0;

    // Get current exercise data
    const currentExercise = exercises[selectedExercise];
    const isCurrentString = typeof currentExercise === 'string';
    const currentName = isCurrentString ? currentExercise : currentExercise?.name || '';
    const currentFocus = isCurrentString ? "General" : currentExercise?.focus || '';



    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!analysisResult || exercises.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-3xl p-12 text-center border max-w-md ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}
                >
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isLight ? "bg-gray-200" : "bg-[#2a2a2a]"}`}>
                        <span className="text-4xl">🏋️</span>
                    </div>
                    <h2 className={`text-2xl font-bold mb-2 ${isLight ? "text-gray-900" : "text-white"}`}>
                        No Training Plan
                    </h2>
                    <p className={`mb-6 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                        Complete a scan to get your personalized training protocol.
                    </p>
                    <Link
                        href="/dashboard/scan"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4FF00] text-black rounded-xl font-medium hover:bg-[#c4ef00] transition-all"
                    >
                        Go to Scan Lab
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <PremiumGate feature="Training Lab" description="Access personalized workout plans with AI-generated exercise demonstrations and track your sets and reps in real-time.">
            <div className="min-h-[calc(100vh-120px)] lg:h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-4 p-0 lg:p-4 pb-24 lg:pb-4">
                {/* LEFT: Exercise Demo & Controls */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:w-1/2 flex flex-col gap-4"
                >
                    {/* Header */}
                    <div className={`rounded-2xl border px-5 py-3 ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse"></span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Exercise Demo</span>
                        </div>
                        <h2 className={`text-xl font-bold uppercase mt-1 ${isLight ? "text-gray-900" : "text-white"}`}>
                            {currentName || "Select Exercise"}
                        </h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 text-xs rounded-full bg-[#D4FF00]/20 text-[#D4FF00] font-medium">
                                Target: {currentFocus}
                            </span>
                        </div>
                    </div>

                    {/* Exercise Image Display */}
                    <div className={`rounded-2xl border overflow-hidden aspect-square flex items-center justify-center relative ${isLight ? "bg-gray-50 border-gray-200" : "bg-[#0a0a0a] border-[#2a2a2a]"}`}>
                        <AnimatePresence mode="wait">
                            {getWorkoutImagePath(currentName) ? (
                                <motion.div
                                    key={`workout-${currentName}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="w-full h-full relative"
                                >
                                    <Image
                                        src={getWorkoutImagePath(currentName)!}
                                        alt={currentName}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white/80">
                                        Exercise Demo
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center p-8 flex flex-col items-center"
                                >
                                    <div className="text-6xl mb-4 opacity-50">🏋️</div>
                                    <p className={`text-lg font-bold uppercase ${isLight ? "text-gray-900" : "text-white"}`}>
                                        {currentName || "Select an exercise"}
                                    </p>
                                    <p className={`text-sm mt-2 ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                                        {currentName ? "No demo image available for this exercise" : "Select an exercise to view details"}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Timer Display */}
                    <div className={`rounded-2xl border p-6 ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}>
                        <div className="text-center mb-4">
                            <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Timer</p>
                            <div className={`text-6xl font-mono font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                                {formatTime(timeElapsed)}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={toggleTimer}
                                className={`flex-1 py-3 rounded-xl font-bold transition-all ${isTimerRunning
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-[#D4FF00] hover:bg-[#c4ef00] text-black"
                                    }`}
                            >
                                {isTimerRunning ? "⏸ Pause" : "▶ Start"}
                            </button>
                            <button
                                onClick={resetTimer}
                                className={`px-6 py-3 rounded-xl font-medium transition-all ${isLight ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                                    }`}
                            >
                                🔄 Reset
                            </button>
                        </div>
                    </div>

                    {/* Rep Counter */}
                    <div className={`rounded-2xl border p-6 ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}>
                        <div className="text-center mb-4">
                            <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Rep Counter</p>
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <div className={`text-6xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                                    {repCount}
                                </div>
                                <div className="text-left">
                                    <p className="text-gray-500 text-xs">Set</p>
                                    <p className={`text-3xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                                        {currentSet}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={decrementReps}
                                disabled={repCount === 0}
                                className={`py-4 rounded-xl font-bold text-2xl transition-all ${repCount === 0
                                    ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                                    : isLight
                                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                                    }`}
                            >
                                −
                            </button>
                            <button
                                onClick={incrementReps}
                                className="bg-[#D4FF00] hover:bg-[#c4ef00] text-black py-4 rounded-xl font-bold text-2xl transition-all"
                            >
                                +
                            </button>
                        </div>
                        <button
                            onClick={nextSet}
                            className={`w-full mt-3 py-3 rounded-xl font-medium transition-all ${isLight ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white text-black hover:bg-gray-100"
                                }`}
                        >
                            Next Set →
                        </button>
                    </div>
                </motion.div>

                {/* RIGHT: Exercise List */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:w-1/2 flex flex-col gap-4"
                >
                    {/* Header */}
                    <div>
                        <h1 className={`text-3xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                            TRAINING <span className="italic text-[#D4FF00]">LAB</span>
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Your personalized training protocol
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className={`rounded-xl p-3 border ${isLight ? "bg-white border-gray-200" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">Progress</span>
                            <span className="text-xs font-bold text-[#D4FF00]">{completedExercises.size}/{exercises.length}</span>
                        </div>
                        <div className={`h-2 rounded-full ${isLight ? "bg-gray-100" : "bg-[#2a2a2a]"}`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full rounded-full bg-[#D4FF00]"
                            />
                        </div>
                    </div>

                    {/* Exercise List */}
                    <div className="lg:flex-1 lg:overflow-y-auto space-y-2">
                        {exercises.map((exercise, index) => {
                            const isString = typeof exercise === "string";
                            const name = isString ? exercise : (exercise.name || "Exercise");
                            const focus = isString ? "General" : (exercise.focus || "General");
                            const sets = isString ? "3 sets" : (exercise.sets || "3 sets");
                            const reps = isString ? "12 reps" : (exercise.reps || "12 reps");
                            const time = isString ? "45-60 sec" : (exercise.time || "45-60 sec");
                            const difficulty = isString ? "intermediate" : (exercise.difficulty || "intermediate");
                            const why = isString ? "" : (exercise.why || "");
                            const isCompleted = completedExercises.has(index);
                            const isExpanded = expandedExercise === index;
                            const isSelected = selectedExercise === index;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`rounded-xl border overflow-hidden transition-all ${isSelected
                                        ? "bg-[#D4FF00] border-[#D4FF00]"
                                        : isLight
                                            ? "bg-white border-gray-200 hover:border-gray-300"
                                            : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]"
                                        }`}
                                >
                                    {/* Exercise Header */}
                                    <div
                                        className="flex items-center gap-3 p-4 cursor-pointer"
                                        onClick={() => {
                                            setSelectedExercise(index);
                                            setExpandedExercise(isExpanded ? null : index);
                                        }}
                                    >
                                        {/* Number Badge */}
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isSelected
                                            ? "bg-black text-[#D4FF00]"
                                            : isLight
                                                ? "bg-gray-100 text-gray-600"
                                                : "bg-[#2a2a2a] text-gray-400"
                                            }`}>
                                            {index + 1}
                                        </div>

                                        {/* Exercise Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-bold uppercase text-sm ${isSelected ? "text-black" : isLight ? "text-gray-900" : "text-white"
                                                    }`}>
                                                    {name}
                                                </h3>
                                                {/* Difficulty Badge */}
                                                <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${difficulty === 'beginner'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : difficulty === 'advanced'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {difficulty}
                                                </span>
                                            </div>
                                            <p className={`text-xs uppercase ${isSelected ? "text-black/60" : "text-gray-500"
                                                }`}>
                                                {focus} • {sets} x {(reps || "12").replace(/[^0-9-]/g, '') || "12"}
                                            </p>
                                        </div>

                                        {/* Checkbox */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleComplete(index);
                                            }}
                                            className={`w-7 h-7 rounded-md flex items-center justify-center border-2 transition-all ${isCompleted
                                                ? "bg-[#D4FF00] border-[#D4FF00]"
                                                : isSelected
                                                    ? "border-black/30"
                                                    : "border-gray-600"
                                                }`}
                                        >
                                            {isCompleted && (
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="black" strokeWidth="2">
                                                    <path d="M2 7l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>

                                        {/* Expand Arrow */}
                                        <div className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={isSelected ? "black" : "#6b7280"} strokeWidth="2">
                                                <path d="M5 7l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={`border-t ${isSelected ? "border-black/10" : isLight ? "border-gray-100" : "border-[#2a2a2a]"}`}
                                            >
                                                <div className={`p-4 ${isSelected ? "bg-[#c4ef00]" : ""}`}>
                                                    {/* Stats Grid */}
                                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                                        <div className={`rounded-lg p-3 text-center ${isSelected ? "bg-black/10" : isLight ? "bg-gray-50" : "bg-[#0f0f0f]"
                                                            }`}>
                                                            <p className={`text-lg font-bold ${isSelected ? "text-black" : isLight ? "text-gray-900" : "text-white"}`}>
                                                                {sets}
                                                            </p>
                                                            <p className={`text-xs ${isSelected ? "text-black/60" : "text-gray-500"}`}>Sets</p>
                                                        </div>
                                                        <div className={`rounded-lg p-3 text-center ${isSelected ? "bg-black/10" : isLight ? "bg-gray-50" : "bg-[#0f0f0f]"
                                                            }`}>
                                                            <p className={`text-lg font-bold ${isSelected ? "text-black" : isLight ? "text-gray-900" : "text-white"}`}>
                                                                {reps}
                                                            </p>
                                                            <p className={`text-xs ${isSelected ? "text-black/60" : "text-gray-500"}`}>Reps</p>
                                                        </div>
                                                        <div className={`rounded-lg p-3 text-center ${isSelected ? "bg-black/10" : isLight ? "bg-gray-50" : "bg-[#0f0f0f]"
                                                            }`}>
                                                            <p className={`text-lg font-bold ${isSelected ? "text-black" : isLight ? "text-gray-900" : "text-white"}`}>
                                                                {time}
                                                            </p>
                                                            <p className={`text-xs ${isSelected ? "text-black/60" : "text-gray-500"}`}>Time</p>
                                                        </div>
                                                    </div>

                                                    {/* Why This Exercise - from Gemini */}
                                                    {why && (
                                                        <div className={`rounded-lg p-4 mb-4 ${isSelected ? "bg-black/10" : isLight ? "bg-gray-50" : "bg-[#0f0f0f]"
                                                            }`}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-lg">🎯</span>
                                                                <span className={`text-xs font-bold uppercase ${isSelected ? "text-black" : isLight ? "text-gray-700" : "text-gray-300"
                                                                    }`}>
                                                                    Why This Exercise
                                                                </span>
                                                            </div>
                                                            <p className={`text-sm leading-relaxed ${isSelected ? "text-black/80" : isLight ? "text-gray-600" : "text-gray-400"
                                                                }`}>
                                                                {why}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Expectation Box */}
                                                    <div className={`rounded-lg p-4 ${isSelected ? "bg-black/10" : isLight ? "bg-gray-50" : "bg-[#0f0f0f]"
                                                        }`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-lg">📈</span>
                                                            <span className={`text-xs font-bold uppercase ${isSelected ? "text-black" : isLight ? "text-gray-700" : "text-gray-300"
                                                                }`}>
                                                                What to Expect (2-4 Weeks)
                                                            </span>
                                                        </div>
                                                        <p className={`text-sm leading-relaxed ${isSelected ? "text-black/80" : isLight ? "text-gray-600" : "text-gray-400"
                                                            }`}>
                                                            {getExpectation(focus)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Back to Insights Button */}
                    <Link
                        href="/dashboard/insights"
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${isLight ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                            }`}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 12l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to Insights
                    </Link>
                </motion.div>
            </div>
        </PremiumGate>
    );
}

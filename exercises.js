// KneeCapacity - Exercise Library
// Based on Keith Barr's isometric protocols

const EXERCISES = [
    {
        name: "Spanish Squat",
        target: "Quadriceps + Effusion Control",
        description: "Band behind knees, sit back into squat. Keep torso upright, shins vertical. Band prevents forward knee travel and unloads patellofemoral joint.",
        duration: "4-5 sets × 30-45 seconds, 60 sec rest",
        why: "Strongly activates quads while minimizing joint compression. Excellent for calming swelling while maintaining strength."
    },
    {
        name: "Wall Sit",
        target: "Quadriceps Endurance",
        description: "Back against wall, slide to 90° knee angle. Keep feet flat, knees aligned with ankles. Hold without letting knees drift inward.",
        duration: "3-4 sets × 45-60 seconds",
        why: "Classic isometric hold. Particularly valuable during flare-ups when dynamic exercises irritate the joint."
    },
    {
        name: "Slow Step-Downs",
        target: "Landing Control + Lateral OA Protection",
        description: "Stand on step, slowly lower opposite foot to ground over 3-4 seconds. Light toe tap, step back up. Knee tracks straight.",
        duration: "3 sets × 6-8 per leg",
        why: "Trains deceleration control and protects lateral compartment. Mimics landing mechanics from volleyball."
    },
    {
        name: "Single-Leg RDL",
        target: "Posterior Chain + Hip Control",
        description: "Stand on one leg, hinge at hip with flat back. Lower with slight knee bend. Focus on control, not depth.",
        duration: "3 sets × 6-8 per side",
        why: "Reduces valgus collapse and lateral knee stress. Improves single-leg stability for athletic movements."
    },
    {
        name: "Hamstring Bridge",
        target: "Hamstrings + Joint Unloading",
        description: "Lie on back, one foot on ground. Drive through heel to lift hips. Pause 1 second at top, lower slowly.",
        duration: "3 sets × 10-12 per leg",
        why: "Reduces anterior knee load. Strong posterior chain = less stress on knee joint during activities."
    },
    {
        name: "Terminal Knee Extensions",
        target: "Quad Activation Post-Swelling",
        description: "Band around back of knee, step back for tension. Squeeze knee straight against resistance, hold 2 seconds.",
        duration: "2-3 sets × 12-15 reps",
        why: "Restores quad firing after swelling (effusion inhibits quad activation). Very joint-friendly."
    }
];

window.EXERCISES = EXERCISES;

// KneeCapacity - Enhanced Exercise Library with Expandable Details
// Based on Keith Barr protocols + specialist recommendations

const EXERCISES = [
    {
        id: "spanish-squat",
        name: "Spanish Squat (Isometric)",
        category: "Knee-Tendon + Control",
        availability: "always",
        phase: ["CALM"],
        dosage: "4 sets x 45s hold",
        description: "Isometric quad strengthening with band resistance behind knees, reducing patellar compression while building tendon tolerance.",
        why: "Builds quad strength while minimizing joint stress - ideal for reactive knees.",
        setup: [
            "Anchor band at knee height",
            "Loop band behind both knees",
            "Step forward until band is taut",
            "Feet shoulder-width apart"
        ],
        execution: [
            "Sit back slowly to ~90° knee angle",
            "Shins stay vertical - resist band pull",
            "Hold the position steadily",
            "Breathe normally throughout"
        ],
        targetMuscles: "Quadriceps, Patellar Tendon",
        tempo: "3s down, 45s hold, 3s up"
    },
    {
        id: "wall-sit",
        name: "Wall Sit (Isometric)",
        category: "Knee-Tendon + Control",
        availability: "always",
        phase: ["CALM"],
        dosage: "3 sets x 45s hold",
        description: "Classic isometric quad exercise using body weight against a wall for support and stability.",
        why: "Safe way to load quads without movement - perfect for flare-ups.",
        setup: [
            "Stand with back against wall",
            "Feet 12-18 inches from wall",
            "Shoulder-width stance"
        ],
        execution: [
            "Slide down wall slowly to 90°",
            "Keep back flat against wall",
            "Hold position, breathe steadily"
        ],
        targetMuscles: "Quadriceps, Glutes",
        tempo: "3s down, 45s hold, 3s up"
    },
    {
        id: "step-downs",
        name: "Slow Step-Downs (Eccentric)",
        category: "Knee-Tendon + Control",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 8-10 reps",
        description: "Controlled eccentric loading of the quad and VMO through single-leg step descent.",
        why: "Eccentric strength is critical for tendon health and stair/hill control.",
        setup: [
            "6-8 inch step or stair",
            "Stand on affected leg",
            "Use rail/wall for balance"
        ],
        execution: [
            "Slowly bend standing knee (3-4s lower)",
            "Lower opposite heel to tap floor",
            "Keep knee tracking over 2nd toe",
            "Push back up through working leg"
        ],
        targetMuscles: "Quadriceps (Eccentric), VMO, Hip Stabilizers",
        tempo: "4s down, 1s tap, 1s up"
    },
    {
        id: "single-leg-rdl",
        name: "Single-Leg RDL",
        category: "Hip + Pelvis Control",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 8-12 reps",
        description: "Hip hinge pattern on one leg to strengthen posterior chain and improve balance.",
        why: "Strong hips take load off the knee - essential for knee longevity.",
        setup: [
            "Stand on affected leg",
            "Slight bend in standing knee",
            "Hold weight or use wall for balance"
        ],
        execution: [
            "Hinge forward from hips, back flat",
            "Free leg extends back for balance",
            "Lower with control until stretch felt",
            "Drive through heel to return"
        ],
        targetMuscles: "Hamstrings, Glutes, Hip Stabilizers",
        tempo: "3s down, 1s bottom, 1s up"
    },
    {
        id: "hamstring-bridge",
        name: "Single-Leg Hamstring Bridge",
        category: "Hamstrings + Posterior Chain",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 12 reps",
        description: "Isolated hamstring and glute work from supine position with single-leg emphasis.",
        why: "Balances quad-dominant patterns and protects knee from hyperextension.",
        setup: [
            "Lie on back, one foot on floor",
            "Opposite leg extended 6 inches up",
            "Arms at sides for stability"
        ],
        execution: [
            "Drive through heel to lift hips",
            "Squeeze glute at top",
            "Lower slowly without touching floor"
        ],
        targetMuscles: "Hamstrings, Glute Max",
        tempo: "2s up, 1s hold, 3s down"
    },
    {
        id: "tke",
        name: "Terminal Knee Extensions (TKEs)",
        category: "Knee-Tendon + Control",
        availability: "always",
        phase: ["CALM"],
        dosage: "3 sets x 15 reps",
        description: "Isolated VMO activation using band resistance in the final 15° of knee extension.",
        why: "Targets the VMO specifically - critical for patellar tracking and stability.",
        setup: [
            "Anchor band at knee height",
            "Loop band behind affected knee",
            "Step forward until tension is felt"
        ],
        execution: [
            "Start with knee slightly bent",
            "Squeeze quad to straighten knee fully",
            "Hold lockout for 2 seconds",
            "Slowly release back to start"
        ],
        targetMuscles: "Vastus Medialis Oblique (VMO)",
        tempo: "1s extend, 2s hold, 2s release"
    },
    {
        id: "lateral-band-walk",
        name: "Lateral Band Walks",
        category: "Hip + Pelvis Control",
        availability: "always",
        phase: ["PRIME"],
        dosage: "3 sets x 12-15 steps/side",
        description: "Lateral movement against band resistance to activate hip abductors and stabilizers.",
        why: "Weak hips cause knee valgus (collapse) - this prevents it.",
        setup: [
            "Band above knees or ankles",
            "Athletic squat (~30° knee bend)",
            "Feet hip-width apart"
        ],
        execution: [
            "Step sideways with lead foot",
            "Follow with trailing foot slowly",
            "Maintain band tension throughout",
            "Keep knees aligned over toes"
        ],
        targetMuscles: "Gluteus Medius, Hip Abductors",
        tempo: "Controlled steps, ~1s per step"
    },
    {
        id: "mini-squat",
        name: "Mini Squats (Partial Range)",
        category: "Knee-Tendon + Control",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 10-15 reps",
        description: "Partial-range squat focusing on the first 60° of knee flexion to build strength safely.",
        why: "Builds foundational squat strength without deep knee flexion stress.",
        setup: [
            "Feet shoulder-width apart",
            "Toes slightly turned out",
            "Hold support or arms forward"
        ],
        execution: [
            "Lower slowly to ~60° knee bend",
            "Keep weight in heels",
            "Knees track over 2nd toe",
            "Drive up through heels to stand"
        ],
        targetMuscles: "Quadriceps, Glutes",
        tempo: "3s down, 1s bottom, 2s up"
    },
    {
        id: "calf-raise",
        name: "Calf Raises (Single-Leg)",
        category: "Calf/Ankle + Foot",
        availability: "always",
        phase: ["PRIME"],
        dosage: "3 sets x 15 reps",
        description: "Single-leg calf strengthening for ankle stability and push-off power.",
        why: "Strong calves stabilize the ankle and reduce knee compensation during movement.",
        setup: [
            "Stand on affected leg",
            "Use wall for balance",
            "Opposite leg bent behind you"
        ],
        execution: [
            "Rise onto ball of foot high",
            "Hold top position for 1s",
            "Lower slowly with control",
            "Don't let heel slam down"
        ],
        targetMuscles: "Gastrocnemius, Soleus, Ankle Stabilizers",
        tempo: "2s up, 1s hold, 3s down"
    },
    {
        id: "balance-single-leg",
        name: "Single-Leg Balance",
        category: "Calf/Ankle + Foot",
        availability: "always",
        phase: ["PRIME"],
        dosage: "3 sets x 30-45s",
        description: "Static balance drill on one leg to improve proprioception and ankle/knee stability.",
        why: "Better balance = better knee control during sports and daily life.",
        setup: [
            "Stand near wall/support",
            "Weight on affected leg",
            "Opposite foot 6 inches off floor"
        ],
        execution: [
            "Maintain slight bend in standing knee",
            "Hold position steadily",
            "Eyes open (easier) or closed (harder)"
        ],
        targetMuscles: "Ankle/Knee Stabilizers, Core",
        tempo: "Steady hold"
    },
    {
        id: "mini-jumps",
        name: "Mini Vertical Jumps",
        category: "Low-Impact Return-to-Jump",
        availability: "GREEN-only",
        phase: ["PRIME"],
        dosage: "3 sets x 5-8 reps",
        description: "Small vertical jumps focusing on soft landings and tendon reactivity.",
        why: "Prepares tendons for sport demands - only when knee is GREEN.",
        setup: [
            "Athletic stance, feet hip-width",
            "Slight knee bend",
            "Clear space around you"
        ],
        execution: [
            "Small jump up (2-4 inches)",
            "Land on balls of feet first",
            "Absorb into soft, quiet landing",
            "Pause between jumps"
        ],
        targetMuscles: "Full Lower Body, Tendons",
        tempo: "Explosive up, soft landing"
    },
    {
        id: "quad-sets",
        name: "Quad Sets (Isometric)",
        category: "Knee-Tendon + Control",
        availability: "always",
        phase: ["CALM"],
        dosage: "3 sets x 10 reps",
        description: "Gentle isometric quad contraction without joint movement - the safest quad exercise.",
        why: "Maintains quad activation during flare-ups when movement hurts.",
        setup: [
            "Sit or lie with legs straight",
            "Place small towel under knee",
            "Relax completely to start"
        ],
        execution: [
            "Squeeze quad to push knee into towel",
            "Hold maximal squeeze 5s",
            "Relax completely for 3s"
        ],
        targetMuscles: "Quadriceps, VMO",
        tempo: "5s squeeze, 3s rest"
    },
    {
        id: "heel-slides",
        name: "Heel Slides (ROM)",
        category: "Knee Mobility + ROM",
        availability: "always",
        phase: ["CALM"],
        dosage: "2 sets x 15 reps",
        description: "Gentle knee flexion and extension to maintain or improve range of motion.",
        why: "Prevents stiffness and maintains mobility without loading the joint.",
        setup: [
            "Lie on back or sit in chair",
            "Leg extended on smooth surface",
            "Towel under heel if needed"
        ],
        execution: [
            "Slowly slide heel toward butt",
            "Bend as far as comfortable",
            "Hold 2s, then slide back straight"
        ],
        targetMuscles: "Knee Flexors/Extensors",
        tempo: "3s in, 2s hold, 3s out"
    },
    {
        id: "side-plank-leg-raise",
        name: "Side Plank + Top-Leg Raise",
        category: "Hip + Pelvis Control",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 8-12 reps/side",
        description: "Combined core stability and hip abduction exercise in side plank position.",
        why: "Strengthens hip abductors and core together - key for knee alignment.",
        setup: [
            "Lie on side, elbow under shoulder",
            "Stack feet or stagger for stability",
            "Engage core before lifting"
        ],
        execution: [
            "Lift into side plank (straight line)",
            "Raise top leg 6-12 inches slowly",
            "Hold 2s at top",
            "Lower with control"
        ],
        targetMuscles: "Glute medius, hip abductors, core stabilizers",
        tempo: "Slow controlled raise, 2s hold, slow lower"
    },
    {
        id: "hip-airplanes",
        name: "Hip Airplanes (Assisted)",
        category: "Hip + Pelvis Control",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 5-8 reps/side",
        description: "Advanced single-leg balance with hip rotation to challenge deep hip stabilizers.",
        why: "Improves hip rotator strength and single-leg stability for cutting movements.",
        setup: [
            "One hand on wall/support",
            "Stand on one leg",
            "Slight knee bend"
        ],
        execution: [
            "Hinge torso forward flat",
            "Rotate hips 'open' to side",
            "Rotate hips 'closed' to ground",
            "Move slowly and feel hip work"
        ],
        targetMuscles: "Deep Hip Rotators, Glute Medius",
        tempo: "3s open, 3s closed"
    },
    {
        id: "copenhagen-plank-short",
        name: "Copenhagen Plank (Short Lever)",
        category: "Hip + Pelvis Control",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 20-30s hold",
        description: "Intense adductor strengthening exercise in side plank position with elevated leg.",
        why: "Strong adductors prevent groin strains and stabilize the pelvis during movement.",
        setup: [
            "Top knee on bench/chair",
            "Bottom leg free below",
            "Elbow under shoulder"
        ],
        execution: [
            "Lift hips into side plank",
            "Maintain straight line head to knee",
            "Hold position steadily"
        ],
        targetMuscles: "Adductors (Inner Thigh), Core",
        tempo: "Steady hold"
    },
    {
        id: "lateral-step-up",
        name: "Lateral Step-Up (Controlled)",
        category: "Hip + Pelvis Control",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 6-10 reps/side",
        description: "Lateral step-up emphasizing glute medius and frontal plane control.",
        why: "Builds lateral hip strength critical for preventing knee valgus collapse.",
        setup: [
            "Stand sideways to step",
            "Inner foot on step, outer on floor",
            "Chest up, hands for balance"
        ],
        execution: [
            "Drive through inner heel to stand",
            "Lower outer foot slowly (3s)",
            "Light push off ground to return"
        ],
        targetMuscles: "Quadriceps, Glute Medius, Balance",
        tempo: "2s up, 3s down"
    },
    {
        id: "slider-hamstring-curls",
        name: "Slider Hamstring Curls",
        category: "Hamstrings + Posterior Chain",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 6-10 reps",
        description: "Dynamic hamstring curl using sliders or towels while maintaining bridge position.",
        why: "Builds hamstring strength in a knee-friendly position without heavy loading.",
        setup: [
            "Lie on back, heels on towels/sliders",
            "Hips lifted in bridge position",
            "Arms at sides for stability"
        ],
        execution: [
            "Slide heels out slowly",
            "Pull heels back toward butt",
            "Keep hips elevated throughout"
        ],
        targetMuscles: "Hamstrings, Glutes",
        tempo: "3s out, 2s in"
    },
    {
        id: "nordic-hamstring-assisted",
        name: "Nordic Hamstring Eccentrics (Assisted)",
        category: "Hamstrings + Posterior Chain",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 3-6 reps",
        description: "Maximal eccentric hamstring loading with assistance for controlled descent.",
        why: "Gold standard for hamstring injury prevention and eccentric strength.",
        setup: [
            "Anchor heels under rail or partner",
            "Kneeling on pad, core braced",
            "Band or hands ready for support"
        ],
        execution: [
            "Lower torso slowly forward",
            "Use hamstrings to resist gravity",
            "Catch self with hands at bottom"
        ],
        targetMuscles: "Hamstrings (Maximal Eccentric)",
        tempo: "4-5s slow lower"
    },
    {
        id: "hip-thrust",
        name: "Hip Thrust (Double or Single)",
        category: "Hamstrings + Posterior Chain",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 8-12 reps",
        description: "Hip extension exercise with upper back supported on bench for maximal glute activation.",
        why: "Strongest glute builder - powerful glutes protect knees during running and jumping.",
        setup: [
            "Upper back on bench edge",
            "Feet flat, hip-width",
            "Hips off ground to start"
        ],
        execution: [
            "Drive through heels to lift hips",
            "Squeeze glutes at top",
            "Lower with control"
        ],
        targetMuscles: "Glute Max, Hamstrings",
        tempo: "2s up, 1s hold, 2s down"
    },
    {
        id: "good-morning-light",
        name: "Good Morning (Light/Mod)",
        category: "Hamstrings + Posterior Chain",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 8 reps",
        description: "Hip hinge pattern with hands behind head to strengthen posterior chain and spinal erectors.",
        why: "Teaches proper hip hinge mechanics and builds back/hamstring coordination.",
        setup: [
            "Feet shoulder-width, soft knees",
            "Hands behind head (prisoner style)",
            "Back flat, core engaged"
        ],
        execution: [
            "Hinge forward at hips",
            "Lower until stretch in hamstrings",
            "Drive hips forward to stand"
        ],
        targetMuscles: "Hamstrings, Erector Spinae",
        tempo: "3s down, 2s up"
    },
    {
        id: "soleus-raises-bent",
        name: "Soleus Raises (Bent-Knee)",
        category: "Calf/Ankle + Foot",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 12-20 reps",
        description: "Isolated soleus strengthening with bent knees to target the deep calf muscle.",
        why: "Soleus is critical for walking/running endurance and ankle stability.",
        setup: [
            "Seated or in quarter-squat",
            "Knees bent to 90°",
            "Feet flat on floor"
        ],
        execution: [
            "Rise onto balls of feet",
            "Hold 1s at top",
            "Lower slowly with control"
        ],
        targetMuscles: "Soleus (Deep Calf)",
        tempo: "2s up, 1s hold, 3s down"
    },
    {
        id: "tibialis-raises-wall",
        name: "Tibialis Raises (Against Wall)",
        category: "Calf/Ankle + Foot",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 15-25 reps",
        description: "Anterior shin strengthening to balance calf muscles and prevent shin splints.",
        why: "Prevents shin splints and improves ankle dorsiflexion control.",
        setup: [
            "Back against wall",
            "Feet 12 inches from wall",
            "Legs straight"
        ],
        execution: [
            "Lift toes as high as possible",
            "Hold 1s at top",
            "Lower slowly to floor"
        ],
        targetMuscles: "Tibialis Anterior (Front of Shin)",
        tempo: "1s up, 1s hold, 2s down"
    },
    {
        id: "foot-tripod-holds",
        name: "Foot Tripod Short-Foot Holds",
        category: "Calf/Ankle + Foot",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 30-45s hold",
        description: "Intrinsic foot muscle activation by creating and holding a strong arch position.",
        why: "Strong foot arches provide a stable foundation for the entire kinetic chain.",
        setup: [
            "Standing or sitting, feet flat",
            "Weight even on big toe, pinky, heel",
            "Keep toes long (don't curl)"
        ],
        execution: [
            "Pull arch up by shortening foot",
            "Maintain 3 points of contact",
            "Hold the contraction steadily"
        ],
        targetMuscles: "Intrinsic Foot Muscles, Arch Support",
        tempo: "Steady hold"
    },
    {
        id: "ankle-band-work",
        name: "Ankle Eversion/Inversion Band Work",
        category: "Calf/Ankle + Foot",
        availability: "always",
        phase: ["BUILD"],
        dosage: "2-3 sets x 15 reps/side",
        description: "Isolated ankle stabilizer strengthening using band resistance in multiple planes.",
        why: "Prevents ankle sprains and improves lateral stability during cutting movements.",
        setup: [
            "Seated, legs straight",
            "Band around mid-foot",
            "Resistance from side anchor"
        ],
        execution: [
            "Turn foot 'out' (eversion)",
            "Return slowly to neutral",
            "Turn foot 'in' (inversion)"
        ],
        targetMuscles: "Ankle Stabilizers (Peroneals/Tibials)",
        tempo: "2s out, 2s in"
    },
    {
        id: "reverse-sled-drag",
        name: "Reverse Sled Drag",
        category: "Knee-Tendon + Control",
        availability: "always",
        phase: ["BUILD"],
        dosage: "6-10 min intervals",
        description: "Backward walking with sled resistance for continuous quad and tendon loading.",
        why: "Builds knee tendon capacity through prolonged, low-intensity loading.",
        setup: [
            "Sled or heavy band to waist",
            "Face the anchor point",
            "Step back until tension felt"
        ],
        execution: [
            "Walk backward with small steps",
            "Focus on pushing through toes",
            "Maintain upright torso"
        ],
        targetMuscles: "Quadriceps, Knee Tendon Health",
        tempo: "Constant pace"
    },
    {
        id: "poliquin-step-up",
        name: "Poliquin Step-Up",
        category: "Knee-Tendon + Control",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 8 reps/side",
        description: "VMO-focused step-up variation using a low block and inner heel elevation.",
        why: "Maximally targets VMO for patellar tracking and terminal extension strength.",
        setup: [
            "Inner heel on 2-4 inch block",
            "One foot on block, other in air",
            "Hands for balance"
        ],
        execution: [
            "Lower outer heel to floor",
            "Drive through block heel to return",
            "Keep inner heel elevated throughout"
        ],
        targetMuscles: "VMO, Knee Terminal Extension",
        tempo: "2s down, 1s up"
    },
    {
        id: "split-squat-iso",
        name: "Split Squat Iso Hold",
        category: "Knee-Tendon + Control",
        availability: "always",
        phase: ["BUILD"],
        dosage: "3 sets x 30-45s/side",
        description: "Static hold in split squat position to build isometric strength and tendon tolerance.",
        why: "Builds tendon capacity through time under tension without movement stress.",
        setup: [
            "One foot forward, one back",
            "Lower into mid-range lunge",
            "Maintain upright torso"
        ],
        execution: [
            "Hold the static position steadily",
            "Keep weight distributed evenly",
            "Breathe and engage core"
        ],
        targetMuscles: "Quadriceps, Glutes, Tendon Tolerance",
        tempo: "Steady hold"
    },
    {
        id: "leg-extension-iso-mid",
        name: "Leg Extension Isometric (Mid-Range)",
        category: "Knee-Tendon + Control",
        availability: "always",
        phase: ["BUILD"],
        dosage: "4 sets x 30-45s",
        description: "Maximal isometric quad contraction at 60° knee angle with resistance.",
        why: "Builds maximal quad strength at the most functional knee angle.",
        setup: [
            "Seated, resistance at ankles",
            "Knee at 60° angle",
            "Core braced"
        ],
        execution: [
            "Push against resistance hard",
            "Maintain the 60° angle",
            "Hold maximal effort steadily"
        ],
        targetMuscles: "Quadriceps (Maximal Activation)",
        tempo: "Steady hold"
    },
    {
        id: "pogo-hops",
        name: "Pogo Hops (Low Amplitude)",
        category: "Low-Impact Return-to-Jump",
        availability: "GREEN-only",
        phase: ["PRIME"],
        dosage: "3 sets x 20-30s",
        description: "Continuous ankle-driven bouncing to develop tendon stiffness and reactive strength.",
        why: "Builds tendon spring and prepares for running/jumping - GREEN days only.",
        setup: [
            "Athletic stance, feet together",
            "Hands on hips",
            "Stay on balls of feet"
        ],
        execution: [
            "Bouncy hops using only ankles",
            "Minimize ground contact time",
            "Keep landings quiet"
        ],
        targetMuscles: "Tendon Stiffness, Ankle Reactivity",
        tempo: "Fast, bouncy rhythm"
    },
    {
        id: "snap-down-to-stick",
        name: "Snap-Down to Stick",
        category: "Low-Impact Return-to-Jump",
        availability: "GREEN-only",
        phase: ["PRIME"],
        dosage: "3 sets x 5 reps",
        description: "Quick drop into athletic landing position to practice deceleration mechanics.",
        why: "Teaches safe landing patterns before progressing to full jumps.",
        setup: [
            "Stand high on toes",
            "Arms overhead",
            "Ready to drop"
        ],
        execution: [
            "Quickly snap into athletic landing",
            "Absorb force softly",
            "Hold position 2s ('stick it')"
        ],
        targetMuscles: "Landing Mechanics, Deceleration",
        tempo: "Explosive snap, 2s hold"
    },
    {
        id: "lateral-line-hops-tiny",
        name: "Lateral Line Hops (Tiny Range)",
        category: "Low-Impact Return-to-Jump",
        availability: "GREEN-only",
        phase: ["PRIME"],
        dosage: "3 sets x 15-25s",
        description: "Fast, small lateral hops over a line to develop lateral reactive strength.",
        why: "Prepares for cutting and lateral movements in sports - GREEN days only.",
        setup: [
            "Find a line on ground",
            "Athletic stance",
            "Ready to move sideways"
        ],
        execution: [
            "Quick sideways hops over line",
            "Keep range tiny and fast",
            "Stay light on feet"
        ],
        targetMuscles: "Lateral Stability, Reactive Strength",
        tempo: "Quick, rhythmic hops"
    }
];

// Helper function to get exercise by ID
window.getExerciseById = (id) => EXERCISES.find(ex => ex.id === id);

// Helper function to format duration for display
window.formatExerciseDuration = (ex) => {
    return ex.dosage;
};

window.EXERCISES = EXERCISES;

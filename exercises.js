// KneeCapacity - Enhanced Exercise Library with Tracking
// Based on Keith Barr protocols + specialist recommendations

const EXERCISES = [
    {
        id: "spanish-squat",
        name: "Spanish Squat (Isometric)",
        category: "Quad Strength + Swelling Control",
        target: "Quadriceps, Patellar Tendon",
        description: "Place resistance band or strap behind both knees. Step forward to create tension. Sit back into squat position maintaining upright torso. Shins should stay vertical - the band prevents forward knee travel.",
        setup: [
            "Anchor band at knee height",
            "Loop band behind both knees",
            "Step forward until band is taut",
            "Feet shoulder-width apart"
        ],
        execution: [
            "Sit back slowly (3-4 sec) to ~90° knee angle",
            "Keep torso upright, core engaged",
            "Shins stay vertical - resist band pull",
            "Hold the position steadily",
            "Breathe normally throughout",
            "Release slowly (3-4 sec)"
        ],
        dosage: {
            sets: 4,
            reps: 5,
            holdTime: 45,
            restBetweenSets: 60,
            tempo: "Slow in (3s) - Hold (45s) - Slow out (3s)"
        },
        why: "Unloads patellofemoral joint while maximally activating quads. The posterior band force reduces anterior knee shear. BEST exercise for effusion control - can calm swelling while building strength.",
        watchFor: [
            "Sharp pain (stop immediately)",
            "Knees traveling past toes (adjust band)",
            "Holding breath (breathe!)",
            "Valgus collapse (knees caving in)"
        ],
        rpe: "6-7/10 (moderate effort, sustainable)",
        phase: ["Calm", "Build"],
        modifications: {
            easier: "Reduce depth to 60° knee angle, or shorten hold to 30s",
            harder: "Increase hold time to 60s, or add light weight vest"
        }
    },
    {
        id: "wall-sit",
        name: "Wall Sit (Isometric)",
        category: "Quad Endurance + Pain Relief",
        target: "Quadriceps, Mental Toughness",
        description: "Back against wall, slide down to 90° knee angle (or shallower if painful). Feet flat on ground, hip-width apart. Hold the position.",
        setup: [
            "Stand with back against wall",
            "Feet 12-18 inches from wall",
            "Shoulder-width stance"
        ],
        execution: [
            "Slide down wall slowly",
            "Stop at 90° (thighs parallel to ground)",
            "Or stop at 60-70° if full depth painful",
            "Keep back flat against wall",
            "Arms at sides or on thighs",
            "Hold position, breathe steadily"
        ],
        dosage: {
            sets: 3,
            reps: 4,
            holdTime: 45,
            restBetweenSets: 60,
            tempo: "Slide down (3s) - Hold (45s) - Slide up (3s)"
        },
        why: "Classic isometric for quad strength. Keith Barr research shows this provides immediate pain relief (analgesia) lasting 45+ minutes. Perfect during flare-ups when dynamics hurt.",
        watchFor: [
            "Knees past toes (move feet out)",
            "Lower back arching (engage core)",
            "Sharp knee pain (go shallower)",
            "Breath holding"
        ],
        rpe: "7-8/10 (challenging by last 10 seconds)",
        phase: ["Calm", "Build", "Prime"],
        modifications: {
            easier: "Only go to 60° knee bend, or hold 30s instead of 45s",
            harder: "Hold 60s, or add weight on thighs, or single-leg version"
        }
    },
    {
        id: "step-downs",
        name: "Slow Step-Downs (Eccentric)",
        category: "Landing Control + Lateral Protection",
        target: "Quadriceps (Eccentric), VMO, Lateral Stability",
        description: "Stand on step with one leg. Slowly lower opposite heel to tap ground in front. Control the descent - this is the key. Push back up using working leg.",
        setup: [
            "6-8 inch step or stair",
            "Stand on affected leg",
            "Use rail/wall for balance as needed",
            "Other leg hanging free"
        ],
        execution: [
            "Slowly bend standing knee (3-4 second lower)",
            "Lower opposite heel to tap floor in front",
            "Keep knee tracking over 2nd toe (no valgus)",
            "Light tap only - don't shift weight",
            "Push back up through working heel (2 sec)",
            "Maintain upright torso throughout"
        ],
        dosage: {
            sets: 3,
            reps: 8,
            holdTime: 0,
            restBetweenSets: 90,
            tempo: "Down 3-4s - Tap - Up 2s"
        },
        why: "CRITICAL for lateral OA. Trains eccentric quad control for landing/deceleration. Mimics volleyball landing phase. Protects lateral compartment by teaching controlled load distribution.",
        watchFor: [
            "Knee wobbling side-to-side",
            "Knee diving inward (valgus)",
            "Losing balance (use more hand support)",
            "Sharp pain in lateral knee"
        ],
        rpe: "7/10 (tough but controlled)",
        phase: ["Build", "Prime"],
        modifications: {
            easier: "Lower step height to 4 inches, or partial range (don't go all the way down)",
            harder: "Increase step height to 10 inches, or hold light weight (10 lb dumbbell)"
        }
    },
    {
        id: "single-leg-rdl",
        name: "Single-Leg RDL",
        category: "Hip Control + Posterior Chain",
        target: "Hamstrings, Glutes, Hip Stabilizers",
        description: "Stand on one leg, hinge forward at hip keeping back flat. Lower weight/hand toward ground while extending free leg behind you. Return to standing.",
        setup: [
            "Stand on affected leg",
            "Slight bend in standing knee (5-10°)",
            "Hold light weight (10-20 lbs) or bodyweight",
            "Use wall/chair for balance if needed"
        ],
        execution: [
            "Hinge forward from hips (not spine)",
            "Keep back flat, core tight",
            "Lower weight toward ground (3 sec)",
            "Free leg extends back for counterbalance",
            "Feel stretch in hamstring of standing leg",
            "Drive through heel to return to start (2 sec)"
        ],
        dosage: {
            sets: 3,
            reps: 8,
            holdTime: 0,
            restBetweenSets: 60,
            tempo: "Down 3s - Bottom 1s - Up 2s"
        },
        why: "Reduces valgus collapse and lateral knee stress during single-leg activities. Critical for volleyball where you're often loading one leg. Builds hip stability that protects knee alignment.",
        watchFor: [
            "Rounding lower back (maintain neutral spine)",
            "Knee collapsing inward",
            "Loss of balance (use support)",
            "Hip hiking up on working side"
        ],
        rpe: "6-7/10",
        phase: ["Build", "Prime"],
        modifications: {
            easier: "Hold onto support throughout, or reduce range of motion",
            harder: "Increase weight to 25-30 lbs, or add 1-second pause at bottom"
        }
    },
    {
        id: "hamstring-bridge",
        name: "Single-Leg Hamstring Bridge",
        category: "Joint Unloading + Posterior Strength",
        target: "Hamstrings, Glutes, Lower Back",
        description: "Lie on back with one foot on ground, opposite leg extended. Drive through heel to lift hips off ground. Pause at top, lower with control.",
        setup: [
            "Lie on back on mat",
            "One foot flat, close to butt",
            "Opposite leg straight, raised 6 inches",
            "Arms at sides for stability"
        ],
        execution: [
            "Drive through heel of grounded foot",
            "Lift hips until body is straight line (2 sec)",
            "Squeeze glute at top",
            "Pause 1 second",
            "Lower slowly (3 sec) without touching down",
            "Keep extended leg raised throughout"
        ],
        dosage: {
            sets: 3,
            reps: 12,
            holdTime: 1,
            restBetweenSets: 60,
            tempo: "Up 2s - Hold 1s - Down 3s"
        },
        why: "Reduces anterior knee load by strengthening hamstrings. Strong posterior chain = less compressive force on knee joint during activities. Also improves hip extension for jumping.",
        watchFor: [
            "Lower back arching excessively",
            "Hips sagging or rotating",
            "Cramping in hamstring (ease off)",
            "Using arms to push up (should be leg-driven)"
        ],
        rpe: "7-8/10 (should burn by last 3 reps)",
        phase: ["Build", "Prime"],
        modifications: {
            easier: "Double-leg bridges instead, or reduce range",
            harder: "Add weight on hips (plate or dumbbell), or elevate foot on step"
        }
    },
    {
        id: "tke",
        name: "Terminal Knee Extensions (TKEs)",
        category: "Quad Activation After Swelling",
        target: "Vastus Medialis Oblique (VMO), Quadriceps",
        description: "Standing with band behind knee, squeeze knee completely straight against resistance. This reactivates quads after effusion.",
        setup: [
            "Anchor band at knee height behind you",
            "Loop band behind affected knee",
            "Step forward creating tension",
            "Slight forward lean, hands on hips or support"
        ],
        execution: [
            "Starting position: knee slightly bent (~10°)",
            "Squeeze/straighten knee fully (1-2 sec)",
            "Push back against band resistance",
            "Hold lockout for 2 seconds",
            "Slowly release to start (2 sec)",
            "Feel quad contract hard at lockout"
        ],
        dosage: {
            sets: 3,
            reps: 15,
            holdTime: 2,
            restBetweenSets: 45,
            tempo: "Extend 1s - Hold 2s - Release 2s"
        },
        why: "Swelling (effusion) inhibits quad activation - this is called arthrogenic muscle inhibition. TKEs specifically target VMO to restore quad firing. Very joint-friendly, essential after flare-ups.",
        watchFor: [
            "Hyperextending knee (stop at straight)",
            "Using hip thrust instead of quad",
            "Pain with lockout (reduce band tension)",
            "Knee wobbling"
        ],
        rpe: "5-6/10 (moderate, focus on activation not exhaustion)",
        phase: ["Calm", "Build"],
        modifications: {
            easier: "Lighter band, or seated version with foot on towel sliding forward",
            harder: "Heavier band, or add ankle weight"
        }
    },
    {
        id: "lateral-band-walk",
        name: "Lateral Band Walks",
        category: "Hip Stability + Valgus Control",
        target: "Gluteus Medius, Hip Abductors",
        description: "Loop band around knees or ankles. Slight squat position. Side-step maintaining band tension. This prevents knee valgus collapse.",
        setup: [
            "Loop resistance band above knees (easier) or ankles (harder)",
            "Stand with feet hip-width",
            "Slight athletic squat (~30° knee bend)",
            "Hands on hips or out for balance"
        ],
        execution: [
            "Step sideways with lead foot (12-18 inches)",
            "Follow with trailing foot to return to hip-width",
            "Maintain tension in band throughout",
            "Keep hips level (don't lean)",
            "Knees stay aligned over toes (no collapse inward)",
            "Take 10-15 steps one direction, then reverse"
        ],
        dosage: {
            sets: 3,
            reps: 12,
            holdTime: 0,
            restBetweenSets: 45,
            tempo: "Controlled steps, ~1 step per second"
        },
        why: "Weak hip abductors cause knee valgus (inward collapse) which CRUSHES lateral compartment. This directly protects your lateral OA by keeping knee tracking straight during activities.",
        watchFor: [
            "Band riding up (adjust placement)",
            "Knees collapsing inward",
            "Hips swaying side to side",
            "Steps too wide (keep controlled)"
        ],
        rpe: "6/10 (should feel glute burn)",
        phase: ["Build", "Prime"],
        modifications: {
            easier: "Lighter band, or fewer steps (8 each way)",
            harder: "Heavier band, or band at ankles, or add mini-squat between steps"
        }
    },
    {
        id: "mini-squat",
        name: "Mini Squats (Partial Range)",
        category: "Functional Quad Strength",
        target: "Quadriceps, Glutes (Joint-Sparing)",
        description: "Controlled squats to 60° knee flexion only. Protects lateral compartment while building functional strength.",
        setup: [
            "Feet shoulder-width",
            "Toes slightly out (10-15°)",
            "Place chair/box behind as depth guide",
            "Arms forward for balance or hold support"
        ],
        execution: [
            "Lower slowly (3 sec) until knees at 60°",
            "Tap box/chair with butt lightly",
            "Keep weight in heels",
            "Knees track over 2nd toe (not past toes)",
            "Drive through heels to stand (2 sec)",
            "Squeeze glutes at top"
        ],
        dosage: {
            sets: 3,
            reps: 10,
            holdTime: 0,
            restBetweenSets: 60,
            tempo: "Down 3s - Tap - Up 2s"
        },
        why: "Limited range avoids deep flexion angles that spike lateral compartment pressure. Builds functional strength for daily activities. Per specialist: most quad activation happens in early range anyway.",
        watchFor: [
            "Going too deep (>70° flexion)",
            "Knees caving inward (valgus)",
            "Heels lifting off ground",
            "Pain increasing with depth"
        ],
        rpe: "6-7/10",
        phase: ["Build", "Prime"],
        modifications: {
            easier: "Higher box (less depth), or use TRX/support for assistance",
            harder: "Hold goblet position with 20-30 lb dumbbell, or slow tempo (4s down)"
        }
    },
    {
        id: "calf-raise",
        name: "Calf Raises (Single-Leg)",
        category: "Ankle Stability + Landing Prep",
        target: "Gastrocnemius, Soleus, Ankle Stability",
        description: "Rise onto ball of foot, hold at top, lower slowly. Strong calves absorb landing forces before they reach knee.",
        setup: [
            "Stand on affected leg",
            "Use wall/support for balance",
            "Opposite leg bent behind you",
            "Start with foot flat"
        ],
        execution: [
            "Rise onto ball of foot (2 sec)",
            "Get as high as possible",
            "Hold top position (1 sec)",
            "Lower slowly back to flat foot (3 sec)",
            "Control the descent (eccentric phase)",
            "Don't let heel slam down"
        ],
        dosage: {
            sets: 3,
            reps: 15,
            holdTime: 1,
            restBetweenSets: 45,
            tempo: "Up 2s - Hold 1s - Down 3s"
        },
        why: "First line of defense in landing. Strong calves absorb shock before it reaches knee joint. Slow eccentric lowers train deceleration control critical for volleyball.",
        watchFor: [
            "Wobbling/balance loss",
            "Not getting full height",
            "Dropping too fast (lose eccentric benefit)",
            "Achilles pain (back off if sharp)"
        ],
        rpe: "6-7/10",
        phase: ["Build", "Prime"],
        modifications: {
            easier: "Double-leg version, or hold support throughout",
            harder: "Add weight (backpack or hold dumbbell), or do on step for more range"
        }
    },
    {
        id: "balance-single-leg",
        name: "Single-Leg Balance",
        category: "Proprioception + Stability",
        target: "Ankle/Knee Stabilizers, Proprioception",
        description: "Stand on one leg maintaining balance. Progress to unstable surface or eyes closed. Rebuilds knee awareness.",
        setup: [
            "Stand near wall/support",
            "Affected leg weight-bearing",
            "Opposite leg lifted (bent or straight)",
            "Arms out for balance initially"
        ],
        execution: [
            "Lift opposite foot 6 inches off ground",
            "Maintain slight bend in standing knee (10-15°)",
            "Hold position steadily",
            "Eyes open initially, then closed for challenge",
            "Focus on keeping knee stable (no wobble)",
            "If losing balance, tap down and restart"
        ],
        dosage: {
            sets: 3,
            reps: 1,
            holdTime: 30,
            restBetweenSets: 30,
            tempo: "Steady hold 30 seconds"
        },
        why: "Effusion and OA impair proprioception. This rebuilds your brain's map of knee position - critical for preventing awkward movements that trigger flares. Prepares for volleyball's quick direction changes.",
        watchFor: [
            "Knee locking out completely (keep slight bend)",
            "Hip hiking up on lifted side",
            "Excessive wobbling (regress difficulty)",
            "Holding breath (stay relaxed)"
        ],
        rpe: "4-5/10 (more coordination than strength)",
        phase: ["Build", "Prime"],
        modifications: {
            easier: "Fingertip support on wall, or tandem stance (one foot in front)",
            harder: "Stand on foam pad or pillow, or eyes closed, or add ball toss"
        }
    },
    {
        id: "mini-jumps",
        name: "Mini Vertical Jumps",
        category: "Impact Introduction + Landing Mechanics",
        target: "Full Lower Body, Tendon Stiffness",
        description: "Small vertical jumps (2-4 inches) focusing on soft, controlled landings. Introduces impact in minimal dose.",
        setup: [
            "Athletic stance, feet hip-width",
            "Slight knee bend to start (~30°)",
            "Arms can swing for momentum",
            "Clear space around you"
        ],
        execution: [
            "Small dip (quarter squat)",
            "Jump up just 2-4 inches",
            "Land on balls of feet FIRST",
            "Immediately absorb into soft landing (~40° knees)",
            "Make landing as QUIET as possible",
            "Pause 1-2 seconds between jumps"
        ],
        dosage: {
            sets: 3,
            reps: 5,
            holdTime: 0,
            restBetweenSets: 90,
            tempo: "Dip - Jump - Soft land - Pause - Repeat"
        },
        why: "Reintroduces impact to build bone/tendon tolerance. Teaches proper landing mechanics (soft, knees bent) essential for volleyball. Start small - your body adapts to impact over time.",
        watchFor: [
            "Stiff landings (knees straight)",
            "Loud landings (means high impact)",
            "Knee pain during or after",
            "Asymmetric landings (land both feet evenly)"
        ],
        rpe: "5-6/10 (focus on quality, not exhaustion)",
        phase: ["Prime"],
        modifications: {
            easier: "Even smaller jumps (1-2 inches), or do just 3 reps",
            harder: "Slightly higher jumps (4-6 inches), or increase to 8 reps, or single-leg hops (advanced)"
        }
    },
    {
        id: "quad-sets",
        name: "Quad Sets (Isometric)",
        category: "Quad Activation (Gentle)",
        target: "Quadriceps Activation, VMO Wake-Up",
        description: "Lying or sitting, squeeze thigh muscle to straighten knee fully. Hold. This is the gentlest quad activation.",
        setup: [
            "Sit or lie with legs straight",
            "Place small rolled towel under knee",
            "Completely relax to start"
        ],
        execution: [
            "Tighten thigh muscle maximally",
            "Push back of knee down into towel",
            "Knee should straighten fully",
            "Hold squeeze for 5 seconds",
            "Relax completely",
            "Rest 3 seconds, repeat"
        ],
        dosage: {
            sets: 3,
            reps: 10,
            holdTime: 5,
            restBetweenSets: 30,
            tempo: "Squeeze 5s - Relax 3s"
        },
        why: "After swelling, quads 'forget' how to fire (arthrogenic inhibition). This retrains the quad-brain connection. Use this EVERY morning if knee swollen, before attempting other exercises.",
        watchFor: [
            "Not achieving full knee extension",
            "Using other leg to help",
            "Cramping (ease intensity)",
            "Breath holding"
        ],
        rpe: "3-4/10 (low intensity, focus on activation)",
        phase: ["Calm"],
        modifications: {
            easier: "Without towel, or just 3-second holds",
            harder: "Lift heel off ground during hold (straight leg raise variation)"
        }
    },
    {
        id: "heel-slides",
        name: "Heel Slides (ROM)",
        category: "Range of Motion Restoration",
        target: "Knee Flexion/Extension, Joint Mobility",
        description: "Gentle sliding of heel toward/away from butt to maintain range. Critical after flare-ups.",
        setup: [
            "Lie on back or sit in chair",
            "Leg extended",
            "Can place towel under heel on smooth floor"
        ],
        execution: [
            "Slowly slide heel toward butt (3 sec)",
            "Bend knee as far as comfortable",
            "Hold bent position 2 seconds",
            "Slowly slide back to straight (3 sec)",
            "Gentle, no forcing range",
            "Should feel stretch but not pain"
        ],
        dosage: {
            sets: 2,
            reps: 15,
            holdTime: 2,
            restBetweenSets: 30,
            tempo: "Slide in 3s - Hold 2s - Slide out 3s"
        },
        why: "Maintains knee flexion range during flare-ups when you can't do full exercises. Prevents stiffness from turning into permanent range loss. Gentle movement promotes synovial fluid circulation.",
        watchFor: [
            "Forcing into pain (stay gentle)",
            "Losing full extension (make sure you straighten completely)",
            "Hip hiking or compensating",
            "Sharp catching sensation (could be meniscus - stop and assess)"
        ],
        rpe: "2-3/10 (very gentle)",
        phase: ["Calm"],
        modifications: {
            easier: "Even smaller range, or use hands to assist heel",
            harder: "Add light ankle weight for resistance"
        }
    }
];

// Helper function to get exercise by ID
window.getExerciseById = (id) => EXERCISES.find(ex => ex.id === id);

// Helper function to format duration for display
window.formatExerciseDuration = (ex) => {
    const { sets, reps, holdTime, restBetweenSets } = ex.dosage;
    let duration = "";
    
    if (holdTime > 0) {
        duration = `${sets} sets × ${reps} reps × ${holdTime}s hold`;
    } else {
        duration = `${sets} sets × ${reps} reps`;
    }
    
    duration += ` (${restBetweenSets}s rest between sets)`;
    return duration;
};

window.EXERCISES = EXERCISES;

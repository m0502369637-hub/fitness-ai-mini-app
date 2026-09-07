// convex/lib/exercises.ts
// Curated exercise catalog vendored from the public-domain free-exercise-db
// (https://github.com/yuhonas/free-exercise-db) — Unlicense.
// Images are served from the jsDelivr CDN mirror of the library's GitHub assets.
// Arabic names/instructions are provided so the plan UI can be localized.

export interface CatalogExercise {
  id: string;
  name: string;
  nameAr: string;
  level: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  instructionsAr: string[];
  images: string[];
}

export type ExerciseGroup = "push" | "pull" | "legs" | "core" | "cardio";

export const EXERCISE_CATALOG: Record<ExerciseGroup, CatalogExercise[]> = {
  "push": [
    {
      "id": "Barbell_Bench_Press_-_Medium_Grip",
      "name": "Barbell Bench Press - Medium Grip",
      "nameAr": "ضغط البنش بالبار - قبضة متوسطة",
      "level": "beginner",
      "equipment": "barbell",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "shoulders",
        "triceps"
      ],
      "instructions": [
        "Lie back on a flat bench. Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.",
        "From the starting position, breathe in and begin coming down slowly until the bar touches your middle chest.",
        "After a brief pause, push the bar back to the starting position as you breathe out. Focus on pushing the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position at the top of the motion, hold for a second and then start coming down slowly again. Tip: Ideally, lowering the weight should take about twice as long as raising it.",
        "Repeat the movement for the prescribed amount of repetitions.",
        "When you are done, place the bar back in the rack."
      ],
      "instructionsAr": [
        "استلقِ على ظهرك على مقعد مسطح. باستخدام قبضة متوسطة العرض (قبضة تشكّل زاوية 90 درجة في منتصف الحركة بين الساعدين والعضدين)، ارفع البار من الحامل وأمسكه مستقيمًا فوقك مع تمديد ذراعيك بالكامل. هذا هو وضع البداية.",
        "من وضع البداية، استنشق وابدأ بالنزول ببطء حتى يلمس البار منتصف صدرك.",
        "بعد توقف قصير، ادفع البار إلى وضع البداية مع الزفير. ركّز على دفع البار باستخدام عضلات الصدر. افرد ذراعيك واقبض عضلات صدرك في وضع الانقباض عند قمة الحركة، واثبت لثانية واحدة ثم ابدأ بالنزول ببطء مرة أخرى. نصيحة: من المثالي أن يستغرق خفض الوزن ضعف الوقت الذي يستغرقه رفعه تقريبًا.",
        "كرر الحركة لعدد التكرارات المحدد.",
        "عند الانتهاء، أعد البار إلى الحامل."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Bench_Press_-_Medium_Grip/1.jpg"
      ]
    },
    {
      "id": "Pushups",
      "name": "Pushups",
      "nameAr": "تمارين الضغط",
      "level": "beginner",
      "equipment": "body only",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "shoulders",
        "triceps"
      ],
      "instructions": [
        "Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length.",
        "Next, lower yourself downward until your chest almost touches the floor as you inhale.",
        "Now breathe out and press your upper body back up to the starting position while squeezing your chest.",
        "After a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed."
      ],
      "instructionsAr": [
        "استلقِ على الأرض ووجهك لأسفل، وضع يديك على مسافة حوالي 36 بوصة، مع رفع جذعك للأعلى مع استقامة الذراعين.",
        "بعد ذلك، اخفض جسمك إلى الأسفل حتى يقترب صدرك من لمس الأرض تقريبًا أثناء الشهيق.",
        "الآن قم بالزفير وادفع الجزء العلوي من جسمك للأعلى للعودة إلى وضع البداية مع الضغط على عضلات الصدر.",
        "بعد توقف قصير في الأعلى عند وضع الانقباض، يمكنك البدء في خفض نفسك للأسفل مرة أخرى لأداء عدد التكرارات التي تحتاجها."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pushups/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pushups/1.jpg"
      ]
    },
    {
      "id": "Incline_Dumbbell_Press",
      "name": "Incline Dumbbell Press",
      "nameAr": "ضغط الدمبل على المقعد المائل",
      "level": "beginner",
      "equipment": "dumbbell",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "shoulders",
        "triceps"
      ],
      "instructions": [
        "Lie back on an incline bench with a dumbbell in each hand atop your thighs. The palms of your hands will be facing each other.",
        "Then, using your thighs to help push the dumbbells up, lift the dumbbells one at a time so that you can hold them at shoulder width.",
        "Once you have the dumbbells raised to shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position.",
        "Be sure to keep full control of the dumbbells at all times. Then breathe out and push the dumbbells up with your chest.",
        "Lock your arms at the top, hold for a second, and then start slowly lowering the weight. Tip Ideally, lowering the weights should take about twice as long as raising them.",
        "Repeat the movement for the prescribed amount of repetitions.",
        "When you are done, place the dumbbells back on your thighs and then on the floor. This is the safest manner to release the dumbbells."
      ],
      "instructionsAr": [
        "استلقِ على مقعد مائل مع إمساك دمبل في كل يد فوق فخذيك، بحيث تتجه راحتا اليدين نحو بعضهما البعض.",
        "بعد ذلك، استخدم فخذيك للمساعدة في دفع الدمبلين للأعلى، وارفع كل دمبل على حدة حتى تمسكهما بعرض الكتفين.",
        "عندما ترفع الدمبلين إلى عرض الكتفين، أدر معصميك إلى الأمام بحيث تتجه راحتا اليدين بعيدًا عنك. هذا سيكون وضع البداية.",
        "احرص على التحكم الكامل بالدمبلين طوال الوقت. ثم ازفر وادفع الدمبلين للأعلى باستخدام عضلات الصدر.",
        "ثبّت ذراعيك في الأعلى، وتوقف لثانية واحدة، ثم ابدأ بإنزال الوزن ببطء. نصيحة: من الأفضل أن يستغرق إنزال الأوزان ضعف الوقت الذي يستغرقه رفعها تقريبًا.",
        "كرر الحركة لعدد التكرارات المحدد.",
        "عند الانتهاء، أعد الدمبلين إلى فخذيك ثم إلى الأرض. هذه هي الطريقة الأكثر أمانًا لإنزال الدمبلين."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Press/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Incline_Dumbbell_Press/1.jpg"
      ]
    },
    {
      "id": "Cable_Crossover",
      "name": "Cable Crossover",
      "nameAr": "تمرين تقاطع الكابلات",
      "level": "beginner",
      "equipment": "cable",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "shoulders"
      ],
      "instructions": [
        "To get yourself into the starting position, place the pulleys on a high position (above your head), select the resistance to be used and hold the pulleys in each hand.",
        "Step forward in front of an imaginary straight line between both pulleys while pulling your arms together in front of you. Your torso should have a small forward bend from the waist. This will be your starting position.",
        "With a slight bend on your elbows in order to prevent stress at the biceps tendon, extend your arms to the side (straight out at both sides) in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms and torso should remain stationary; the movement should only occur at the shoulder joint.",
        "Return your arms back to the starting position as you breathe out. Make sure to use the same arc of motion used to lower the weights.",
        "Hold for a second at the starting position and repeat the movement for the prescribed amount of repetitions."
      ],
      "instructionsAr": [
        "للوصول إلى وضع البداية، ضع البكرات في وضع مرتفع (فوق رأسك)، واختر المقاومة المطلوبة، وامسك البكرتين في كل يد.",
        "تقدَّم إلى الأمام أمام خط مستقيم وهمي بين البكرتين مع سحب ذراعيك معًا أمامك. يجب أن يكون جذعك منحنيًا قليلًا إلى الأمام من الخصر. سيكون هذا وضع البداية.",
        "مع ثنيٍّ بسيط في المرفقين لتجنّب الضغط على وتر العضلة ذات الرأسين، مدّ ذراعيك إلى الجانبين (مستقيمتين على كلا الجانبين) في قوس واسع حتى تشعر بتمدد في صدرك. استنشق الهواء أثناء أداء هذا الجزء من الحركة. تلميح: تذكّر أنه طوال الحركة يجب أن يظل الذراعان والجذع ثابتين؛ ويجب أن تحدث الحركة فقط عند مفصل الكتف.",
        "أعد ذراعيك إلى وضع البداية مع الزفير. تأكد من استخدام نفس قوس الحركة الذي استخدمته لإنزال الأوزان.",
        "توقف لثانية واحدة عند وضع البداية، ثم كرر الحركة لعدد التكرارات المحدد."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Crossover/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Crossover/1.jpg"
      ]
    },
    {
      "id": "Dips_-_Chest_Version",
      "name": "Dips - Chest Version",
      "nameAr": "غطس - نسخة الصدر",
      "level": "intermediate",
      "equipment": "other",
      "primaryMuscles": [
        "chest"
      ],
      "secondaryMuscles": [
        "shoulders",
        "triceps"
      ],
      "instructions": [
        "For this exercise you will need access to parallel bars. To get yourself into the starting position, hold your body at arms length (arms locked) above the bars.",
        "While breathing in, lower yourself slowly with your torso leaning forward around 30 degrees or so and your elbows flared out slightly until you feel a slight stretch in the chest.",
        "Once you feel the stretch, use your chest to bring your body back to the starting position as you breathe out. Tip: Remember to squeeze the chest at the top of the movement for a second.",
        "Repeat the movement for the prescribed amount of repetitions."
      ],
      "instructionsAr": [
        "لهذا التمرين ستحتاج إلى قضيبين متوازيين. للوصول إلى وضع البداية، امسك جسمك فوق القضيبين مع فرد ذراعيك بالكامل (قفل المرفقين).",
        "أثناء الشهيق، انزل بجسمك ببطء مع إمالة جذعك إلى الأمام حوالي 30 درجة وإبعاد مرفقيك قليلاً إلى الجانبين حتى تشعر بتمدد خفيف في الصدر.",
        "بمجرد أن تشعر بالتمدد، استخدم عضلات صدرك لإعادة جسمك إلى وضع البداية أثناء الزفير. نصيحة: اضغط ببطء على عضلات صدرك في أعلى الحركة لثانية واحدة.",
        "كرر الحركة لعدد التكرارات المحدد."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dips_-_Chest_Version/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Dips_-_Chest_Version/1.jpg"
      ]
    },
    {
      "id": "Standing_Military_Press",
      "name": "Standing Military Press",
      "nameAr": "الضغط العسكري واقفًا",
      "level": "beginner",
      "equipment": "barbell",
      "primaryMuscles": [
        "shoulders"
      ],
      "secondaryMuscles": [
        "triceps"
      ],
      "instructions": [
        "Start by placing a barbell that is about chest high on a squat rack. Once you have selected the weights, grab the barbell using a pronated (palms facing forward) grip. Make sure to grip the bar wider than shoulder width apart from each other.",
        "Slightly bend the knees and place the barbell on your collar bone. Lift the barbell up keeping it lying on your chest. Take a step back and position your feet shoulder width apart from each other.",
        "Once you pick up the barbell with the correct grip length, lift the bar up over your head by locking your arms. Hold at about shoulder level and slightly in front of your head. This is your starting position.",
        "Lower the bar down to the collarbone slowly as you inhale.",
        "Lift the bar back up to the starting position as you exhale.",
        "Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "ابدأ بوضع بار حديدي على ارتفاع الصدر تقريبًا على حامل القرفصاء. بعد اختيار الأوزان، أمسك البار بقبضة أمامية (راحتا اليدين متجهتان إلى الأمام). تأكد من إمساك البار بعرض أوسع من عرض الكتفين.",
        "اثنِ ركبتيك قليلًا وضع البار على عظمة الترقوة. ارفع البار مع إبقائه مستندًا على صدرك. خُذ خطوة إلى الخلف واجعل قدميك بعرض الكتفين.",
        "بعد إمساك البار بالقبضة الصحيحة، ارفع البار فوق رأسك مع فرد ذراعيك. أمسِكه عند مستوى الكتف تقريبًا وأمام رأسك قليلًا. هذا هو وضع البداية.",
        "انزِل البار ببطء نحو عظمة الترقوة وأنت تتنفس شهيقًا.",
        "ارفع البار مرة أخرى إلى وضع البداية وأنت تتنفس زفيرًا.",
        "كرر الحركة لعدد التكرارات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Military_Press/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Standing_Military_Press/1.jpg"
      ]
    },
    {
      "id": "Side_Lateral_Raise",
      "name": "Side Lateral Raise",
      "nameAr": "الرفرفة الجانبية",
      "level": "beginner",
      "equipment": "dumbbell",
      "primaryMuscles": [
        "shoulders"
      ],
      "secondaryMuscles": [],
      "instructions": [
        "Pick a couple of dumbbells and stand with a straight torso and the dumbbells by your side at arms length with the palms of the hand facing you. This will be your starting position.",
        "While maintaining the torso in a stationary position (no swinging), lift the dumbbells to your side with a slight bend on the elbow and the hands slightly tilted forward as if pouring water in a glass. Continue to go up until you arms are parallel to the floor. Exhale as you execute this movement and pause for a second at the top.",
        "Lower the dumbbells back down slowly to the starting position as you inhale.",
        "Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "اختر زوجًا من الدمبلات، وقف باستقامةٍ مع جذعٍ مستقيم، والدمبلان بجانبك على طول ذراعيك، وراحتا يديك مواجهتان لك. هذه هي وضعية البداية.",
        "مع إبقاء الجذع ثابتًا (بدون تأرجح)، ارفع الدمبلين إلى جانبيك مع ثنيٍّ خفيف في المرفقين وإمالة اليدين قليلًا إلى الأمام كما لو كنت تصب الماء في كوب. واصل الصعود حتى يصبح ذراعاك موازيين للأرض. قم بالزفير أثناء أداء هذه الحركة وتوقف لثانية واحدة في الأعلى.",
        "أنزل الدمبلين ببطء إلى وضعية البداية أثناء الشهيق.",
        "كرر التمرين لعدد التكرارات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Side_Lateral_Raise/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Side_Lateral_Raise/1.jpg"
      ]
    },
    {
      "id": "Front_Dumbbell_Raise",
      "name": "Front Dumbbell Raise",
      "nameAr": "رفع الدمبل الأمامي",
      "level": "beginner",
      "equipment": "dumbbell",
      "primaryMuscles": [
        "shoulders"
      ],
      "secondaryMuscles": [],
      "instructions": [
        "Pick a couple of dumbbells and stand with a straight torso and the dumbbells on front of your thighs at arms length with the palms of the hand facing your thighs. This will be your starting position.",
        "While maintaining the torso stationary (no swinging), lift the left dumbbell to the front with a slight bend on the elbow and the palms of the hands always facing down. Continue to go up until you arm is slightly above parallel to the floor. Exhale as you execute this portion of the movement and pause for a second at the top. Inhale after the second pause.",
        "Now lower the dumbbell back down slowly to the starting position as you simultaneously lift the right dumbbell.",
        "Continue alternating in this fashion until all of the recommended amount of repetitions have been performed for each arm."
      ],
      "instructionsAr": [
        "اختر زوجًا من الدمبل وقف باستقامة جذعك، مع إمساك الدمبل أمام فخذيك بطول الذراعين، بحيث تكون راحتا اليدين مواجهتين لفخذيك. هذه هي وضعية البداية.",
        "أبقِ جذعك ثابتًا (بدون تمايل)، وارفع الدمبل الأيسر إلى الأمام مع ثنيٍّ خفيف في المرفق، مع إبقاء راحتي اليدين مواجهتين للأسفل دائمًا. استمر في الصعود حتى يصبح ذراعك أعلى قليلًا من مستوى موازٍ للأرض. قم بالزفير أثناء تنفيذ هذا الجزء من الحركة، وتوقف للحظة واحدة في الأعلى. استنشق بعد هذا التوقف القصير.",
        "الآن أنزل الدمبل الأيسر ببطء إلى وضعية البداية، بينما ترفع في الوقت نفسه الدمبل الأيمن.",
        "استمر في التناوب بهذه الطريقة حتى تكتمل جميع التكرارات الموصى بها لكل ذراع."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Dumbbell_Raise/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Dumbbell_Raise/1.jpg"
      ]
    },
    {
      "id": "Face_Pull",
      "name": "Face Pull",
      "nameAr": "سحب الوجه",
      "level": "intermediate",
      "equipment": "cable",
      "primaryMuscles": [
        "shoulders"
      ],
      "secondaryMuscles": [
        "middle back"
      ],
      "instructions": [
        "Facing a high pulley with a rope or dual handles attached, pull the weight directly towards your face, separating your hands as you do so. Keep your upper arms parallel to the ground."
      ],
      "instructionsAr": [
        "قف مواجِهًا بكرة علوية مجهزة بحبل أو مقبضين مزدوجين.",
        "اسحب الوزن مباشرةً نحو وجهك مع تفريج يديك أثناء السحب.",
        "أبقِ عضديك متوازيين مع الأرض."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Face_Pull/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Face_Pull/1.jpg"
      ]
    },
    {
      "id": "Triceps_Pushdown",
      "name": "Triceps Pushdown",
      "nameAr": "دفع الترايسيبس لأسفل",
      "level": "beginner",
      "equipment": "cable",
      "primaryMuscles": [
        "triceps"
      ],
      "secondaryMuscles": [],
      "instructions": [
        "Attach a straight or angled bar to a high pulley and grab with an overhand grip (palms facing down) at shoulder width.",
        "Standing upright with the torso straight and a very small inclination forward, bring the upper arms close to your body and perpendicular to the floor. The forearms should be pointing up towards the pulley as they hold the bar. This is your starting position.",
        "Using the triceps, bring the bar down until it touches the front of your thighs and the arms are fully extended perpendicular to the floor. The upper arms should always remain stationary next to your torso and only the forearms should move. Exhale as you perform this movement.",
        "After a second hold at the contracted position, bring the bar slowly up to the starting point. Breathe in as you perform this step.",
        "Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "ثبّت قضيبًا مستقيمًا أو قضيبًا بزاوية في بكرة عالية وأمسك به بقبضة علوية (راحتا اليدين للأسفل) بعرض الكتفين.",
        "قف منتصبًا مع استقامة الجذع وإمالة طفيفة جدًا إلى الأمام، وقرّب العضدين من جسمك بحيث يكونان عموديين على الأرض. يجب أن يشير الساعدان إلى الأعلى نحو البكرة أثناء إمساكهما بالقضيب. هذا هو وضع البداية.",
        "باستخدام عضلة ثلاثية الرؤوس (الترايسيبس)، أنزل القضيب حتى يلمس الجزء الأمامي من فخذيك وتكون الذراعان ممدودتين بالكامل بشكل عمودي على الأرض. يجب أن يظل العضدان ثابتين دائمًا بجانب جذعك، ولا يتحرك إلا الساعدان. قم بالزفير أثناء أداء هذه الحركة.",
        "بعد تثبيت لمدة ثانية في وضع الانقباض، ارفع القضيب ببطء إلى نقطة البداية. قم بالشهيق أثناء أداء هذه الخطوة.",
        "كرر لعدد التكرارات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Triceps_Pushdown/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Triceps_Pushdown/1.jpg"
      ]
    }
  ],
  "pull": [
    {
      "id": "Pullups",
      "name": "Pullups",
      "nameAr": "تمرين السحب لأعلى",
      "level": "beginner",
      "equipment": "body only",
      "primaryMuscles": [
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "middle back"
      ],
      "instructions": [
        "Grab the pull-up bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.",
        "As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.",
        "Pull your torso up until the bar touches your upper chest by drawing the shoulders and the upper arms down and back. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.",
        "After a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched.",
        "Repeat this motion for the prescribed amount of repetitions."
      ],
      "instructionsAr": [
        "أمسك بقضيب السحب بحيث تكون راحتا اليدين مواجهتين للأمام وباستخدام المسكة المحددة. ملاحظة حول المسكات: بالنسبة للمسكة الواسعة، يجب أن تكون المسافة بين يديك أوسع من عرض كتفيك. بالنسبة للمسكة المتوسطة، يجب أن تكون المسافة بين يديك مساوية لعرض كتفيك. بالنسبة للمسكة الضيقة، يجب أن تكون المسافة بين يديك أصغر من عرض كتفيك.",
        "بينما ذراعاك ممتدتان أمامك وتمسكان بالقضيب بعرض المسكة المختار، أرجِع جذعك إلى الخلف بزاوية 30 درجة تقريبًا مع إحداث تقوّس في أسفل ظهرك وإبراز صدرك إلى الأمام. هذا هو وضع البداية.",
        "اسحب جذعك إلى الأعلى حتى يلمس القضيب الجزء العلوي من صدرك، عن طريق سحب الكتفين والجزء العلوي من الذراعين إلى الأسفل وإلى الخلف. أخرِج الزفير أثناء أداء هذا الجزء من الحركة. نصيحة: ركّز على ضغط عضلات الظهر عند بلوغ وضع الانقباض الكامل. يجب أن يبقى الجزء العلوي من الجذع ثابتًا أثناء تحركه في الفضاء، وأن تتحرك الذراعان فقط. وينبغي ألّا تقوم الساعدان بأي عمل آخر سوى الإمساك بالقضيب.",
        "بعد ثانية واحدة في وضع الانقباض، ابدأ بالشهيق وأنزِل جذعك ببطء إلى وضع البداية عندما تكون ذراعاك ممتدتين بالكامل والعضلات العريضة في ظهرك مشدودة بالكامل.",
        "كرّر هذه الحركة لعدد التكرارات المحدد."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pullups/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Pullups/1.jpg"
      ]
    },
    {
      "id": "Full_Range-Of-Motion_Lat_Pulldown",
      "name": "Full Range-Of-Motion Lat Pulldown",
      "nameAr": "سحب اللاتيسيميوس بنطاق حركة كامل",
      "level": "intermediate",
      "equipment": "cable",
      "primaryMuscles": [
        "lats"
      ],
      "secondaryMuscles": [
        "biceps",
        "middle back",
        "shoulders"
      ],
      "instructions": [
        "Either standing or seated on a high bench, grasp two stirrup cables that are attached to the high pulleys. Grab with the opposing hand so your arms are crisscrossed about you and your palms are facing forward.",
        "Keeping your chest up and maintaining a slight arch in your lower back, pull the handles down as if you were doing a regular pulldown. The range of motion will be more of an arc. During the movement, rotate your hands so that in the bottom position your palms face each other rather than forward. Return slowly to the starting position and repeat."
      ],
      "instructionsAr": [
        "إمّا بالوقوف أو الجلوس على مقعد مرتفع، أمسك كابلي الركاب المتصلين بالبكرات العلوية. أمسك كل كابل باليد المقابلة بحيث تتقاطع ذراعاك أمام جسمك وتتجه راحتا يديك إلى الأمام.",
        "أبقِ صدرك مرفوعًا مع الحفاظ على تقوّس خفيف في أسفل الظهر، واسحب المقابض إلى الأسفل كما لو كنت تؤدي تمرين السحب العادي. سيكون نطاق الحركة أقرب إلى القوس. أثناء الحركة، أدر يديك بحيث تتواجه راحتا اليدين في الوضعية السفلية بدلًا من أن تتجها إلى الأمام. عُد ببطء إلى وضع البداية وكرّر."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Full_Range-Of-Motion_Lat_Pulldown/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Full_Range-Of-Motion_Lat_Pulldown/1.jpg"
      ]
    },
    {
      "id": "Bent_Over_Barbell_Row",
      "name": "Bent Over Barbell Row",
      "nameAr": "تمرين التجديف بالبار مع الانحناء للأمام",
      "level": "beginner",
      "equipment": "barbell",
      "primaryMuscles": [
        "middle back"
      ],
      "secondaryMuscles": [
        "biceps",
        "lats",
        "shoulders"
      ],
      "instructions": [
        "Holding a barbell with a pronated grip (palms facing down), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The barbell should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.",
        "Now, while keeping the torso stationary, breathe out and lift the barbell to you. Keep the elbows close to the body and only use the forearms to hold the weight. At the top contracted position, squeeze the back muscles and hold for a brief pause.",
        "Then inhale and slowly lower the barbell back to the starting position.",
        "Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "أمسك البار بقبضة أمامية (بحيث تكون راحتا اليدين متجهتين للأسفل)، واثنِ ركبتيك قليلاً ومل جذعك للأمام بالانحناء عند الخصر مع إبقاء الظهر مستقيماً حتى يصبح موازياً تقريباً للأرض. ملاحظة: تأكد من رفع رأسك. يجب أن يتدلى البار مباشرة أمامك بينما يتدلى ذراعاك عمودياً على الأرض وعلى جذعك. هذا هو وضع البداية.",
        "الآن، مع إبقاء الجذع ثابتاً، أخرج الزفير وارفع البار نحوك. أبقِ المرفقين قريبين من جسمك واستخدم ساعديك فقط لحمل الوزن. في وضع الانقباض الأعلى، اضغط على عضلات الظهر واحتفظ بالوضعية للحظات وجيزة.",
        "ثم استنشق واخفض البار ببطء إلى وضع البداية.",
        "كرر التمرين لعدد التكرارات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bent_Over_Barbell_Row/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bent_Over_Barbell_Row/1.jpg"
      ]
    },
    {
      "id": "Seated_Cable_Rows",
      "name": "Seated Cable Rows",
      "nameAr": "تمرين سحب الكابل من وضع الجلوس",
      "level": "beginner",
      "equipment": "cable",
      "primaryMuscles": [
        "middle back"
      ],
      "secondaryMuscles": [
        "biceps",
        "lats",
        "shoulders"
      ],
      "instructions": [
        "For this exercise you will need access to a low pulley row machine with a V-bar. Note: The V-bar will enable you to have a neutral grip where the palms of your hands face each other. To get into the starting position, first sit down on the machine and place your feet on the front platform or crossbar provided making sure that your knees are slightly bent and not locked.",
        "Lean over as you keep the natural alignment of your back and grab the V-bar handles.",
        "With your arms extended pull back until your torso is at a 90-degree angle from your legs. Your back should be slightly arched and your chest should be sticking out. You should be feeling a nice stretch on your lats as you hold the bar in front of you. This is the starting position of the exercise.",
        "Keeping the torso stationary, pull the handles back towards your torso while keeping the arms close to it until you touch the abdominals. Breathe out as you perform that movement. At that point you should be squeezing your back muscles hard. Hold that contraction for a second and slowly go back to the original position while breathing in.",
        "Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "ستحتاج لهذا التمرين إلى جهاز بكرة منخفض بمقبض على شكل حرف V. ملاحظة: المقبض V يتيح لك قبضة محايدة تتجه فيها راحتا يديك نحو بعضهما. للوصول إلى وضع البداية، اجلس على الجهاز وضع قدميك على المنصة الأمامية أو العارضة المتوفرة، مع التأكد من أن ركبتيك مثنيتان قليلًا وغير مقفلتين.",
        "انحنِ إلى الأمام مع الحفاظ على المحاذاة الطبيعية لظهرك، وامسك بمقابض المقبض V.",
        "مع تمديد ذراعيك، اسحب جسمك إلى الخلف حتى يصبح جذعك بزاوية 90 درجة مع ساقيك. يجب أن يكون ظهرك مقوسًا قليلًا وصدرك بارزًا، وستشعر بتمدد جيد في عضلات ظهرك العريضة أثناء إمساكك بالمقبض أمامك. هذا هو وضع البداية.",
        "أبقِ جذعك ثابتًا، واسحب المقابض نحو جذعك مع إبقاء الذراعين قريبين منه حتى تلامس بطنك. أخرج الزفير أثناء هذه الحركة. عند هذه النقطة اضغط على عضلات ظهرك بقوة، واثبت على هذا الانقباض لثانية واحدة ثم عد ببطء إلى الوضع الأصلي مع الشهيق.",
        "كرر الحركة لعدد المرات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Cable_Rows/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Seated_Cable_Rows/1.jpg"
      ]
    },
    {
      "id": "One-Arm_Dumbbell_Row",
      "name": "One-Arm Dumbbell Row",
      "nameAr": "تمرين التجديف بالدمبل بذراع واحدة",
      "level": "beginner",
      "equipment": "dumbbell",
      "primaryMuscles": [
        "middle back"
      ],
      "secondaryMuscles": [
        "biceps",
        "lats",
        "shoulders"
      ],
      "instructions": [
        "Choose a flat bench and place a dumbbell on each side of it.",
        "Place the right leg on top of the end of the bench, bend your torso forward from the waist until your upper body is parallel to the floor, and place your right hand on the other end of the bench for support.",
        "Use the left hand to pick up the dumbbell on the floor and hold the weight while keeping your lower back straight. The palm of the hand should be facing your torso. This will be your starting position.",
        "Pull the resistance straight up to the side of your chest, keeping your upper arm close to your side and keeping the torso stationary. Breathe out as you perform this step. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. Also, make sure that the force is performed with the back muscles and not the arms. Finally, the upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the dumbbell; therefore do not try to pull the dumbbell up using the forearms.",
        "Lower the resistance straight down to the starting position. Breathe in as you perform this step.",
        "Repeat the movement for the specified amount of repetitions.",
        "Switch sides and repeat again with the other arm."
      ],
      "instructionsAr": [
        "اختر مقعدًا مسطحًا وضع دمبلًا على كل جانب منه.",
        "ضع الساق اليمنى على طرف المقعد، وانحنِ بجذعك للأمام من الخصر حتى يصبح الجزء العلوي من جسمك موازيًا للأرض، وضع يدك اليمنى على الطرف الآخر من المقعد للدعم.",
        "استخدم اليد اليسرى لالتقاط الدمبل من الأرض، وأمسك الوزن مع إبقاء أسفل ظهرك مستقيمًا. يجب أن يتجه راحة اليد نحو جذعك. سيكون هذا وضع البداية.",
        "اسحب الوزن لأعلى مباشرة إلى جانب صدرك، مع إبقاء ذراعك العلوي قريبًا من جانبك وإبقاء الجذع ثابتًا. قم بالزفير أثناء أداء هذه الخطوة. نصيحة: ركّز على شد عضلات الظهر عند الوصول إلى وضع الانقباض الكامل. تأكد أيضًا من أن القوة مبذولة بعضلات الظهر وليس الذراعين. أخيرًا، يجب أن يظل الجزء العلوي من الجذع ثابتًا ولا تتحرك سوى الذراعين. لا ينبغي للساعدين أن يبذلا أي جهد سوى حمل الدمبل؛ لذلك لا تحاول سحب الدمبل للأعلى باستخدام الساعدين.",
        "أنزل الوزن مستقيمًا لأسفل إلى وضع البداية. قم بالشهيق أثناء أداء هذه الخطوة.",
        "كرر الحركة لعدد التكرارات المحدد.",
        "بدّل الجوانب وكرر مرة أخرى بالذراع الأخرى."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/One-Arm_Dumbbell_Row/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/One-Arm_Dumbbell_Row/1.jpg"
      ]
    },
    {
      "id": "Barbell_Curl",
      "name": "Barbell Curl",
      "nameAr": "تمرين ثني الذراعين بالبار للعضلة ذات الرأسين",
      "level": "beginner",
      "equipment": "barbell",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "instructions": [
        "Stand up with your torso upright while holding a barbell at a shoulder-width grip. The palm of your hands should be facing forward and the elbows should be close to the torso. This will be your starting position.",
        "While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move.",
        "Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard.",
        "Slowly begin to bring the bar back to starting position as your breathe in.",
        "Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "قف بشكل مستقيم مع بقاء جذعك عمودياً وامسك البار بقبضة بعرض الكتفين. يجب أن توجّه راحتا يديك إلى الأمام، وأن يكون المرفقان قريبين من جذعك. هذه هي وضعية البداية.",
        "مع إبقاء الجزء العلوي من ذراعيك ثابتاً، اثنِ البار للأعلى ببطء مع انقباض العضلة ذات الرأسين أثناء الزفير. ملاحظة: يجب أن يتحرك الساعدان فقط.",
        "واصل الحركة حتى تنقبض العضلة ذات الرأسين انقباضاً كاملاً ويصبح البار عند مستوى الكتفين. اثبت على هذا الوضع لثانية واحدة واضغط على العضلة بقوة.",
        "ابدأ بإعادة البار ببطء إلى وضع البداية أثناء الشهيق.",
        "كرر التمرين لعدد التكرارات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Curl/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Curl/1.jpg"
      ]
    },
    {
      "id": "Alternate_Hammer_Curl",
      "name": "Alternate Hammer Curl",
      "nameAr": "تمرين تناوب تجعيد المطرقة",
      "level": "beginner",
      "equipment": "dumbbell",
      "primaryMuscles": [
        "biceps"
      ],
      "secondaryMuscles": [
        "forearms"
      ],
      "instructions": [
        "Stand up with your torso upright and a dumbbell in each hand being held at arms length. The elbows should be close to the torso.",
        "The palms of the hands should be facing your torso. This will be your starting position.",
        "While holding the upper arm stationary, curl the right weight forward while contracting the biceps as you breathe out. Continue the movement until your biceps is fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second as you squeeze the biceps. Tip: Only the forearms should move.",
        "Slowly begin to bring the dumbbells back to starting position as your breathe in.",
        "Repeat the movement with the left hand. This equals one repetition.",
        "Continue alternating in this manner for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "قف منتصبًا مع إبقاء جذعك مستقيمًا، وأمسك دمبلًا في كل يد بحيث يكون ذراعاك ممدودين على جانبي جسمك. يجب أن يكون المرفقان قريبين من الجذع.",
        "يجب أن تتجه راحتا اليدين نحو جذعك. هذا هو وضع البداية.",
        "مع تثبيت الجزء العلوي من الذراع ثابتًا، اثنِ الوزن باليد اليمنى إلى الأمام مع قبض العضلة ذات الرأسين أثناء الزفير. واصل الحركة حتى تنقبض العضلة ذات الرأسين بالكامل ويصل الدمبل إلى مستوى الكتف. اثبت على هذا الوضع لمدة ثانية مع الضغط على العضلة ذات الرأسين. ملاحظة: يجب أن يتحرك الساعدان فقط.",
        "ابدأ بإعادة الدمبل ببطء إلى وضع البداية أثناء الشهيق.",
        "كرر الحركة باليد اليسرى. هذا يعد تكرارًا واحدًا.",
        "استمر في التناوب بهذه الطريقة لعدد التكرارات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Alternate_Hammer_Curl/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Alternate_Hammer_Curl/1.jpg"
      ]
    }
  ],
  "legs": [
    {
      "id": "Barbell_Full_Squat",
      "name": "Barbell Full Squat",
      "nameAr": "القرفصاء الكامل بالحديد",
      "level": "intermediate",
      "equipment": "barbell",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "calves",
        "glutes",
        "hamstrings",
        "lower back"
      ],
      "instructions": [
        "This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack just above shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
        "Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
        "Step away from the rack and position your legs using a shoulder-width medium stance with the toes slightly pointed out. Keep your head up at all times and maintain a straight back. This will be your starting position.",
        "Begin to slowly lower the bar by bending the knees and sitting back with your hips as you maintain a straight posture with the head up. Continue down until your hamstrings are on your calves. Inhale as you perform this portion of the movement.",
        "Begin to raise the bar as you exhale by pushing the floor with the heel or middle of your foot as you straighten the legs and extend the hips to go back to the starting position.",
        "Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "من الأفضل أداء هذا التمرين داخل حامل القرفصاء (Squat Rack) لأسباب تتعلق بالسلامة. للبدء، ضع الحديد أولاً على الحامل على ارتفاع أعلى قليلاً من مستوى الكتفين. بعد اختيار الارتفاع المناسب وتحميل الحديد بالأوزان، قف تحت الحديد واجعله يستقر على الجزء الخلفي من كتفيك (أسفل الرقبة قليلاً).",
        "أمسك الحديد بكلتا يديك من الجانبين، وارفعه عن الحامل بالدفع أولاً بساقيك مع استقامة جذعك في الوقت نفسه.",
        "ابتعد عن الحامل، وثبّت قدميك بمسافة تساوي عرض الكتفين في وقفة متوسطة، مع توجيه أصابع القدمين إلى الخارج قليلاً. ارفع رأسك طوال الوقت وحافظ على استقامة ظهرك. هذه هي وضعية البداية.",
        "ابدأ بخفض الحديد ببطء عن طريق ثني الركبتين وإرجاع الوركين إلى الخلف مع الحفاظ على استقامة الجسم ورفع الرأس. استمر في النزول حتى تلامس العضلات الخلفية للفخذ (أوتار الركبة) ربلة الساق. قم بالشهيق أثناء أداء هذا الجزء من الحركة.",
        "ابدأ برفع الحديد مع الزفير بالدفع من الأرض بواسطة كعب القدم أو منتصفه، مع فرد الساقين ومدّ الوركين للعودة إلى وضعية البداية.",
        "كرر الحركة لعدد التكرارات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Full_Squat/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Full_Squat/1.jpg"
      ]
    },
    {
      "id": "Front_Squat_Clean_Grip",
      "name": "Front Squat (Clean Grip)",
      "nameAr": "القرفصاء الأمامي (قبضة الكلين)",
      "level": "intermediate",
      "equipment": "barbell",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "abdominals",
        "glutes",
        "hamstrings"
      ],
      "instructions": [
        "To begin, first set the bar in a rack slightly below shoulder level. Rest the bar on top of the deltoids, pushing into the clavicles, and lightly touching the throat. Your hands should be in a clean grip, touching the bar only with your fingers to help keep it in position.",
        "Lift the bar off the rack by first pushing with your legs and at the same time straightening your torso. Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head and elbows up at all times. This will be your starting position.",
        "Bend at the knees, sitting down between your legs. Continue down until your hamstrings are on your calves. Keep your knees aligned with your feet by consciously using your abductors to push your knees out as you squat.",
        "Begin to raise the bar as you exhale by pushing the floor mainly with the heel or middle of your foot as you straighten the legs again and return to the starting position."
      ],
      "instructionsAr": [
        "اضبط البار في الحامل تحت مستوى الكتفين قليلاً. ضع البار فوق الكتفين الأماميين مع دفعه نحو الترقوة، وأمسكه بقبضة الكلين بأطراف الأصابع فقط لتثبيته.",
        "ارفع البار عن الحامل بمدّ الساقين مع استقامة الجذع. تراجع خطوة للخلف واتخذ وقفة بعرض الكتفين مع توجيه الأصابع قليلاً للخارج، وحافظ على رأسك ومرفقيك مرفوعين.",
        "اثنِ الركبتين وانزل بين ساقيك حتى تلامس أوتار الركبة الساقين، مع دفع الركبتين للخارج عبر عضلات الإبعاد.",
        "ادفع بالأرض عبر الكعب أو منتصف القدم لرفع البار من جديد والعودة إلى وضع البداية."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Squat_Clean_Grip/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Front_Squat_Clean_Grip/1.jpg"
      ]
    },
    {
      "id": "Leg_Press",
      "name": "Leg Press",
      "nameAr": "ضغط الأرجل",
      "level": "beginner",
      "equipment": "machine",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "calves",
        "glutes",
        "hamstrings"
      ],
      "instructions": [
        "Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).",
        "Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you. Tip: Make sure that you do not lock your knees. Your torso and the legs should make a perfect 90-degree angle. This will be your starting position.",
        "As you inhale, slowly lower the platform until your upper and lower legs make a 90-degree angle.",
        "Pushing mainly with the heels of your feet and using the quadriceps go back to the starting position as you exhale.",
        "Repeat for the recommended amount of repetitions and ensure to lock the safety pins properly once you are done. You do not want that platform falling on you fully loaded."
      ],
      "instructionsAr": [
        "باستخدام جهاز ضغط الأرجل، اجلس على الجهاز وضع قدميك على المنصة أمامك مباشرة بوضعية قدمين متوسطة (بعرض الكتفين). (ملاحظة: لأغراض هذا الشرح نستخدم الوضعية المتوسطة المذكورة أعلاه التي تستهدف التنمية العامة؛ ومع ذلك يمكنك اختيار أي من الوضعيات الثلاث الموضحة في قسم تحديد موضع القدمين).",
        "أنزِل قضبان الأمان التي تثبّت المنصة المثقلة بالأوزان، وادفع المنصة للأعلى بالكامل حتى تكون ساقاك ممتدتين أمامك. تلميح: تأكد من عدم قفل ركبتيك. يجب أن يشكل جذعك وساقاك زاوية قائمة مقدارها 90 درجة. هذه ستكون وضعية البداية.",
        "أثناء الشهيق، اخفض المنصة ببطء حتى يصنع فخذاك وساقاك زاوية قائمة مقدارها 90 درجة.",
        "ادفع بشكل أساسي بكعبَي قدميك مستخدماً العضلات الرباعية للعودة إلى وضعية البداية أثناء الزفير.",
        "كرّر التمرين لعدد التكرارات الموصى به، وتأكد من إحكام قفل مسامير الأمان بشكل صحيح عند الانتهاء. فأنت لا تريد أن تسقط عليك المنصة وهي محمّلة بالكامل."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Press/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Press/1.jpg"
      ]
    },
    {
      "id": "Romanian_Deadlift",
      "name": "Romanian Deadlift",
      "nameAr": "الرفعة المميتة الرومانية",
      "level": "intermediate",
      "equipment": "barbell",
      "primaryMuscles": [
        "hamstrings"
      ],
      "secondaryMuscles": [
        "calves",
        "glutes",
        "lower back"
      ],
      "instructions": [
        "Put a barbell in front of you on the ground and grab it using a pronated (palms facing down) grip that a little wider than shoulder width. Tip: Depending on the weight used, you may need wrist wraps to perform the exercise and also a raised platform in order to allow for better range of motion.",
        "Bend the knees slightly and keep the shins vertical, hips back and back straight. This will be your starting position.",
        "Keeping your back and arms completely straight at all times, use your hips to lift the bar as you exhale. Tip: The movement should not be fast but steady and under control.",
        "Once you are standing completely straight up, lower the bar by pushing the hips back, only slightly bending the knees, unlike when squatting. Tip: Take a deep breath at the start of the movement and keep your chest up. Hold your breath as you lower and exhale as you complete the movement.",
        "Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "ضع شريط الحديد (البار) أمامك على الأرض وامسكه بقبضة علوية (بحيث تكون راحة اليد متجهة للأسفل) بعرضٍ أوسع قليلاً من عرض الكتفين. ملاحظة: اعتمادًا على الوزن المستخدم، قد تحتاج إلى لفافات للمعصم لأداء التمرين، وقد تحتاج أيضًا إلى منصة مرتفعة للسماح بنطاق حركة أفضل.",
        "اثنِ ركبتيك قليلاً مع إبقاء ساقيك عموديتين، وادفع وركيك إلى الخلف وحافظ على استقامة ظهرك. هذا هو وضع البداية.",
        "حافظ على استقامة ظهرك وذراعيك تمامًا طوال الوقت، واستخدم وركيك لرفع البار أثناء الزفير. يجب أن تكون الحركة ثابتة ومضبوطة وليست سريعة.",
        "عندما تقف منتصبًا تمامًا، اخفض البار بدفع وركيك إلى الخلف مع ثني الركبتين قليلًا فقط، وليس كما في القرفصاء. خذ نفسًا عميقًا في بداية الحركة وارفع صدرك، واحبس أنفاسك أثناء النزول، ثم أخرج الزفير عند إتمام الحركة.",
        "كرر التمرين لعدد التكرارات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Romanian_Deadlift/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Romanian_Deadlift/1.jpg"
      ]
    },
    {
      "id": "Barbell_Walking_Lunge",
      "name": "Barbell Walking Lunge",
      "nameAr": "اندفاع المشي بقضيب الحديد",
      "level": "beginner",
      "equipment": "barbell",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "calves",
        "glutes",
        "hamstrings"
      ],
      "instructions": [
        "Begin standing with your feet shoulder width apart and a barbell across your upper back.",
        "Step forward with one leg, flexing the knees to drop your hips. Descend until your rear knee nearly touches the ground. Your posture should remain upright, and your front knee should stay above the front foot.",
        "Drive through the heel of your lead foot and extend both knees to raise yourself back up.",
        "Step forward with your rear foot, repeating the lunge on the opposite leg."
      ],
      "instructionsAr": [
        "ابدأ واقفًا والقدمان متباعدتان بمقدار عرض الكتفين، مع وضع قضيب الحديد على أعلى ظهرك.",
        "تقدّم بإحدى الساقين إلى الأمام مع ثني الركبتين لخفض الوركين، وانزل حتى تقترب الركبة الخلفية من لمس الأرض. حافظ على استقامة جذعك، واجعل ركبتك الأمامية فوق قدمك الأمامية.",
        "ادفع الأرض بكعب قدمك الأمامية ومدّ ركبتيك لرفع جسمك مرة أخرى إلى وضع الوقوف.",
        "تقدّم بالقدم الخلفية إلى الأمام وكرّر الاندفاع على الساق الأخرى."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Walking_Lunge/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Walking_Lunge/1.jpg"
      ]
    },
    {
      "id": "Leg_Extensions",
      "name": "Leg Extensions",
      "nameAr": "تمديد الساقين",
      "level": "beginner",
      "equipment": "machine",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [],
      "instructions": [
        "For this exercise you will need to use a leg extension machine. First choose your weight and sit on the machine with your legs under the pad (feet pointed forward) and the hands holding the side bars. This will be your starting position. Tip: You will need to adjust the pad so that it falls on top of your lower leg (just above your feet). Also, make sure that your legs form a 90-degree angle between the lower and upper leg. If the angle is less than 90-degrees then that means the knee is over the toes which in turn creates undue stress at the knee joint. If the machine is designed that way, either look for another machine or just make sure that when you start executing the exercise you stop going down once you hit the 90-degree angle.",
        "Using your quadriceps, extend your legs to the maximum as you exhale. Ensure that the rest of the body remains stationary on the seat. Pause a second on the contracted position.",
        "Slowly lower the weight back to the original position as you inhale, ensuring that you do not go past the 90-degree angle limit.",
        "Repeat for the recommended amount of times."
      ],
      "instructionsAr": [
        "في هذا التمرين، ستحتاج إلى استخدام جهاز تمديد الساقين. ابدأ باختيار الوزن المناسب، ثم اجلس على الجهاز وضع ساقيك تحت الوسادة (مع توجيه القدمين إلى الأمام) وأمسك المقابض الجانبية بيديك. سيكون هذا هو وضع البداية. نصيحة: اضبط الوسادة بحيث تستقر على أعلى الجزء السفلي من ساقك (فوق قدميك مباشرة)، وتأكد أيضًا من أن ساقيك تشكلان زاوية 90 درجة بين الجزء السفلي والعلوي من الساق. إذا كانت الزاوية أقل من 90 درجة، فهذا يعني أن الركبة تتجاوز أصابع القدم، مما يسبب إجهادًا غير ضروري على مفصل الركبة. إذا كان الجهاز مصممًا على هذا النحو، فإما أن تبحث عن جهاز آخر أو تأكد فقط من أنه عند بدء التنفيذ تتوقف عن النزول بمجرد بلوغ زاوية 90 درجة.",
        "باستخدام عضلات الفخذ الرباعية، مد ساقيك إلى أقصى حد ممكن أثناء الزفير. تأكد من أن باقي الجسم يبقى ثابتًا على المقعد. توقف للحظة (ثانية واحدة) عند وضع الانقباض.",
        "اخفض الوزن ببطء إلى وضع البداية أثناء الشهيق، مع الحرص على عدم تجاوز حد زاوية 90 درجة.",
        "كرر التمرين لعدد المرات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Extensions/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Leg_Extensions/1.jpg"
      ]
    },
    {
      "id": "Lying_Leg_Curls",
      "name": "Lying Leg Curls",
      "nameAr": "ثني الساقين من وضع الاستلقاء",
      "level": "beginner",
      "equipment": "machine",
      "primaryMuscles": [
        "hamstrings"
      ],
      "secondaryMuscles": [],
      "instructions": [
        "Adjust the machine lever to fit your height and lie face down on the leg curl machine with the pad of the lever on the back of your legs (just a few inches under the calves). Tip: Preferably use a leg curl machine that is angled as opposed to flat since an angled position is more favorable for hamstrings recruitment.",
        "Keeping the torso flat on the bench, ensure your legs are fully stretched and grab the side handles of the machine. Position your toes straight (or you can also use any of the other two stances described on the foot positioning section). This will be your starting position.",
        "As you exhale, curl your legs up as far as possible without lifting the upper legs from the pad. Once you hit the fully contracted position, hold it for a second.",
        "As you inhale, bring the legs back to the initial position. Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "اضبط ذراع الجهاز بما يتناسب مع طولك، ثم استلقِ على وجهك على جهاز ثني الساقين بحيث تكون وسادة الذراع خلف ساقيك (أسفل السمانة ببضعة سنتيمترات). نصيحة: يُفضّل استخدام جهاز ثني الساقين المائل بدلاً من المستوي، لأن الوضع المائل أكثر فاعلية لتنشيط العضلات الخلفية للفخذ.",
        "أبقِ جذعك مفرودًا على المقعد، وتأكد من أن ساقيك ممتدتان بالكامل، ثم أمسك المقابض الجانبية للجهاز. وجّه أصابع قدميك إلى الأمام (أو يمكنك استخدام أي من الوضعين الآخرين الموضحين في قسم تحديد موضع القدمين). هذا سيكون وضع البداية.",
        "أثناء الزفير، اثنِ ساقيك إلى الأعلى قدر الإمكان دون رفع الجزء العلوي من الساقين عن الوسادة. وعند بلوغ وضع الانقباض الكامل، اثبت فيه لثانية واحدة.",
        "أثناء الشهيق، أعد الساقين إلى وضع البداية. كرر التمرين لعدد التكرارات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Lying_Leg_Curls/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Lying_Leg_Curls/1.jpg"
      ]
    },
    {
      "id": "Barbell_Seated_Calf_Raise",
      "name": "Barbell Seated Calf Raise",
      "nameAr": "تمرين رفع ربلة الساق بالبار أثناء الجلوس",
      "level": "beginner",
      "equipment": "barbell",
      "primaryMuscles": [
        "calves"
      ],
      "secondaryMuscles": [],
      "instructions": [
        "Place a block about 12 inches in front of a flat bench.",
        "Sit on the bench and place the ball of your feet on the block.",
        "Have someone place a barbell over your upper thighs about 3 inches above your knees and hold it there. This will be your starting position.",
        "Raise up on your toes as high as possible as you squeeze the calves and as you breathe out.",
        "After a second contraction, slowly go back to the starting position. Tip: To get maximum benefit stretch your calves as far as you can.",
        "Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "ضع كتلة على بعد حوالي 12 بوصة أمام مقعد مسطح.",
        "اجلس على المقعد وضع مقدمة قدميك على الكتلة.",
        "اطلب من شخص مساعد أن يضع بارًا حديديًا فوق الجزء العلوي من فخذيك، حوالي 3 بوصات فوق ركبتيك، وأن يُبقيه هناك. هذه هي وضعية البداية.",
        "ارتفع على أصابع قدميك إلى أعلى ما تستطيع، مع انقباض عضلات ربلة الساق، وقم بذلك أثناء الزفير.",
        "بعد ثانية واحدة من الانقباض، عُد ببطء إلى وضع البداية. نصيحة: للحصول على أقصى فائدة، مدّ عضلات ربلة الساق قدر ما تستطيع.",
        "كرر التمرين لعدد التكرارات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Seated_Calf_Raise/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Seated_Calf_Raise/1.jpg"
      ]
    },
    {
      "id": "Barbell_Glute_Bridge",
      "name": "Barbell Glute Bridge",
      "nameAr": "جسر الأرداف بالبار الحديدي",
      "level": "intermediate",
      "equipment": "barbell",
      "primaryMuscles": [
        "glutes"
      ],
      "secondaryMuscles": [
        "calves",
        "hamstrings"
      ],
      "instructions": [
        "Begin seated on the ground with a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise. Roll the bar so that it is directly above your hips, and lay down flat on the floor.",
        "Begin the movement by driving through with your heels, extending your hips vertically through the bar. Your weight should be supported by your upper back and the heels of your feet.",
        "Extend as far as possible, then reverse the motion to return to the starting position."
      ],
      "instructionsAr": [
        "ابدأ جالسًا على الأرض مع وضع بار حديدي مُحمّل فوق ساقيك. يمكن أن يؤدي استخدام بار سميك أو وضع وسادة على البار إلى تقليل الانزعاج الناتج عن هذا التمرين بشكل كبير. دحرج البار حتى يصبح مباشرة فوق وركيك، ثم استلقِ على الأرض بشكل مسطّح.",
        "ابدأ الحركة بالدفع عبر كعبيك، مع مدّ وركيك عموديًا نحو البار. يجب أن يستند وزنك على أعلى ظهرك وكعبي قدميك.",
        "مدّ وركيك إلى أقصى حد ممكن، ثم اعكس الحركة للعودة إلى وضع البداية."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Glute_Bridge/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Barbell_Glute_Bridge/1.jpg"
      ]
    }
  ],
  "core": [
    {
      "id": "Plank",
      "name": "Plank",
      "nameAr": "البلانك",
      "level": "beginner",
      "equipment": "body only",
      "primaryMuscles": [
        "abdominals"
      ],
      "secondaryMuscles": [],
      "instructions": [
        "Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.",
        "Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised."
      ],
      "instructionsAr": [
        "ابدأ بوضعية الانبطاح على الأرض، مع إسناد وزن جسمك على أصابع القدمين والساعدين. تكون الذراعان مثنيتين وتحت الكتفين مباشرة.",
        "حافظ على استقامة جسمك طوال الوقت، واثبت على هذه الوضعية لأطول فترة ممكنة. لزيادة الصعوبة، يمكن رفع ذراع أو ساق."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Plank/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Plank/1.jpg"
      ]
    },
    {
      "id": "Cable_Crunch",
      "name": "Cable Crunch",
      "nameAr": "تمرين كرانش الكابل",
      "level": "beginner",
      "equipment": "cable",
      "primaryMuscles": [
        "abdominals"
      ],
      "secondaryMuscles": [],
      "instructions": [
        "Kneel below a high pulley that contains a rope attachment.",
        "Grasp cable rope attachment and lower the rope until your hands are placed next to your face.",
        "Flex your hips slightly and allow the weight to hyperextend the lower back. This will be your starting position.",
        "With the hips stationary, flex the waist as you contract the abs so that the elbows travel towards the middle of the thighs. Exhale as you perform this portion of the movement and hold the contraction for a second.",
        "Slowly return to the starting position as you inhale. Tip: Make sure that you keep constant tension on the abs throughout the movement. Also, do not choose a weight so heavy that the lower back handles the brunt of the work.",
        "Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "اركع تحت بكرة علوية مزوَّدة بملحق حبل.",
        "امسك بملحق الحبل واخفضه حتى تصبح يداك بجانب وجهك.",
        "اثنِ وركيك قليلاً واسمح للوزن بتمديد أسفل الظهر. سيكون هذا وضع البداية.",
        "مع إبقاء الوركين ثابتين، اثنِ الخصر مع قبض عضلات البطن بحيث يتجه مرفقاك نحو منتصف الفخذين. قم بالزفير أثناء أداء هذا الجزء من الحركة واحتفظ بالانقباض لثانية واحدة.",
        "عُد ببطء إلى وضع البداية أثناء الشهيق. ملاحظة: تأكد من إبقاء التوتر مستمرًا على عضلات البطن طوال الحركة، ولا تختر وزنًا ثقيلًا لدرجة أن يتحمل أسفل ظهرك معظم الجهد.",
        "كرر التمرين لعدد التكرارات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Crunch/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Cable_Crunch/1.jpg"
      ]
    },
    {
      "id": "Hanging_Leg_Raise",
      "name": "Hanging Leg Raise",
      "nameAr": "رفع الساقين من التعليق",
      "level": "expert",
      "equipment": "body only",
      "primaryMuscles": [
        "abdominals"
      ],
      "secondaryMuscles": [],
      "instructions": [
        "Hang from a chin-up bar with both arms extended at arms length in top of you using either a wide grip or a medium grip. The legs should be straight down with the pelvis rolled slightly backwards. This will be your starting position.",
        "Raise your legs until the torso makes a 90-degree angle with the legs. Exhale as you perform this movement and hold the contraction for a second or so.",
        "Go back slowly to the starting position as you breathe in.",
        "Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "علّق من عارضة السحب مع تمديد الذراعين بالكامل فوقك، باستخدام قبضة واسعة أو متوسطة. يجب أن تكون الساقان مستقيمتين إلى الأسفل مع دحرجة الحوض للخلف قليلاً. هذه هي وضعية البداية.",
        "ارفع ساقيك حتى يشكل الجذع زاوية 90 درجة مع الساقين. قم بالزفير أثناء أداء هذه الحركة، واثبت على الانقباض لثانية تقريباً.",
        "عد ببطء إلى وضع البداية أثناء الشهيق.",
        "كرر الحركة للعدد الموصى به من التكرارات."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hanging_Leg_Raise/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Hanging_Leg_Raise/1.jpg"
      ]
    },
    {
      "id": "Russian_Twist",
      "name": "Russian Twist",
      "nameAr": "الالتواء الروسي",
      "level": "intermediate",
      "equipment": "body only",
      "primaryMuscles": [
        "abdominals"
      ],
      "secondaryMuscles": [
        "lower back"
      ],
      "instructions": [
        "Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees.",
        "Elevate your upper body so that it creates an imaginary V-shape with your thighs. Your arms should be fully extended in front of you perpendicular to your torso and with the hands clasped. This is the starting position.",
        "Twist your torso to the right side until your arms are parallel with the floor while breathing out.",
        "Hold the contraction for a second and move back to the starting position while breathing out. Now move to the opposite side performing the same techniques you applied to the right side.",
        "Repeat for the recommended amount of repetitions."
      ],
      "instructionsAr": [
        "استلقِ على الأرض واضعًا قدميك إما تحت شيء ثابت لا يتحرك أو بمساعدة شريك يثبّتهما. يجب أن تكون ساقيك مثنيتين عند الركبتين.",
        "ارفع الجزء العلوي من جسمك بحيث يشكل شكل حرف V وهميًا مع فخذيك. مدّ ذراعيك بالكامل أمامك بشكل عمودي على جذعك مع تشبيك يديك. هذا هو وضع البداية.",
        "لفّ جذعك نحو الجانب الأيمن حتى يصبح ذراعاك موازيين للأرض أثناء الزفير.",
        "اثبت على الانقباض لثانية واحدة ثم عد إلى وضع البداية أثناء الزفير. الآن انتقل إلى الجانب المقابل مؤديًا نفس الأسلوب الذي طبقته على الجانب الأيمن.",
        "كرر التمرين لعدد التكرارات الموصى به."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Russian_Twist/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Russian_Twist/1.jpg"
      ]
    }
  ],
  "cardio": [
    {
      "id": "Air_Bike",
      "name": "Air Bike",
      "nameAr": "تمرين الدراجة الهوائية",
      "level": "beginner",
      "equipment": "body only",
      "primaryMuscles": [
        "abdominals"
      ],
      "secondaryMuscles": [],
      "instructions": [
        "Lie flat on the floor with your lower back pressed to the ground. For this exercise, you will need to put your hands beside your head. Be careful however to not strain with the neck as you perform it. Now lift your shoulders into the crunch position.",
        "Bring knees up to where they are perpendicular to the floor, with your lower legs parallel to the floor. This will be your starting position.",
        "Now simultaneously, slowly go through a cycle pedal motion kicking forward with the right leg and bringing in the knee of the left leg. Bring your right elbow close to your left knee by crunching to the side, as you breathe out.",
        "Go back to the initial position as you breathe in.",
        "Crunch to the opposite side as you cycle your legs and bring closer your left elbow to your right knee and exhale.",
        "Continue alternating in this manner until all of the recommended repetitions for each side have been completed."
      ],
      "instructionsAr": [
        "استلقِ على الأرض بشكل مسطّح مع الضغط بأسفل الظهر على الأرض. ستحتاج في هذا التمرين إلى وضع يديك بجانب رأسك، ولكن احذر من إجهاد الرقبة أثناء أدائه. ارفع كتفيك الآن إلى وضع الجلوس الطعني (وضعية الكرانش).",
        "ارفع ركبتيك إلى أن تصبحا عموديتين على الأرض، مع جعل أسفل ساقيك موازيين للأرض. ستكون هذه وضعية البداية.",
        "الآن وفي الوقت نفسه، قم بحركة دوّاسة القدمين ببطء، مع مدّ الساق اليمنى إلى الأمام وجذب ركبة الساق اليسرى نحو الداخل. قرِّب مرفقك الأيمن من ركبتك اليسرى بالالتواء إلى الجانب أثناء الزفير.",
        "عُد إلى الوضعية الأولية أثناء الشهيق.",
        "الْتَوِ إلى الجانب المقابل أثناء تدوير ساقيك، وقرِّب مرفقك الأيسر من ركبتك اليمنى مع الزفير.",
        "استمر في التناوب بهذه الطريقة حتى إكمال جميع التكرارات الموصى بها لكل جانب."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Air_Bike/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Air_Bike/1.jpg"
      ]
    },
    {
      "id": "Battling_Ropes",
      "name": "Battling Ropes",
      "nameAr": "حبال المعركة",
      "level": "beginner",
      "equipment": "other",
      "primaryMuscles": [
        "shoulders"
      ],
      "secondaryMuscles": [
        "chest",
        "forearms"
      ],
      "instructions": [
        "For this exercise you will need a heavy rope anchored at its center 15-20 feet away. Standing in front of the rope, take an end in each hand with your arms extended at your side. This will be your starting position.",
        "Initiate the movement by rapidly raising one arm to shoulder level as quickly as you can.",
        "As you let that arm drop to the starting position, raise the opposite side.",
        "Continue alternating your left and right arms, whipping the ropes up and down as fast as you can."
      ],
      "instructionsAr": [
        "تحتاج في هذا التمرين إلى حبل ثقيل مثبت من منتصفه على مسافة تتراوح بين 15 و20 قدمًا. قف أمام الحبل وأمسك بطرف في كل يد مع مد ذراعيك إلى جانبيك. هذه هي وضعية البداية.",
        "ابدأ الحركة برفع أحد ذراعيك بسرعة إلى مستوى الكتف بأسرع ما يمكن.",
        "عندما تترك هذا الذراع ينزل إلى وضع البداية، ارفع الذراع المقابلة.",
        "واصل التناوب بين ذراعيك اليمنى واليسرى، بحركة تضرب الحبال للأعلى والأسفل بأسرع ما يمكن."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Battling_Ropes/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Battling_Ropes/1.jpg"
      ]
    },
    {
      "id": "Mountain_Climbers",
      "name": "Mountain Climbers",
      "nameAr": "متسلقو الجبال",
      "level": "beginner",
      "equipment": null,
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "chest",
        "hamstrings",
        "shoulders"
      ],
      "instructions": [
        "Begin in a pushup position, with your weight supported by your hands and toes. Flexing the knee and hip, bring one leg until the knee is approximately under the hip. This will be your starting position.",
        "Explosively reverse the positions of your legs, extending the bent leg until the leg is straight and supported by the toe, and bringing the other foot up with the hip and knee flexed. Repeat in an alternating fashion for 20-30 seconds."
      ],
      "instructionsAr": [
        "ابدأ بوضعية تمرين الضغط، مع دعم وزن جسمك على يديك وأصابع قدميك. اثنِ الركبة والورك، واجلب ساقًا واحدة حتى تصبح الركبة تقريبًا تحت الورك. سيكون هذا وضع البداية.",
        "بدّل وضع ساقيك بشكل انفجاري، بمدّ الساق المثنية حتى تصبح مستقيمة ومدعومة بأصابع القدم، مع رفع القدم الأخرى لأعلى مع ثني الورك والركبة. كرر التمرين بالتناوب لمدة 20-30 ثانية."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Mountain_Climbers/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Mountain_Climbers/1.jpg"
      ]
    },
    {
      "id": "One-Arm_Kettlebell_Swings",
      "name": "One-Arm Kettlebell Swings",
      "nameAr": "أرجحة الكيتل بيل بذراع واحدة",
      "level": "intermediate",
      "equipment": "kettlebells",
      "primaryMuscles": [
        "hamstrings"
      ],
      "secondaryMuscles": [
        "calves",
        "glutes",
        "lower back",
        "shoulders"
      ],
      "instructions": [
        "Place a kettlebell between your feet and hinge at the hips to grip it with one hand.",
        "Swing it back between your legs, then drive your hips forward to swing it up to chest height.",
        "Let the kettlebell swing back down between your legs and repeat in a fluid motion."
      ],
      "instructionsAr": [
        "ضع الكيتل بيل بين قدميك وانحنِ من الوركين للإمساك به بيد واحدة.",
        "أرجحه للخلف بين ساقيك، ثم ادفع الوركين للأمام لأرجحته حتى مستوى الصدر.",
        "دعه يتأرجح عائداً بين ساقيك وكرر بحركة انسيابية."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/One-Arm_Kettlebell_Swings/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/One-Arm_Kettlebell_Swings/1.jpg"
      ]
    },
    {
      "id": "Goblet_Squat",
      "name": "Goblet Squat",
      "nameAr": "قرفصاء الكأس",
      "level": "beginner",
      "equipment": "kettlebells",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "calves",
        "glutes",
        "hamstrings",
        "shoulders"
      ],
      "instructions": [
        "Stand holding a light kettlebell by the horns close to your chest. This will be your starting position.",
        "Squat down between your legs until your hamstrings are on your calves. Keep your chest and head up and your back straight.",
        "At the bottom position, pause and use your elbows to push your knees out. Return to the starting position, and repeat for 10-20 repetitions."
      ],
      "instructionsAr": [
        "قف ممسكًا بكيتل بيل خفيف من قرنيه بالقرب من صدرك. هذه هي وضعية البداية.",
        "انزل إلى الأسفل بين ساقيك حتى تلامس أوتار ركبتيك عضلات ساقيك. أبقِ صدرك ورأسك مرفوعين وظهرك مستقيمًا.",
        "عند الوضعية الأدنى، توقف قليلًا واستخدم مرفقيك لدفع ركبتيك إلى الخارج. ثم عد إلى وضع البداية، وكرر التمرين من 10 إلى 20 مرة."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Goblet_Squat/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Goblet_Squat/1.jpg"
      ]
    },
    {
      "id": "Rowing_Stationary",
      "name": "Rowing, Stationary",
      "nameAr": "تجديف، ثابت",
      "level": "intermediate",
      "equipment": "machine",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "biceps",
        "calves",
        "glutes",
        "hamstrings",
        "lower back",
        "middle back"
      ],
      "instructions": [
        "To begin, seat yourself on the rower. Make sure that your heels are resting comfortably against the base of the foot pedals and that the straps are secured. Select the program that you wish to use, if applicable. Sit up straight and bend forward at the hips.",
        "There are three phases of movement when using a rower. The first phase is when you come forward on the rower. Your knees are bent and against your chest. Your upper body is leaning slightly forward while still maintaining good posture. Next, push against the foot pedals and extend your legs while bringing your hands to your upper abdominal area, squeezing your shoulders back as you do so. To avoid straining your back, use primarily your leg and hip muscles.",
        "The recovery phase simply involves straightening your arms, bending the knees, and bringing your body forward again as you transition back into the first phase."
      ],
      "instructionsAr": [
        "للبدء، اجلس على جهاز التجديف. تأكد من أن كعبيك يستندان بشكل مريح إلى قاعدة دواسات القدم وأن الأشرطة مثبتة بإحكام. اختر البرنامج الذي ترغب في استخدامه، إذا كان متاحًا. اجلس باستقامة وانحنِ للأمام من منطقة الوركين.",
        "هناك ثلاث مراحل للحركة عند استخدام جهاز التجديف. المرحلة الأولى هي عندما تتقدم للأمام على الجهاز. ركبتاك مثنيتان وقريبتان من صدرك. الجزء العلوي من جسمك يميل قليلًا إلى الأمام مع الحفاظ على وضعية جيدة. بعد ذلك، ادفع ضد دواسات القدم ومدّ ساقيك مع bringing يديك إلى منطقة البطن العلوية، مع ضغط كتفيك إلى الخلف أثناء قيامك بذلك. لتجنب إجهاد ظهرك، استخدم بشكل أساسي عضلات ساقيك ووركيك.",
        "تتضمن مرحلة الاسترداد ببساطة فرد ذراعيك، وثني ركبتيك، وإعادة جسمك إلى الأمام مرة أخرى أثناء انتقالك إلى المرحلة الأولى."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rowing_Stationary/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Rowing_Stationary/1.jpg"
      ]
    },
    {
      "id": "Bodyweight_Squat",
      "name": "Bodyweight Squat",
      "nameAr": "القرفصاء بوزن الجسم",
      "level": "beginner",
      "equipment": "body only",
      "primaryMuscles": [
        "quadriceps"
      ],
      "secondaryMuscles": [
        "glutes",
        "hamstrings"
      ],
      "instructions": [
        "Stand with your feet shoulder width apart. You can place your hands behind your head. This will be your starting position.",
        "Begin the movement by flexing your knees and hips, sitting back with your hips.",
        "Continue down to full depth if you are able,and quickly reverse the motion until you return to the starting position. As you squat, keep your head and chest up and push your knees out."
      ],
      "instructionsAr": [
        "قف مع مباعدة قدميك بمقدار عرض الكتفين. يمكنك وضع يديك خلف رأسك. هذه ستكون وضعية البداية.",
        "ابدأ الحركة بثني ركبتيك ووركيك مع إرجاع وركيك إلى الخلف.",
        "واصل النزول إلى أقصى عمق إن استطعت، ثم اعكس الحركة بسرعة حتى تعود إلى وضع البداية. أثناء القرفصاء، حافظ على رفع رأسك وصدرك وادفع ركبتيك إلى الخارج."
      ],
      "images": [
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bodyweight_Squat/0.jpg",
        "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Bodyweight_Squat/1.jpg"
      ]
    }
  ]
};

export const ALL_EXERCISES: CatalogExercise[] = [
  ...EXERCISE_CATALOG.push,
  ...EXERCISE_CATALOG.pull,
  ...EXERCISE_CATALOG.legs,
  ...EXERCISE_CATALOG.core,
  ...EXERCISE_CATALOG.cardio,
];

export const LEGACY_NAME_TO_ID: Record<string, string> = {
  "Back Squat": "Barbell_Full_Squat",
  "Romanian Deadlift": "Romanian_Deadlift",
  "Walking Lunges": "Barbell_Walking_Lunge",
  "Leg Press": "Leg_Press",
  "Calf Raises": "Barbell_Seated_Calf_Raise",
  "Bench Press": "Barbell_Bench_Press_-_Medium_Grip",
  "Overhead Press": "Standing_Military_Press",
  "Incline Dumbbell Press": "Incline_Dumbbell_Press",
  "Lateral Raises": "Side_Lateral_Raise",
  "Triceps Pushdown": "Triceps_Pushdown",
  "Pull-ups / Lat Pulldown": "Pullups",
  "Barbell Row": "Bent_Over_Barbell_Row",
  "Seated Cable Row": "Seated_Cable_Rows",
  "Face Pulls": "Face_Pull",
  "Biceps Curl": "Barbell_Curl",
  "Plank": "Plank",
  "Hanging Leg Raise": "Hanging_Leg_Raise",
  "Cable Crunch": "Cable_Crunch",
  "Russian Twist": "Russian_Twist",
  "Goblet Squat": "Goblet_Squat",
  "Push-ups": "Pushups",
  "Dumbbell Row": "One-Arm_Dumbbell_Row",
  "Glute Bridge": "Barbell_Glute_Bridge",
  "Incline Walk": "Walking_Treadmill",
  "Intervals (run / bike)": "Rowing_Stationary",
  "Steady State": "Elliptical_Trainer",
};

export function findCatalogExercise(query?: string): CatalogExercise | null {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const byId = ALL_EXERCISES.find((e) => e.id.toLowerCase() === q);
  if (byId) return byId;
  const byName = ALL_EXERCISES.find((e) => e.name.toLowerCase() === q);
  if (byName) return byName;
  const legacyId = LEGACY_NAME_TO_ID[query];
  if (legacyId) return ALL_EXERCISES.find((e) => e.id === legacyId) ?? null;
  return null;
}

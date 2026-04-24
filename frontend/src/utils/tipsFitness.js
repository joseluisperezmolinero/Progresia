/**
 * Consejos de fitness para el "Tip del día" del Dashboard.
 *
 * Cada tip tiene:
 *   - titulo: string limpio, sin emoji.
 *   - texto: explicación breve.
 *   - categoria: una de las claves definidas abajo.
 *
 * La categoría determina el icono que se renderiza en el frontend
 * (ver mapa ICONOS_CATEGORIA_TIP en Dashboard.jsx).
 */

export const CATEGORIAS_TIP = {
  HIPERTROFIA:    'hipertrofia',     // ciencia del entrenamiento, volumen, técnicas
  PROGRESION:     'progresion',      // sobrecarga progresiva
  NUTRICION:      'nutricion',       // proteína, carbos, comida real
  SUPLEMENTACION: 'suplementacion',  // creatina, cafeína, whey...
  DEFINICION:     'definicion',      // déficit, pérdida de grasa
  FUERZA:         'fuerza',          // biomecánica, técnica en levantamientos
  RECUPERACION:   'recuperacion',    // sueño, descanso, movilidad
  MENTALIDAD:     'mentalidad',      // psicología, disciplina, hábitos
  TECNICA:        'tecnica',         // variantes y técnicas avanzadas
  CARDIO:         'cardio',          // rendimiento aeróbico
  PROGRAMACION:   'programacion',    // periodización, planificación
  ANATOMIA:       'anatomia',        // grupos musculares específicos
  LESIONES:       'lesiones',        // prevención y manejo
  HABITOS:        'habitos',         // estilo de vida
  CIENCIA:        'ciencia',         // fisiología avanzada
};

export const CONSEJOS_FITNESS = [
  // ─── HIPERTROFIA Y CIENCIA DEL ENTRENAMIENTO ─────────────────
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Hipertrofia real",         texto: "La clave es acercarte al fallo muscular (RIR 1-2) sin importar si haces 8 o 15 repeticiones." },
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Volumen de entrenamiento", texto: "Entre 10 y 20 series efectivas por grupo muscular a la semana es el punto dulce para la mayoría." },
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Controla la excéntrica",   texto: "Bajar el peso de forma controlada produce mayor hipertrofia que simplemente dejarlo caer." },
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Rango de recorrido (ROM)", texto: "Un rango completo con menos peso construye más músculo que medio recorrido con mucho peso." },
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Conexión mente-músculo",   texto: "Concéntrate en sentir el músculo que trabajas para reclutar más fibras musculares." },
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Explosividad concéntrica", texto: "Levanta el peso de la forma más rápida y explosiva posible para reclutar fibras de contracción rápida." },
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Estiramiento bajo carga",  texto: "Los ejercicios que enfatizan el estiramiento del músculo, como el peso muerto rumano, son potentes para la hipertrofia." },
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Tensión mecánica",         texto: "Es el factor más importante para crecer. Levanta pesos desafiantes con una técnica impecable." },
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Estrés metabólico",        texto: "Se logra con repeticiones altas y descansos cortos. Es el famoso bombeo que ayuda al crecimiento secundario." },
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Daño muscular",            texto: "No es necesario estar extremadamente dolorido para crecer. Demasiado daño puede retrasar tu recuperación." },
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Selección de ejercicios",  texto: "Prioriza ejercicios multiarticulares al principio de la sesión, cuando tienes más energía." },
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Series de aproximación",   texto: "Haz series ligeras antes de tus series efectivas para preparar el sistema nervioso y las articulaciones." },
  { categoria: CATEGORIAS_TIP.TECNICA,     titulo: "Series descendentes",      texto: "Al terminar una serie, baja el peso un 30% y sigue hasta el fallo para añadir fatiga metabólica." },
  { categoria: CATEGORIAS_TIP.TECNICA,     titulo: "Pausa-descanso",           texto: "Llega al fallo, descansa 15 segundos y haz unas pocas repeticiones más con el mismo peso." },
  { categoria: CATEGORIAS_TIP.TECNICA,     titulo: "Isométricos funcionales",  texto: "Hacer una pausa de 1 segundo en la parte más difícil del ejercicio mejora el control y la fuerza." },
  { categoria: CATEGORIAS_TIP.TECNICA,     titulo: "Series gigantes",          texto: "Encadenar 3-4 ejercicios del mismo músculo sin descanso es una técnica brutal para el estrés metabólico." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Fibras tipo II",           texto: "Las fibras de contracción rápida tienen el mayor potencial de crecimiento. Entrena con cargas altas y explosividad." },
  { categoria: CATEGORIAS_TIP.HIPERTROFIA, titulo: "Aislamiento vs compuesto", texto: "Los básicos construyen masa y los aislamientos moldean el detalle. Necesitas ambos en tu programa." },
  { categoria: CATEGORIAS_TIP.PROGRAMACION,titulo: "Ondulación de carga",      texto: "Variar los rangos de repetición semana a semana (12, 8, 15) evita la adaptación y mantiene el progreso." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Síntesis proteica",        texto: "El entrenamiento activa la síntesis proteica hasta 48h. Por eso la frecuencia 2 por grupo supera a la frecuencia 1." },

  // ─── SOBRECARGA PROGRESIVA ───────────────────────────────────
  { categoria: CATEGORIAS_TIP.PROGRESION,  titulo: "Sobrecarga progresiva",    texto: "Subir kilos no es la única forma. Hacer una repetición más o mejorar la técnica también cuenta." },
  { categoria: CATEGORIAS_TIP.PROGRESION,  titulo: "Registra todo",            texto: "Lo que no se mide, no se puede mejorar. Apunta siempre tus pesos y repeticiones." },
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "Tiempos de descanso",      texto: "En ejercicios pesados, descansa 2-3 minutos. Tu sistema nervioso necesita recuperarse para rendir igual." },
  { categoria: CATEGORIAS_TIP.PROGRAMACION,titulo: "Semanas de descarga",      texto: "Cada 6-8 semanas de entreno intenso, reduce el volumen a la mitad para disipar la fatiga acumulada." },
  { categoria: CATEGORIAS_TIP.PROGRAMACION,titulo: "Frecuencia de entrenamiento", texto: "Entrenar cada músculo 2 veces por semana es superior a hacerlo solo una vez." },
  { categoria: CATEGORIAS_TIP.PROGRESION,  titulo: "Micro-progresión",         texto: "No subas 5 kg de golpe. Usar discos pequeños de 0.5 kg o 1 kg permite progresar sin estancarse." },
  { categoria: CATEGORIAS_TIP.PROGRESION,  titulo: "Densidad de entrenamiento",texto: "Hacer el mismo trabajo en menos tiempo es una forma efectiva de progresar." },
  { categoria: CATEGORIAS_TIP.PROGRESION,  titulo: "Doble progresión",         texto: "Define un rango (8-12). Cuando alcances 12 reps con técnica limpia, sube el peso." },
  { categoria: CATEGORIAS_TIP.PROGRESION,  titulo: "Calcula tu volumen semanal",texto: "Multiplica series × reps × kg por músculo. Aumentar ese número semana a semana garantiza progreso." },
  { categoria: CATEGORIAS_TIP.PROGRAMACION,titulo: "Ciclos de fuerza",         texto: "Pasar 4-6 semanas trabajando fuerza (3-6 reps) te permite volver a hipertrofia moviendo más peso." },

  // ─── NUTRICIÓN ───────────────────────────────────────────────
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Proteína diaria",          texto: "Apunta a entre 1.6 g y 2.2 g de proteína por kilo de peso corporal para asegurar la recuperación." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Carbohidratos, tu gasolina",texto: "Son el combustible principal del entrenamiento de fuerza. No les tengas miedo en etapas de ganancia." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Grasas saludables",        texto: "Esenciales para mantener tus niveles de testosterona y tu salud hormonal en niveles óptimos." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Nutrición peri-entreno",   texto: "Consumir carbohidratos y proteína 1-2 horas antes de entrenar te dará energía para rendir." },
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "Creatina monohidrato",  texto: "5 g al día, todos los días. Mejora la fuerza, la potencia y la hidratación celular." },
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "Cafeína pre-entreno",   texto: "Toma 3-6 mg por kilo de peso 45 minutos antes. Es de los pocos suplementos con evidencia real." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Hidratación y fuerza",     texto: "Una deshidratación del 2% puede reducir tu fuerza máxima. Bebe agua durante toda la sesión." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Ventana anabólica",        texto: "No es necesario tomar el batido nada más soltar la pesa. Lo que importa es el total de proteína del día." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Vitaminas y minerales",    texto: "El magnesio y el zinc son claves para la contracción muscular y el descanso profundo." },
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "Proteína de suero",     texto: "Es solo comida en polvo. Úsala por comodidad si no llegas a tus requerimientos con comida sólida." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "El sodio importa",         texto: "Un poco de sal en tu comida pre-entreno puede mejorar el flujo sanguíneo y el bombeo." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Valor biológico",          texto: "El huevo tiene una de las proteínas de mejor calidad. No tires las yemas, tienen vitaminas clave." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Fibra y digestión",        texto: "Una buena salud intestinal mejora la absorción de nutrientes. No olvides los vegetales." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Potasio post-entreno",     texto: "El potasio ayuda a restablecer el equilibrio electrolítico muscular. El plátano es tu aliado." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Proteínas vegetales",      texto: "Combina legumbres y cereales para obtener todos los aminoácidos esenciales sin proteína animal." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Arroz vs pasta",           texto: "Ambos son buenas fuentes de carbohidratos. El arroz blanco es más fácil de digerir antes del entreno." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Omega-3",                  texto: "Reduce la inflamación y puede mejorar la síntesis proteica. Toma pescado azul o suplementa con aceite de pescado." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Chocolate negro",          texto: "Rico en magnesio y antioxidantes. Un poco post-entreno es un capricho que también te nutre." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Azúcar intra-entreno",     texto: "En sesiones largas (+75 min) tomar carbohidratos simples puede mantener el rendimiento." },

  // ─── DEFINICIÓN Y PÉRDIDA DE GRASA ──────────────────────────
  { categoria: CATEGORIAS_TIP.DEFINICION,  titulo: "Déficit calórico",         texto: "Para definir, debes gastar más de lo que consumes. Es la ley de la termodinámica." },
  { categoria: CATEGORIAS_TIP.DEFINICION,  titulo: "Entrena pesado en definición", texto: "Dile a tu cuerpo que debe mantener el músculo porque lo sigue necesitando para mover cargas." },
  { categoria: CATEGORIAS_TIP.DEFINICION,  titulo: "NEAT (actividad no deportiva)", texto: "Caminar más es la forma más fácil de quemar calorías sin añadir fatiga excesiva." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Saciedad",                 texto: "Prioriza alimentos voluminosos y bajos en calorías (verduras, frutas) para no pasar hambre en dieta." },
  { categoria: CATEGORIAS_TIP.DEFINICION,  titulo: "Comida trampa",            texto: "Una comida no arruina tu dieta, al igual que una ensalada no te pone en forma. La consistencia es la clave." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Calorías líquidas",        texto: "Evita zumos y refrescos con azúcar. Son calorías que no te sacian y se acumulan rápido." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Efecto térmico",           texto: "La proteína gasta más energía en ser digerida que las grasas o los carbos. Ayuda a quemar más calorías." },
  { categoria: CATEGORIAS_TIP.DEFINICION,  titulo: "Refeeds",                  texto: "Subir los carbohidratos un día a la semana en definición ayuda a recuperar glucógeno y salud mental." },
  { categoria: CATEGORIAS_TIP.DEFINICION,  titulo: "Déficit moderado",         texto: "Un déficit de 300-500 kcal/día es más sostenible y preserva más músculo que uno agresivo." },
  { categoria: CATEGORIAS_TIP.DEFINICION,  titulo: "Pésate bien",              texto: "Pésate cada mañana en ayunas y haz una media semanal. Un día no significa nada; la tendencia sí." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Cena proteica",            texto: "Una cena rica en proteína reduce el catabolismo nocturno y mejora la composición corporal." },
  { categoria: CATEGORIAS_TIP.HABITOS,     titulo: "Cocina en lote",           texto: "Preparar comida para varios días elimina las decisiones impulsivas y te mantiene en el plan." },

  // ─── FUERZA Y BIOMECÁNICA ───────────────────────────────────
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "Maniobra de Valsalva",     texto: "Coge aire en el abdomen y aprieta antes de levantar. Protege tu columna en pesos pesados." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "Calzado de suela plana",   texto: "Para sentadilla y peso muerto, usa suela plana o descalzo para mayor estabilidad y fuerza." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "Trayectoria de la barra",  texto: "En press banca o sentadilla, intenta que la barra viaje en línea recta vertical para ser más eficiente." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "Anchura del agarre",       texto: "En press banca, un agarre muy ancho usa más pecho; uno más cerrado usa más tríceps." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "Leg drive en press banca", texto: "Empuja el suelo con los pies para estabilizar tu torso y levantar más peso con seguridad." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "Retracción escapular",     texto: "Junta las escápulas al hacer presses para proteger tus hombros y crear una base sólida." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "El lockout",               texto: "Finaliza el movimiento apretando el músculo (glúteos en peso muerto, tríceps en press) para máximo estímulo." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Momento de fuerza",        texto: "Cuanto más lejos esté el peso de tu articulación, más difícil será el ejercicio." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "Tensión de cinturón",      texto: "El cinturón de powerlifting no reemplaza al core: te da retroalimentación para empujar contra él." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "Agarre con los pies",      texto: "En sentadilla, intenta romper el suelo hacia afuera para activar los glúteos y estabilizar la rodilla." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "Codos hacia adentro",      texto: "En press banca, llevar los codos a 45-60° (no a 90°) protege el manguito rotador y mejora la fuerza." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "Bisagra de cadera",        texto: "En peso muerto, domina la bisagra empujando las caderas hacia atrás, no bajando los hombros." },

  // ─── RECUPERACIÓN Y SALUD ───────────────────────────────────
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "Sueño profundo",           texto: "El músculo crece mientras duermes. La falta de sueño eleva el cortisol y destruye músculo." },
  { categoria: CATEGORIAS_TIP.LESIONES,    titulo: "Manejo del dolor",         texto: "Si un ejercicio te duele (dolor punzante), busca una variante. No entrenes con lesiones." },
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "Movilidad vs flexibilidad",texto: "Tener movilidad es tener control en el rango de movimiento. Calienta con movilidad dinámica." },
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "Baños de contraste",       texto: "Alternar agua fría y caliente puede ayudar a la circulación y reducir la sensación de fatiga." },
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "Masaje con rodillo",       texto: "Ayuda a relajar la fascia muscular y puede mejorar el rango de movimiento antes de entrenar." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Estrés mental",            texto: "El estrés del trabajo o los estudios también gasta energía de recuperación. Ajusta tu entreno si estás agotado." },
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "Recuperación activa",      texto: "Caminar o hacer cardio ligero los días de descanso mejora el flujo sanguíneo y la recuperación." },
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "Crioterapia",              texto: "El agua fría post-entreno puede reducir el dolor a corto plazo, pero no abuses: puede frenar la adaptación." },
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "Respiración diafragmática",texto: "Aprende a respirar desde el abdomen. Mejora la presión intra-abdominal y reduce el estrés." },
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "9 horas de sueño",         texto: "Los atletas que duermen 9h muestran mayor velocidad de reacción, fuerza y mejor humor que los que duermen 6h." },
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "Calentamiento general",    texto: "5-10 minutos de cardio ligero antes de entrenar sube la temperatura corporal y reduce el riesgo de lesión." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Fascia y tejido conectivo",texto: "Los tendones y ligamentos se adaptan más despacio que el músculo. Progresa con cabeza para no lesionarte." },

  // ─── PSICOLOGÍA Y DISCIPLINA ────────────────────────────────
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Consistencia sobre perfección", texto: "Es mejor entrenar 3 días siempre que 5 días solo una semana. La clave es el largo plazo." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Objetivos SMART",          texto: "Ponte metas específicas, medibles, alcanzables, relevantes y con tiempo definido." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "No te compares",           texto: "Tu única referencia debe ser tu yo de la semana pasada. Cada cuerpo progresa a ritmos distintos." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Mentalidad de proceso",    texto: "Disfruta del entrenamiento diario. El cambio físico es una consecuencia, no el único fin." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Disciplina vs motivación", texto: "La motivación te hace empezar, pero la disciplina te hace seguir cuando no tienes ganas." },
  { categoria: CATEGORIAS_TIP.HABITOS,     titulo: "El entorno importa",       texto: "Rodéate de gente que tenga tus mismos objetivos. Es más fácil entrenar si tus amigos también lo hacen." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Visualización",            texto: "Visualizar el levantamiento perfecto antes de hacerlo prepara a tu cerebro para ejecutarlo mejor." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Identidad de atleta",      texto: "No digas 'estoy intentando entrenar'; di 'soy alguien que entrena'. La identidad moldea el comportamiento." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Mínimo viable",            texto: "Los días que no tienes ganas, comprométete solo con 10 minutos. Casi siempre acabarás haciendo la sesión completa." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Celebra los logros",       texto: "Un nuevo récord personal en cualquier ejercicio merece reconocimiento. El cerebro aprende con el refuerzo positivo." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Aprende continuamente",    texto: "Entender el porqué de cada ejercicio te convierte en tu propio entrenador y reduce el riesgo de errores." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "El poder del lenguaje",    texto: "Cambia 'tengo que entrenar' por 'quiero entrenar'. Las palabras que usas moldean tu motivación." },

  // ─── VARIANTES Y TÉCNICAS ADICIONALES ───────────────────────
  { categoria: CATEGORIAS_TIP.TECNICA,     titulo: "Cadenas y bandas",         texto: "Añaden resistencia variable: el ejercicio se vuelve más difícil donde tú eres más fuerte." },
  { categoria: CATEGORIAS_TIP.TECNICA,     titulo: "Repeticiones pausadas",    texto: "Elimina el rebote y el impulso. Te hace mucho más fuerte en la parte más débil del ejercicio." },
  { categoria: CATEGORIAS_TIP.TECNICA,     titulo: "Entrenamiento unilateral", texto: "Hacer ejercicios a una pierna o brazo corrige descompensaciones y mejora la estabilidad central." },
  { categoria: CATEGORIAS_TIP.TECNICA,     titulo: "Concéntricas lentas",      texto: "A veces, subir el peso despacio ayuda a corregir fallos técnicos y mejorar el control muscular." },
  { categoria: CATEGORIAS_TIP.TECNICA,     titulo: "Pre-fatiga",               texto: "Hacer un ejercicio de aislamiento antes que uno compuesto ayuda a sentir mejor el músculo principal." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "Agarre de gancho",         texto: "Técnica de halterofilia para que la barra no se resbale en pesos muertos muy pesados." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Sentadilla búlgara",       texto: "El ejercicio de pierna más odiado y a la vez uno de los más efectivos para glúteo y cuádriceps." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Press Palof",              texto: "Excelente para trabajar la anti-rotación del core y proteger tu espalda." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Dominadas vs jalones",     texto: "Las dominadas requieren más control corporal; los jalones permiten aislar mejor el dorsal." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Remo con apoyo",           texto: "Apoyar el pecho en un banco al hacer remo elimina el balanceo y enfoca todo el trabajo en la espalda." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Aperturas para pecho",     texto: "Usa cables en lugar de mancuernas para mantener la tensión durante todo el recorrido." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Curva de fuerza",          texto: "Entiende que cada ejercicio es más difícil en un punto distinto. Varía tus ejercicios para cubrirlos todos." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "El bracing",               texto: "No es solo apretar el abdomen, es crear presión intra-abdominal para estabilizar toda la columna." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Posición de los pies",     texto: "En prensa de piernas, pies más altos usan más glúteo; pies más bajos usan más cuádriceps." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Ángulo de abducción",      texto: "Al hacer laterales de hombro, inclina el torso un poco hacia adelante para alinear mejor la fibra muscular." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Entrenamiento en ayunas",  texto: "No quema más grasa por sí solo, pero a algunas personas les da más foco mental. Cuestión de preferencia." },
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "Vitamina D",            texto: "Clave para la fuerza y la salud ósea. Toma el sol o suplementa si vives en zonas con poco sol." },
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "Caseína",               texto: "Proteína de absorción lenta, ideal antes de dormir para mantener el flujo de aminoácidos." },
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "Beta-alanina",          texto: "Ayuda a retrasar la fatiga en series de altas repeticiones (el picor que provoca es normal)." },
  { categoria: CATEGORIAS_TIP.PROGRAMACION,titulo: "Volumen de mantenimiento", texto: "La cantidad mínima de series para no perder músculo es mucho menor de la que crees. Úsalo en vacaciones." },
  { categoria: CATEGORIAS_TIP.HABITOS,     titulo: "NEAT y salud",             texto: "Moverse a diario mejora la sensibilidad a la insulina, ayudándote a gestionar mejor los carbohidratos." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Fatiga central",           texto: "Si tus pesos bajan de golpe en todos los ejercicios, tu cerebro necesita un descanso, no tus músculos." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Bíceps y supinación",      texto: "Para máximo pico de bíceps, gira la muñeca hacia afuera (meñique arriba) al subir la mancuerna." },
  { categoria: CATEGORIAS_TIP.LESIONES,    titulo: "Salud articular",          texto: "No ignores los chasquidos con dolor. El cartílago no se regenera fácil; cuida tus articulaciones." },
  { categoria: CATEGORIAS_TIP.FUERZA,      titulo: "Intensidad vs esfuerzo",   texto: "La intensidad es el % de tu peso máximo. El esfuerzo es cuánto te acercas al fallo. Ambos deben estar equilibrados." },
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "Higiene del sueño",        texto: "Habitación oscura, fría y sin pantallas 30 minutos antes de dormir para segregar melatonina natural." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Comida real",              texto: "El 80% de tu dieta debe venir de alimentos de un solo ingrediente. El 20% puede ser más flexible." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Batidos caseros",          texto: "Añade avena, crema de cacahuete y fruta a tu batido para un gainer saludable y potente." },
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "Temperatura corporal",     texto: "Entrenar con un buen calentamiento sube la temperatura muscular, haciendo los tejidos más elásticos y fuertes." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Cortisol y grasa abdominal", texto: "El estrés crónico dificulta la pérdida de grasa. El gimnasio es estrés; asegúrate de compensarlo con relax." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Tiempo bajo tensión",      texto: "No es tan importante como la carga total, pero series de 30-45 segundos son ideales para hipertrofia." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Mentalidad de atleta",     texto: "No entrenes para quemar lo que has comido. Entrena para ser más fuerte, rápido y funcional." },

  // ─── CARDIO Y RENDIMIENTO AERÓBICO ──────────────────────────
  { categoria: CATEGORIAS_TIP.CARDIO,      titulo: "Cardio y músculo",         texto: "El cardio moderado no destruye músculo si tu nutrición y el descanso son correctos. Son compatibles." },
  { categoria: CATEGORIAS_TIP.CARDIO,      titulo: "LISS vs HIIT",             texto: "LISS (cardio suave largo) genera menos fatiga; HIIT (intervalos) es más eficiente en tiempo. Combínalos." },
  { categoria: CATEGORIAS_TIP.CARDIO,      titulo: "Zona 2 de frecuencia cardíaca", texto: "Entrenar a intensidad conversacional mejora la eficiencia mitocondrial sin acumular fatiga." },
  { categoria: CATEGORIAS_TIP.CARDIO,      titulo: "Cardio en ayunas",         texto: "No oxida más grasa de forma significativa, pero puede ser útil si tu estómago no tolera comer antes." },
  { categoria: CATEGORIAS_TIP.CARDIO,      titulo: "El VO2max importa",        texto: "Mejorar tu capacidad aeróbica máxima tiene beneficios para la salud cardiovascular a largo plazo." },
  { categoria: CATEGORIAS_TIP.CARDIO,      titulo: "Cardio post-pesas",        texto: "Hacer cardio después de pesas (no antes) preserva el glucógeno para las series de fuerza." },
  { categoria: CATEGORIAS_TIP.HABITOS,     titulo: "Escaleras sobre ascensor", texto: "Pequeñas decisiones como subir escaleras suman cientos de calorías a tu NEAT semanal." },
  { categoria: CATEGORIAS_TIP.HABITOS,     titulo: "Deporte recreativo",       texto: "Practicar deportes que te gusten añade actividad física sin que tu cerebro lo perciba como obligación." },

  // ─── SUPLEMENTOS AVANZADOS ──────────────────────────────────
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "Ashwagandha",           texto: "Puede reducir el cortisol y mejorar la fuerza en atletas bajo estrés crónico. Hay evidencia moderada." },
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "Citrulina malato",      texto: "Mejora el flujo sanguíneo y el bombeo. Toma 6-8 g entre 30 y 40 minutos antes de entrenar." },
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "Zumo de cereza ácida",  texto: "Rico en antioxidantes y melatonina. Puede reducir el dolor muscular y mejorar la calidad del sueño." },
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "HMB",                   texto: "Puede ayudar a preservar músculo en períodos de déficit calórico severo o en atletas avanzados." },
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "L-carnitina",           texto: "No quema grasa directamente. Su beneficio real puede estar en la recuperación y la salud mitocondrial." },
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "Vitamina C y E post-entreno", texto: "Tomar antioxidantes justo tras el entreno puede bloquear las señales de adaptación. Mejor en otras comidas." },
  { categoria: CATEGORIAS_TIP.SUPLEMENTACION, titulo: "Electrolitos",          texto: "En sesiones largas o con mucho sudor, reponer sodio, potasio y magnesio previene calambres y fatiga." },

  // ─── PROGRAMACIÓN Y PERIODIZACIÓN ───────────────────────────
  { categoria: CATEGORIAS_TIP.PROGRAMACION,titulo: "Periodización lineal",     texto: "Semana 1 más volumen, semana 2 más carga. Sencillo y efectivo para principiantes e intermedios." },
  { categoria: CATEGORIAS_TIP.PROGRAMACION,titulo: "Periodización ondulante",  texto: "Varía el estímulo cada sesión (fuerza, hipertrofia, potencia). Más complejo pero muy efectivo." },
  { categoria: CATEGORIAS_TIP.PROGRAMACION,titulo: "Mesociclos de 4-6 semanas",texto: "Organiza tu entrenamiento en bloques con un objetivo claro. Cada bloque construye sobre el anterior." },
  { categoria: CATEGORIAS_TIP.PROGRAMACION,titulo: "Semana de potenciación",   texto: "Reducir el volumen 7-10 días antes de una competición o test de fuerza maximiza el rendimiento puntual." },
  { categoria: CATEGORIAS_TIP.PROGRAMACION,titulo: "Plantillas vs improvisación", texto: "Seguir un programa estructurado supera al entrenamiento improvisado en el 95% de los casos." },
  { categoria: CATEGORIAS_TIP.PROGRAMACION,titulo: "Autoregulación con RPE",   texto: "Ajusta el peso según cómo te sientes ese día. El RPE de 7-8 en tus series te protege del sobreentrenamiento." },
  { categoria: CATEGORIAS_TIP.PROGRAMACION,titulo: "Deload vs descanso total", texto: "Reducir volumen e intensidad a la mitad es mejor que parar del todo: mantienes el ritmo sin acumular fatiga." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Especificidad",            texto: "Tu cuerpo se adapta exactamente a lo que le exiges. Si quieres fuerza en sentadilla, practica sentadilla." },

  // ─── GRUPOS MUSCULARES ESPECÍFICOS ──────────────────────────
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Activación de glúteos",    texto: "Haz puentes de glúteo o abducción antes de sentadilla para mejorar la activación del músculo principal." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Cuádriceps profundos",     texto: "Las sentadillas profundas activan más cuádriceps y dan más masa que las sentadillas parciales." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Dorsal ancho",             texto: "Piensa en 'meter el codo al bolsillo' al hacer dominadas o jalones para maximizar la contracción del dorsal." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Trapecios y encogimientos",texto: "Los trapecios superiores se trabajan bien con encogimientos, pero no olvides los inferiores y medios." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Tríceps y cabeza larga",   texto: "Ejercicios sobre la cabeza (extensiones en polea alta) estiran la cabeza larga del tríceps para mayor hipertrofia." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Femoral y sentadilla",     texto: "El peso muerto rumano y el curl femoral son los mejores ejercicios para la parte posterior del muslo." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Core profundo",            texto: "El transverso del abdomen no se trabaja con crunches. Los ejercicios de anti-extensión y anti-rotación son los mejores." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Deltoides posterior",      texto: "El hombro trasero está infratrabajado en la mayoría de atletas. Prioriza pájaros y remos en cara alta." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Antebrazos",               texto: "Los antebrazos fuertes mejoran el agarre y, por tanto, el rendimiento en todos los ejercicios de tirón." },
  { categoria: CATEGORIAS_TIP.ANATOMIA,    titulo: "Mandíbula y fuerza",       texto: "Apretar los dientes durante esfuerzos máximos activa el sistema nervioso. Algunos usan protector bucal." },

  // ─── LESIONES Y PREVENCIÓN ──────────────────────────────────
  { categoria: CATEGORIAS_TIP.LESIONES,    titulo: "El dolor es información",  texto: "Distingue entre molestia muscular (buena señal) y dolor articular o tendinoso (señal de alarma)." },
  { categoria: CATEGORIAS_TIP.LESIONES,    titulo: "Ejercicios correctivos",   texto: "Dedicar 5-10 minutos al final a ejercicios correctivos previene el 80% de las lesiones por sobreuso." },
  { categoria: CATEGORIAS_TIP.LESIONES,    titulo: "Manguito rotador",         texto: "Trabaja rotaciones externas e internas con banda elástica para proteger uno de los puntos más vulnerables." },
  { categoria: CATEGORIAS_TIP.LESIONES,    titulo: "Rodillas y valgo",         texto: "Si tus rodillas se juntan al bajar en sentadilla, fortalece glúteo medio con abductores y ejercicios unilaterales." },
  { categoria: CATEGORIAS_TIP.LESIONES,    titulo: "Tensión cervical",         texto: "El cuello no debería tensarse al entrenar. Relaja la mandíbula y los trapecios durante los empujes." },
  { categoria: CATEGORIAS_TIP.LESIONES,    titulo: "Epicondilitis",            texto: "El trabajo excéntrico de antebrazo (ejercicio Tyler Twist con barra flexible) es el tratamiento más efectivo." },
  { categoria: CATEGORIAS_TIP.LESIONES,    titulo: "Tendinopatía rotuliana",   texto: "Las sentadillas isométricas contra la pared reducen el dolor rotuliano a corto plazo." },

  // ─── HÁBITOS Y ESTILO DE VIDA ───────────────────────────────
  { categoria: CATEGORIAS_TIP.HABITOS,     titulo: "Luz solar por la mañana",  texto: "10-20 minutos de sol en los ojos (sin gafas) al despertar regula el ritmo circadiano y la energía diurna." },
  { categoria: CATEGORIAS_TIP.HABITOS,     titulo: "Ducha fría al despertar",  texto: "Activa el sistema nervioso simpático, mejora el estado de alerta y puede elevar la dopamina hasta un 250%." },
  { categoria: CATEGORIAS_TIP.NUTRICION,   titulo: "Té verde y foco",          texto: "La L-teanina del té verde junto a la cafeína produce un estado de foco tranquilo sin el nerviosismo del café." },
  { categoria: CATEGORIAS_TIP.HABITOS,     titulo: "Digital detox antes de dormir", texto: "La luz azul de las pantallas suprime la melatonina. Usa modo nocturno o gafas de bloqueo de luz azul." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Meditación y rendimiento", texto: "10 minutos de meditación diaria reduce el cortisol y puede mejorar la concentración en el entrenamiento." },
  { categoria: CATEGORIAS_TIP.MENTALIDAD,  titulo: "Música y rendimiento",     texto: "Escuchar música motivadora puede aumentar el rendimiento en un 15% al activar el sistema dopaminérgico." },
  { categoria: CATEGORIAS_TIP.HABITOS,     titulo: "Orden en el gimnasio",     texto: "Preparar la ropa y la mochila la noche anterior elimina una fricción que puede sabotear tus sesiones matutinas." },
  { categoria: CATEGORIAS_TIP.HABITOS,     titulo: "Limita el móvil en el gym",texto: "Revisar el teléfono entre series alarga innecesariamente el descanso y reduce la densidad del entrenamiento." },
  { categoria: CATEGORIAS_TIP.RECUPERACION,titulo: "Movilidad matutina",       texto: "5 minutos de movilidad al levantarte activa el sistema nervioso, lubrica las articulaciones y pone el cuerpo en marcha." },
  { categoria: CATEGORIAS_TIP.HABITOS,     titulo: "Entrenamiento en casa",    texto: "Con mancuernas y una barra de dominadas puedes construir un físico impresionante sin necesidad de gimnasio." },

  // ─── CIENCIA AVANZADA ───────────────────────────────────────
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Células satélite",         texto: "Son las células madre del músculo. Se activan con el entrenamiento y son clave para la reparación y el crecimiento." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "mTOR y leucina",           texto: "La leucina (aminoácido en proteínas animales y whey) activa directamente la vía mTOR del crecimiento muscular." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "IGF-1 y hormona de crecimiento", texto: "La hormona de crecimiento se libera en el sueño profundo. Optimizar el sueño es la mejor suplementación hormonal." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Acidosis y fatiga",        texto: "Los iones de hidrógeno (no el ácido láctico) son los principales causantes de la quemazón y la fatiga muscular." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Fatiga neuromuscular",     texto: "Después de un 1RM o un entreno muy intenso, el sistema nervioso tarda más en recuperarse que el músculo." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Señalización mecánica",    texto: "Las células musculares detectan la deformación física y envían señales para construir más proteínas estructurales." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Hipertermia y rendimiento",texto: "Entrenar en calor extremo sin aclimatación reduce el rendimiento. El calor moderado puede aumentar el volumen plasmático." },
  { categoria: CATEGORIAS_TIP.CIENCIA,     titulo: "Variabilidad cardíaca",    texto: "Un HRV alto indica buena recuperación. Apps como HRV4Training o Whoop pueden guiar tu intensidad diaria." },
];
// ── Scholarship survey data ───────────────────────────────────────────────────
// Shared by both versions of the survey (the detailed one and the simple one)

/** The campuses and partner institutions that can be chosen for each course */
export const INSTITUTIONS = [
  "Harbourline University — Wattle Grove campus",
  "Harbourline University — City campus",
  "Harbourline University — Riverside campus",
  "Harbourline Online",
  "Ironbark College of Technology",
  "Coastal Institute of Engineering",
  "Golden Plains College",
  "Murray Valley Academy",
];

export interface Track {
  id: string;
  name: string;
  cluster: string;
  about: string;
}

/** The study areas and courses - shown in alphabetical order within each study area */
export const CLUSTERS: { name: string; tracks: Omit<Track, "cluster">[] }[] = [
  {
    name: "Engineering & IT",
    tracks: [
      {
        id: "aero",
        name: "Aerospace engineering",
        about:
          "This course covers the design, development and analysis of aircraft and spacecraft: aerodynamics, lightweight structures, propulsion and flight control. Graduates work in aviation, space start-ups and advanced manufacturing.",
      },
      {
        id: "architecture",
        name: "Architecture",
        about:
          "Architecture combines planning, design and engineering. Students learn to design buildings and spaces that meet functional needs and respond to the environment and engineering constraints. Graduates work in design practices, urban planning and the delivery of complex building and infrastructure projects.",
      },
      {
        id: "electrical",
        name: "Electrical engineering",
        about:
          "One of the broadest engineering courses: analogue and digital circuits, signal processing, communications, control and power systems. Graduates work across energy, telecommunications, electronics and technology companies.",
      },
      {
        id: "industrial",
        name: "Industrial engineering & management",
        about:
          "This course combines engineering with systems management: operations research, logistics, data analysis, process improvement and supply chain planning. It suits careers in planning, technology and resource management across many industries.",
      },
      {
        id: "electro-optics",
        name: "Photonics engineering",
        about:
          "A blend of physics, electronics and optics - developing lasers, sensors, thermal cameras and advanced vision systems. Skills are in demand in medical imaging, telecommunications and environmental monitoring.",
      },
    ],
  },
  {
    name: "Arts, Law & Social Sciences",
    tracks: [
      {
        id: "law",
        name: "Law",
        about:
          "Law studies cover constitutional, criminal, civil and international law. After practical legal training and admission as lawyers, graduates work in law firms, government legal services, courts and community legal centres.",
      },
      {
        id: "nutrition",
        name: "Nutrition & dietetics",
        about:
          "Nutrition science covers biochemistry, physiology and clinical nutrition. Graduates work as clinical dietitians in hospitals and community health, and in sports nutrition and public health.",
      },
      {
        id: "psychology",
        name: "Psychology",
        about:
          "This course explores behaviour and mental processes: cognitive, social and developmental psychology, and research methods. Graduates work in assessment, counselling, mental health and organisational psychology.",
      },
    ],
  },
  {
    name: "Science & Mathematics",
    tracks: [
      {
        id: "math",
        name: "Mathematics",
        about:
          "Mathematics builds advanced analytical thinking: algebra, analysis, probability and discrete maths. It is a foundation for a wide range of careers in technology, cryptography, finance and research.",
      },
      {
        id: "statistics",
        name: "Statistics",
        about:
          "This course covers data analysis, statistical inference, probability and machine learning. Graduates work in research, data science and quality assurance roles that call for in-depth quantitative analysis.",
      },
    ],
  },
  {
    name: "Health",
    tracks: [
      {
        id: "medicine",
        name: "Medicine",
        about:
          "Medicine is the longest course in the Scholars Program and includes pre-clinical and clinical studies. Graduates work as doctors in hospitals, general practice and regional and rural health services.",
      },
      {
        id: "nursing",
        name: "Nursing",
        about:
          "Nursing combines medical knowledge, hands-on care and patient management. Graduates work as registered nurses in hospitals, clinics, aged care and community health.",
      },
    ],
  },
  {
    name: "Honours & leadership programs",
    tracks: [
      {
        id: "alonim",
        name: "Harbourline Leaders",
        about:
          "An honours program that combines academic studies with dedicated training for leadership and technology roles. Entry includes extra selection steps beyond the usual Scholars Program selection.",
      },
      {
        id: "brakim",
        name: "Ironbark Tech Scholars",
        about:
          "A leading technology scholarship that leads to development and research roles. Studies are combined with industry training and hands-on placements with a partner company.",
      },
      {
        id: "psagot",
        name: "Summit Honours",
        about:
          "An honours program for applicants with outstanding achievements. It combines a degree with a leadership pathway and personal mentoring throughout your studies.",
      },
    ],
  },
];

/** A flat list of all courses, each with its study area name */
export const ALL_TRACKS: Track[] = CLUSTERS.flatMap((c) =>
  c.tracks.map((t) => ({ ...t, cluster: c.name })),
);

export const MAX_TRACKS = 4;
export const MAX_INSTITUTIONS = 3;
export const MIN_TRACKS = 2;

export const DECLARATIONS = [
  "I understand that I must sit the Harbourline Entry Assessment no later than March 2027.",
  "I understand that I must submit my assessment score or proof of registration no later than 01/05/2027.",
  "I agree that my enrolment details at partner institutions will be shared with Harbourline University.",
];

/** A chosen course - with the institutions chosen for it, in order of preference */
export interface Choice {
  trackId: string;
  institutions: string[];
}

// Seed set of learning modules, styled after Internee.pk's internship tracks.
// Edit freely to match the real module list/content you want the tutor to cover.
export const MODULES = [
  {
    id: "web-dev",
    title: "Web Development",
    description: "HTML, CSS, JavaScript, and modern frontend frameworks.",
    topics: ["HTML & CSS fundamentals", "JavaScript & DOM", "React basics", "APIs & fetch", "Deployment"],
  },
  {
    id: "data-science",
    title: "Data Science",
    description: "Python, data analysis, visualization, and intro ML.",
    topics: ["Python basics", "Pandas & NumPy", "Data visualization", "Statistics", "Intro to ML"],
  },
  {
    id: "digital-marketing",
    title: "Digital Marketing",
    description: "SEO, content strategy, and social media marketing.",
    topics: ["SEO fundamentals", "Content strategy", "Social media ads", "Analytics", "Email marketing"],
  },
  {
    id: "graphic-design",
    title: "Graphic Design",
    description: "Design principles, typography, and tools like Figma.",
    topics: ["Design principles", "Color & typography", "Figma workflow", "Branding basics", "Portfolio building"],
  },
  {
    id: "app-dev",
    title: "App Development",
    description: "Mobile-first development fundamentals.",
    topics: ["Mobile UI basics", "State management", "APIs in apps", "Local storage", "Publishing an app"],
  },
];

export function getModule(id) {
  return MODULES.find((m) => m.id === id);
}

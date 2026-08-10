/**
 * Job categories. `slug` appears in `/categories/[slug]` URLs and is therefore
 * a public, indexed contract — add entries, never rename them.
 *
 * Chosen to match how Ethiopian employers actually advertise: NGO/development
 * work, banking, and construction are first-class here rather than buried under
 * a generic "Other", because they are among the highest-volume hiring sectors.
 */
export const JOB_CATEGORIES = [
  {
    slug: "accounting-finance",
    name: "Accounting & Finance",
    nameAm: "አካውንቲንግ እና ፋይናንስ",
  },
  { slug: "admin-office", name: "Admin & Office", nameAm: "አስተዳደር እና ቢሮ" },
  { slug: "agriculture", name: "Agriculture", nameAm: "ግብርና" },
  { slug: "banking-insurance", name: "Banking & Insurance", nameAm: "ባንክ እና ኢንሹራንስ" },
  { slug: "construction", name: "Construction", nameAm: "ግንባታ" },
  { slug: "consultancy", name: "Consultancy", nameAm: "አማካሪ" },
  { slug: "creative-design", name: "Creative & Design", nameAm: "ፈጠራ እና ዲዛይን" },
  { slug: "customer-service", name: "Customer Service", nameAm: "የደንበኞች አገልግሎት" },
  { slug: "education-training", name: "Education & Training", nameAm: "ትምህርት እና ስልጠና" },
  { slug: "engineering", name: "Engineering", nameAm: "ኢንጂነሪንግ" },
  { slug: "healthcare", name: "Healthcare", nameAm: "ጤና" },
  {
    slug: "hospitality-tourism",
    name: "Hospitality & Tourism",
    nameAm: "እንግዳ ተቀባይነት እና ቱሪዝም",
  },
  { slug: "human-resources", name: "Human Resources", nameAm: "የሰው ሀብት" },
  {
    slug: "information-technology",
    name: "Information Technology",
    nameAm: "የመረጃ ቴክኖሎጂ",
  },
  { slug: "legal", name: "Legal", nameAm: "ህግ" },
  { slug: "logistics-supply-chain", name: "Logistics & Supply Chain", nameAm: "ሎጅስቲክስ" },
  { slug: "manufacturing", name: "Manufacturing", nameAm: "ማምረቻ" },
  {
    slug: "marketing-communications",
    name: "Marketing & Communications",
    nameAm: "ግብይት እና ኮሙኒኬሽን",
  },
  { slug: "ngo-development", name: "NGO & Development", nameAm: "መንግስታዊ ያልሆኑ ድርጅቶች" },
  {
    slug: "sales-business-development",
    name: "Sales & Business Development",
    nameAm: "ሽያጭ",
  },
  { slug: "science-research", name: "Science & Research", nameAm: "ሳይንስ እና ምርምር" },
  { slug: "security", name: "Security", nameAm: "ጥበቃ" },
  { slug: "transport-driving", name: "Transport & Driving", nameAm: "ትራንስፖርት እና ሹፍርና" },
  { slug: "other", name: "Other", nameAm: "ሌላ" },
] as const;

export type CategorySlug = (typeof JOB_CATEGORIES)[number]["slug"];

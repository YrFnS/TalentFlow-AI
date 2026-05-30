import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { db } from '@/lib/db';

const SKILLS_DATA = [
  // TECHNICAL
  { name: 'JavaScript', category: 'TECHNICAL', subcategory: 'Languages', aliases: '["JS","ECMAScript"]', relatedSkills: '["TypeScript","React","Node.js"]', demandLevel: 'HIGH' },
  { name: 'TypeScript', category: 'TECHNICAL', subcategory: 'Languages', aliases: '["TS"]', relatedSkills: '["JavaScript","React","Node.js"]', demandLevel: 'HIGH' },
  { name: 'React', category: 'TECHNICAL', subcategory: 'Frameworks', aliases: '["React.js","ReactJS"]', relatedSkills: '["JavaScript","TypeScript","Next.js"]', demandLevel: 'HIGH' },
  { name: 'Node.js', category: 'TECHNICAL', subcategory: 'Runtime', aliases: '["Node","NodeJS"]', relatedSkills: '["JavaScript","TypeScript","Express"]', demandLevel: 'HIGH' },
  { name: 'Python', category: 'TECHNICAL', subcategory: 'Languages', aliases: '["Py"]', relatedSkills: '["Django","Flask","Machine Learning"]', demandLevel: 'HIGH' },
  { name: 'Java', category: 'TECHNICAL', subcategory: 'Languages', aliases: '[]', relatedSkills: '["Spring","Kotlin","Android"]', demandLevel: 'HIGH' },
  { name: 'SQL', category: 'TECHNICAL', subcategory: 'Databases', aliases: '["MySQL","PostgreSQL","SQLite"]', relatedSkills: '["Database","Data Analysis"]', demandLevel: 'HIGH' },
  { name: 'AWS', category: 'TECHNICAL', subcategory: 'Cloud', aliases: '["Amazon Web Services"]', relatedSkills: '["Cloud","DevOps","Docker","Kubernetes"]', demandLevel: 'HIGH' },
  { name: 'Docker', category: 'TECHNICAL', subcategory: 'DevOps', aliases: '[]', relatedSkills: '["Kubernetes","CI/CD","DevOps"]', demandLevel: 'HIGH' },
  { name: 'Kubernetes', category: 'TECHNICAL', subcategory: 'DevOps', aliases: '["K8s"]', relatedSkills: '["Docker","DevOps","AWS"]', demandLevel: 'MEDIUM' },
  { name: 'Git', category: 'TECHNICAL', subcategory: 'Tools', aliases: '["GitHub","GitLab"]', relatedSkills: '["Version Control","CI/CD"]', demandLevel: 'HIGH' },
  { name: 'REST API', category: 'TECHNICAL', subcategory: 'Architecture', aliases: '["RESTful","REST"]', relatedSkills: '["GraphQL","Node.js","HTTP"]', demandLevel: 'HIGH' },
  { name: 'GraphQL', category: 'TECHNICAL', subcategory: 'Architecture', aliases: '["GQL"]', relatedSkills: '["REST API","Apollo","React"]', demandLevel: 'MEDIUM' },
  { name: 'CSS', category: 'TECHNICAL', subcategory: 'Languages', aliases: '["CSS3","Tailwind","SASS"]', relatedSkills: '["HTML","JavaScript","React"]', demandLevel: 'HIGH' },
  { name: 'HTML', category: 'TECHNICAL', subcategory: 'Languages', aliases: '["HTML5"]', relatedSkills: '["CSS","JavaScript","React"]', demandLevel: 'HIGH' },
  // SOFT_SKILL
  { name: 'Communication', category: 'SOFT_SKILL', subcategory: 'Interpersonal', aliases: '[]', relatedSkills: '["Leadership","Teamwork"]', demandLevel: 'HIGH' },
  { name: 'Leadership', category: 'SOFT_SKILL', subcategory: 'Interpersonal', aliases: '[]', relatedSkills: '["Communication","Problem Solving"]', demandLevel: 'HIGH' },
  { name: 'Problem Solving', category: 'SOFT_SKILL', subcategory: 'Cognitive', aliases: '["Critical Thinking"]', relatedSkills: '["Critical Thinking","Creativity"]', demandLevel: 'HIGH' },
  { name: 'Teamwork', category: 'SOFT_SKILL', subcategory: 'Interpersonal', aliases: '["Collaboration"]', relatedSkills: '["Communication","Leadership"]', demandLevel: 'HIGH' },
  { name: 'Time Management', category: 'SOFT_SKILL', subcategory: 'Self-Management', aliases: '[]', relatedSkills: '["Organization","Productivity"]', demandLevel: 'MEDIUM' },
  { name: 'Adaptability', category: 'SOFT_SKILL', subcategory: 'Self-Management', aliases: '["Flexibility"]', relatedSkills: '["Problem Solving","Creativity"]', demandLevel: 'MEDIUM' },
  { name: 'Critical Thinking', category: 'SOFT_SKILL', subcategory: 'Cognitive', aliases: '[]', relatedSkills: '["Problem Solving","Creativity"]', demandLevel: 'HIGH' },
  { name: 'Creativity', category: 'SOFT_SKILL', subcategory: 'Cognitive', aliases: '["Innovation"]', relatedSkills: '["Problem Solving","Critical Thinking"]', demandLevel: 'MEDIUM' },
  // DOMAIN
  { name: 'Project Management', category: 'DOMAIN', subcategory: 'Management', aliases: '["PM","Scrum","Agile"]', relatedSkills: '["Leadership","Time Management"]', demandLevel: 'HIGH' },
  { name: 'Data Analysis', category: 'DOMAIN', subcategory: 'Analytics', aliases: '["Analytics","BI"]', relatedSkills: '["SQL","Python","Tableau"]', demandLevel: 'HIGH' },
  { name: 'UI/UX Design', category: 'DOMAIN', subcategory: 'Design', aliases: '["User Experience","User Interface"]', relatedSkills: '["Figma","CSS","Creativity"]', demandLevel: 'HIGH' },
  { name: 'DevOps', category: 'DOMAIN', subcategory: 'Engineering', aliases: '[]', relatedSkills: '["Docker","Kubernetes","AWS","CI/CD"]', demandLevel: 'HIGH' },
  { name: 'Machine Learning', category: 'DOMAIN', subcategory: 'AI', aliases: '["ML","Deep Learning","AI"]', relatedSkills: '["Python","Data Analysis"]', demandLevel: 'HIGH' },
  { name: 'Cybersecurity', category: 'DOMAIN', subcategory: 'Security', aliases: '["InfoSec","Security"]', relatedSkills: '["Networking","Cloud"]', demandLevel: 'HIGH' },
  { name: 'Marketing', category: 'DOMAIN', subcategory: 'Business', aliases: '["Digital Marketing","Growth"]', relatedSkills: '["Sales","Communication"]', demandLevel: 'MEDIUM' },
  { name: 'Sales', category: 'DOMAIN', subcategory: 'Business', aliases: '["Business Development"]', relatedSkills: '["Marketing","Communication"]', demandLevel: 'MEDIUM' },
  { name: 'Finance', category: 'DOMAIN', subcategory: 'Business', aliases: '["Financial Analysis"]', relatedSkills: '["Data Analysis","Accounting"]', demandLevel: 'MEDIUM' },
  { name: 'Human Resources', category: 'DOMAIN', subcategory: 'Business', aliases: '["HR","People Ops"]', relatedSkills: '["Communication","Leadership"]', demandLevel: 'MEDIUM' },
  // TOOL
  { name: 'Figma', category: 'TOOL', subcategory: 'Design', aliases: '[]', relatedSkills: '["UI/UX Design","CSS"]', demandLevel: 'HIGH' },
  { name: 'Jira', category: 'TOOL', subcategory: 'Project Management', aliases: '[]', relatedSkills: '["Project Management","Agile"]', demandLevel: 'MEDIUM' },
  { name: 'Slack', category: 'TOOL', subcategory: 'Communication', aliases: '[]', relatedSkills: '["Communication","Teamwork"]', demandLevel: 'MEDIUM' },
  { name: 'VS Code', category: 'TOOL', subcategory: 'Development', aliases: '["Visual Studio Code"]', relatedSkills: '["JavaScript","TypeScript","Git"]', demandLevel: 'HIGH' },
  { name: 'Postman', category: 'TOOL', subcategory: 'Development', aliases: '[]', relatedSkills: '["REST API","Testing"]', demandLevel: 'MEDIUM' },
  { name: 'Tableau', category: 'TOOL', subcategory: 'Analytics', aliases: '[]', relatedSkills: '["Data Analysis","SQL"]', demandLevel: 'MEDIUM' },
  { name: 'Excel', category: 'TOOL', subcategory: 'Productivity', aliases: '["Spreadsheets","Google Sheets"]', relatedSkills: '["Data Analysis","Finance"]', demandLevel: 'HIGH' },
  { name: 'Salesforce', category: 'TOOL', subcategory: 'CRM', aliases: '["SFDC"]', relatedSkills: '["Sales","CRM"]', demandLevel: 'MEDIUM' },
  // CERTIFICATION
  { name: 'AWS Certified', category: 'CERTIFICATION', subcategory: 'Cloud', aliases: '["AWS Certification"]', relatedSkills: '["AWS","Cloud","DevOps"]', demandLevel: 'HIGH' },
  { name: 'PMP', category: 'CERTIFICATION', subcategory: 'Management', aliases: '["Project Management Professional"]', relatedSkills: '["Project Management","Leadership"]', demandLevel: 'HIGH' },
  { name: 'Scrum Master', category: 'CERTIFICATION', subcategory: 'Agile', aliases: '["CSM","PSM"]', relatedSkills: '["Project Management","Agile"]', demandLevel: 'MEDIUM' },
  { name: 'CISSP', category: 'CERTIFICATION', subcategory: 'Security', aliases: '[]', relatedSkills: '["Cybersecurity","Security"]', demandLevel: 'HIGH' },
  { name: 'CPA', category: 'CERTIFICATION', subcategory: 'Finance', aliases: '["Certified Public Accountant"]', relatedSkills: '["Finance","Accounting"]', demandLevel: 'MEDIUM' },
];

// POST /api/skills/seed
export async function POST() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const existingCount = await db.skillsTaxonomy.count();

    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Taxonomy already seeded with ${existingCount} skills`,
        count: existingCount,
      });
    }

    const created = await db.$transaction(
      SKILLS_DATA.map((skill) =>
        db.skillsTaxonomy.create({
          data: {
            name: skill.name,
            category: skill.category,
            subcategory: skill.subcategory,
            aliases: skill.aliases,
            relatedSkills: skill.relatedSkills,
            demandLevel: skill.demandLevel,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Seeded ${created.length} skills into taxonomy`,
      count: created.length,
    });
  } catch (error) {
    console.error('Error seeding skills taxonomy:', error);
    return NextResponse.json(
      { error: 'Failed to seed skills taxonomy' },
      { status: 500 }
    );
  }
}

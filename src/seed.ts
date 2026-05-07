import { PrismaClient, Role, JobType, ApplicationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding HireIQ database...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.job.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const hashedAdmin = await bcrypt.hash("Admin@123", 12);
  const hashedRecruiter = await bcrypt.hash("Recruiter@123", 12);
  const hashedCandidate = await bcrypt.hash("Candidate@123", 12);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@hireiq.com",
      password: hashedAdmin,
      role: Role.ADMIN,
      isVerified: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create Recruiters
  const recruiter1 = await prisma.user.create({
    data: {
      name: "Sarah Mitchell",
      email: "recruiter@hireiq.com",
      password: hashedRecruiter,
      role: Role.RECRUITER,
      isVerified: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    },
  });

  const recruiter2 = await prisma.user.create({
    data: {
      name: "James Rodriguez",
      email: "james@techvision.com",
      password: hashedRecruiter,
      role: Role.RECRUITER,
      isVerified: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
    },
  });
  console.log(`✅ Recruiters created: ${recruiter1.email}, ${recruiter2.email}`);

  // Create Candidates
  const candidate1 = await prisma.user.create({
    data: {
      name: "Alex Johnson",
      email: "candidate@hireiq.com",
      password: hashedCandidate,
      role: Role.CANDIDATE,
      isVerified: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    },
  });

  const candidate2 = await prisma.user.create({
    data: {
      name: "Emily Chen",
      email: "emily@gmail.com",
      password: hashedCandidate,
      role: Role.CANDIDATE,
      isVerified: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
    },
  });

  const candidate3 = await prisma.user.create({
    data: {
      name: "Michael Brown",
      email: "michael@gmail.com",
      password: hashedCandidate,
      role: Role.CANDIDATE,
      isVerified: true,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
    },
  });
  console.log(`✅ Candidates created`);

  // Create Companies
  const company1 = await prisma.company.create({
    data: {
      name: "NovaTech Solutions",
      logo: "https://api.dicebear.com/7.x/identicon/svg?seed=novatech",
      website: "https://novatech.example.com",
      description:
        "NovaTech Solutions is a leading software development company specializing in cloud-native applications, AI-driven analytics, and enterprise SaaS platforms. With over 500 engineers worldwide, we build scalable solutions that power Fortune 500 businesses.",
      location: "San Francisco, CA",
      industry: "Technology",
      size: "500-1000",
      recruiterId: recruiter1.id,
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: "TechVision Inc",
      logo: "https://api.dicebear.com/7.x/identicon/svg?seed=techvision",
      website: "https://techvision.example.com",
      description:
        "TechVision Inc is an innovative fintech startup transforming how businesses handle payments, lending, and financial compliance. Our AI-powered platform processes over $2B in transactions annually.",
      location: "New York, NY",
      industry: "Fintech",
      size: "100-500",
      recruiterId: recruiter2.id,
    },
  });
  console.log(`✅ Companies created: ${company1.name}, ${company2.name}`);

  // Create 12 Jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: "Senior Full-Stack Engineer",
        description:
          "We are looking for an experienced Full-Stack Engineer to lead the development of our next-generation SaaS platform. You will architect scalable microservices, build responsive frontends, and mentor junior developers. This role requires deep expertise in React, Node.js, and cloud infrastructure.",
        requirements: [
          "7+ years of full-stack development experience",
          "Strong proficiency in React/Next.js and Node.js",
          "Experience with PostgreSQL and Redis",
          "Familiarity with AWS or GCP cloud services",
          "Excellent communication and leadership skills",
        ],
        skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
        salary: "$150,000 - $190,000",
        location: "San Francisco, CA",
        type: JobType.FULL_TIME,
        category: "Engineering",
        experience: "Senior (7+ years)",
        companyId: company1.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Machine Learning Engineer",
        description:
          "Join our AI research team to design and deploy production-grade machine learning models. You will work on recommendation systems, natural language processing, and predictive analytics that directly impact millions of users.",
        requirements: [
          "5+ years in ML/AI development",
          "Strong Python and TensorFlow/PyTorch skills",
          "Experience deploying models to production",
          "MS or PhD in Computer Science or related field",
        ],
        skills: ["Python", "TensorFlow", "PyTorch", "MLOps", "SQL"],
        salary: "$160,000 - $200,000",
        location: "San Francisco, CA",
        type: JobType.FULL_TIME,
        category: "Data Science",
        experience: "Senior (5+ years)",
        companyId: company1.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Product Designer (UX/UI)",
        description:
          "We need a creative Product Designer to craft intuitive user experiences for our enterprise platform. You will conduct user research, create wireframes and high-fidelity prototypes, and collaborate closely with engineering to bring designs to life.",
        requirements: [
          "4+ years of UX/UI design experience",
          "Proficiency in Figma and design systems",
          "Strong portfolio demonstrating enterprise product design",
          "Experience with user research and usability testing",
        ],
        skills: ["Figma", "Design Systems", "User Research", "Prototyping"],
        salary: "$120,000 - $150,000",
        location: "Remote",
        type: JobType.REMOTE,
        category: "Design",
        experience: "Mid-Level (4+ years)",
        companyId: company1.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "DevOps Engineer",
        description:
          "We are seeking a DevOps Engineer to build and maintain our CI/CD pipelines, manage Kubernetes clusters, and ensure 99.99% uptime for our critical infrastructure. You will implement infrastructure-as-code and automate everything.",
        requirements: [
          "5+ years of DevOps/SRE experience",
          "Expert-level Kubernetes and Docker skills",
          "Experience with Terraform and CI/CD tools",
          "Strong scripting skills (Bash, Python)",
        ],
        skills: ["Kubernetes", "Docker", "Terraform", "AWS", "CI/CD"],
        salary: "$140,000 - $175,000",
        location: "San Francisco, CA",
        type: JobType.FULL_TIME,
        category: "Engineering",
        experience: "Senior (5+ years)",
        companyId: company1.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Frontend Developer (React)",
        description:
          "Join TechVision's frontend team to build high-performance financial dashboards and trading interfaces. You will work with real-time data streams, complex state management, and create pixel-perfect UIs that handle millions of data points.",
        requirements: [
          "3+ years of React development experience",
          "Strong TypeScript skills",
          "Experience with state management (Redux/Zustand)",
          "Understanding of web performance optimization",
        ],
        skills: ["React", "TypeScript", "Redux", "TailwindCSS", "Jest"],
        salary: "$110,000 - $140,000",
        location: "New York, NY",
        type: JobType.FULL_TIME,
        category: "Engineering",
        experience: "Mid-Level (3+ years)",
        companyId: company2.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Backend Engineer (Python)",
        description:
          "Build the core payment processing engine at TechVision. You will design high-throughput APIs, implement financial transaction logic, and ensure regulatory compliance. Our backend handles over 10,000 transactions per second.",
        requirements: [
          "4+ years of Python backend development",
          "Experience with Django or FastAPI",
          "Knowledge of financial systems and compliance",
          "Strong database design skills",
        ],
        skills: ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker"],
        salary: "$130,000 - $160,000",
        location: "New York, NY",
        type: JobType.FULL_TIME,
        category: "Engineering",
        experience: "Mid-Level (4+ years)",
        companyId: company2.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Data Analyst",
        description:
          "Analyze financial data to uncover trends, build dashboards, and provide actionable insights to our product and business teams. You will work with large datasets and present findings to senior leadership.",
        requirements: [
          "2+ years of data analysis experience",
          "Proficiency in SQL and Python",
          "Experience with BI tools (Tableau, Looker)",
          "Strong communication and presentation skills",
        ],
        skills: ["SQL", "Python", "Tableau", "Excel", "Statistics"],
        salary: "$85,000 - $110,000",
        location: "New York, NY",
        type: JobType.FULL_TIME,
        category: "Data Science",
        experience: "Junior (2+ years)",
        companyId: company2.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Marketing Intern",
        description:
          "Join our marketing team for a 6-month internship where you will help create content, manage social media campaigns, and analyze marketing performance metrics. Great opportunity to learn digital marketing in a fast-paced fintech environment.",
        requirements: [
          "Currently pursuing a degree in Marketing or related field",
          "Strong writing and communication skills",
          "Familiarity with social media platforms",
          "Basic understanding of analytics tools",
        ],
        skills: ["Content Writing", "Social Media", "Analytics", "Canva"],
        salary: "$25/hour",
        location: "New York, NY",
        type: JobType.INTERNSHIP,
        category: "Marketing",
        experience: "Entry Level",
        companyId: company2.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "QA Automation Engineer",
        description:
          "Design and implement automated testing frameworks for our platform. You will write end-to-end tests, API tests, and performance tests to ensure our software meets the highest quality standards.",
        requirements: [
          "3+ years of QA automation experience",
          "Proficiency in Selenium, Cypress, or Playwright",
          "Experience with API testing tools",
          "Knowledge of CI/CD integration",
        ],
        skills: ["Cypress", "Playwright", "Jest", "API Testing", "CI/CD"],
        salary: "$100,000 - $130,000",
        location: "Remote",
        type: JobType.REMOTE,
        category: "Engineering",
        experience: "Mid-Level (3+ years)",
        companyId: company1.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Technical Project Manager",
        description:
          "Lead cross-functional engineering teams to deliver complex software projects on time and within budget. You will manage sprint planning, stakeholder communication, and risk mitigation for our enterprise clients.",
        requirements: [
          "5+ years of project management experience in tech",
          "PMP or Scrum Master certification preferred",
          "Strong understanding of software development lifecycle",
          "Excellent stakeholder management skills",
        ],
        skills: ["Agile", "Scrum", "Jira", "Stakeholder Management", "Risk Management"],
        salary: "$125,000 - $155,000",
        location: "San Francisco, CA",
        type: JobType.FULL_TIME,
        category: "Management",
        experience: "Senior (5+ years)",
        companyId: company1.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Part-Time Content Writer",
        description:
          "Create engaging technical blog posts, case studies, and documentation for our developer-focused products. You will translate complex technical concepts into clear, compelling content.",
        requirements: [
          "2+ years of technical writing experience",
          "Understanding of software development concepts",
          "SEO knowledge preferred",
          "Portfolio of published technical content",
        ],
        skills: ["Technical Writing", "SEO", "Content Strategy", "Markdown"],
        salary: "$40-60/hour",
        location: "Remote",
        type: JobType.PART_TIME,
        category: "Marketing",
        experience: "Mid-Level (2+ years)",
        companyId: company1.id,
      },
    }),
    prisma.job.create({
      data: {
        title: "Contract Mobile Developer (React Native)",
        description:
          "Build and ship our mobile banking application for iOS and Android. This is a 6-month contract with potential conversion to full-time. You will work alongside our design and backend teams to deliver a polished mobile experience.",
        requirements: [
          "3+ years of React Native development",
          "Published apps on App Store and Google Play",
          "Experience with mobile payment integrations",
          "Knowledge of mobile security best practices",
        ],
        skills: ["React Native", "TypeScript", "iOS", "Android", "Mobile Payments"],
        salary: "$80-100/hour",
        location: "New York, NY",
        type: JobType.CONTRACT,
        category: "Engineering",
        experience: "Mid-Level (3+ years)",
        companyId: company2.id,
      },
    }),
  ]);
  console.log(`✅ ${jobs.length} jobs created`);

  // Create 5 Applications with different statuses
  const applications = await Promise.all([
    prisma.application.create({
      data: {
        jobId: jobs[0].id,
        candidateId: candidate1.id,
        status: ApplicationStatus.REVIEWING,
        coverLetter:
          "I am excited to apply for the Senior Full-Stack Engineer position. With 8 years of experience building scalable applications with React and Node.js, I believe I would be a strong addition to your team.",
        aiScore: 87.5,
        aiFeedback: "Strong technical background with relevant experience. Skills align well with requirements.",
      },
    }),
    prisma.application.create({
      data: {
        jobId: jobs[4].id,
        candidateId: candidate1.id,
        status: ApplicationStatus.PENDING,
        coverLetter:
          "I would love to bring my frontend expertise to TechVision. I have extensive experience with React, TypeScript, and building performant data-heavy UIs.",
      },
    }),
    prisma.application.create({
      data: {
        jobId: jobs[0].id,
        candidateId: candidate2.id,
        status: ApplicationStatus.SHORTLISTED,
        coverLetter:
          "As a full-stack developer with deep expertise in cloud architecture, I am eager to contribute to NovaTech's next-generation platform.",
        aiScore: 92.0,
        aiFeedback: "Excellent match. Strong cloud architecture experience differentiates this candidate.",
      },
    }),
    prisma.application.create({
      data: {
        jobId: jobs[1].id,
        candidateId: candidate2.id,
        status: ApplicationStatus.INTERVIEW,
        coverLetter:
          "My PhD research in NLP and 3 years of production ML experience make me an ideal fit for this role.",
        aiScore: 95.0,
        aiFeedback: "Top candidate. PhD background and production experience are exceptional.",
      },
    }),
    prisma.application.create({
      data: {
        jobId: jobs[5].id,
        candidateId: candidate3.id,
        status: ApplicationStatus.REJECTED,
        coverLetter:
          "I am interested in the Backend Engineer position. I have 2 years of Python development experience.",
        aiScore: 45.0,
        aiFeedback: "Below minimum experience requirements. Consider gaining more backend experience.",
      },
    }),
  ]);
  console.log(`✅ ${applications.length} applications created`);

  // Create some notifications
  await prisma.notification.createMany({
    data: [
      {
        type: "NEW_APPLICATION",
        title: "New Application Received",
        message: "Alex Johnson applied for Senior Full-Stack Engineer",
        userId: recruiter1.id,
        isRead: true,
      },
      {
        type: "APPLICATION_STATUS",
        title: "Application Shortlisted",
        message: "Your application for Senior Full-Stack Engineer has been shortlisted",
        userId: candidate2.id,
        isRead: false,
      },
      {
        type: "APPLICATION_STATUS",
        title: "Interview Scheduled",
        message: "You have been invited for an interview for Machine Learning Engineer",
        userId: candidate2.id,
        isRead: false,
      },
      {
        type: "NEW_APPLICATION",
        title: "New Application Received",
        message: "Michael Brown applied for Backend Engineer (Python)",
        userId: recruiter2.id,
        isRead: false,
      },
      {
        type: "SYSTEM",
        title: "Welcome to HireIQ",
        message: "Your account has been set up. Start exploring opportunities!",
        userId: candidate1.id,
        isRead: true,
      },
    ],
  });
  console.log("✅ Notifications created");

  console.log("\n🎉 Seeding complete!\n");
  console.log("Demo Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin:     admin@hireiq.com / Admin@123");
  console.log("Recruiter: recruiter@hireiq.com / Recruiter@123");
  console.log("Candidate: candidate@hireiq.com / Candidate@123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

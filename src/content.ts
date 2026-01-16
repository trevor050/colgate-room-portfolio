// =====================================
// YOUR PORTFOLIO CONTENT - EDIT HERE!
// =====================================
// This is where all your info goes. Just update the text and you're good!

export interface ContentItem {
  title: string;
  html: string;
}

export const content: Record<string, ContentItem> = {
  // ==================
  // AWARDS & HONORS
  // ==================
  awards: {
    title: "Awards & Honors",
    html: `
      <h2>Awards & Honors</h2>
      <ul>
        <li><span class="highlight">AP Scholar with Distinction</span> — College Board, 2025</li>
        <li><span class="highlight">National Merit Semifinalist</span> — NMSC, 2025</li>
        <li><span class="highlight">1st Place, Regional Science Fair</span> — CS Category, 2024</li>
        <li><span class="highlight">Dean's List</span> — All semesters</li>
        <li><span class="highlight">Outstanding CS Student</span> — School Award, 2024</li>
      </ul>
      <p style="margin-top: 24px; color: #666; font-size: 14px; font-style: italic;">
        Edit src/content.ts to add your own awards
      </p>
    `
  },
  
  // ==================
  // ACADEMICS (SAT, GPA)
  // ==================
  academics: {
    title: "Academics",
    html: `
      <h2>Academic Profile</h2>
      <div class="stat">
        <span class="stat-label">SAT Score</span>
        <span class="stat-value">1520</span>
      </div>
      <div class="stat">
        <span class="stat-label">GPA (Unweighted)</span>
        <span class="stat-value">3.95</span>
      </div>
      <div class="stat">
        <span class="stat-label">GPA (Weighted)</span>
        <span class="stat-value">4.7</span>
      </div>
      <div class="stat">
        <span class="stat-label">Class Rank</span>
        <span class="stat-value">Top 5%</span>
      </div>
      <div class="stat">
        <span class="stat-label">AP Courses Completed</span>
        <span class="stat-value">8</span>
      </div>
      <h3>Test Scores Breakdown</h3>
      <div class="stat">
        <span class="stat-label">SAT Math</span>
        <span class="stat-value">780</span>
      </div>
      <div class="stat">
        <span class="stat-label">SAT Reading/Writing</span>
        <span class="stat-value">740</span>
      </div>
    `
  },
  
  // ==================
  // SENIOR YEAR SCHEDULE
  // ==================
  schedule: {
    title: "Senior Year Schedule",
    html: `
      <h2>Senior Year Classes</h2>
      <h3>Full AP Courseload</h3>
      <ul>
        <li><span class="highlight">AP Computer Science A</span></li>
        <li><span class="highlight">AP Calculus BC</span></li>
        <li><span class="highlight">AP Physics C: Mechanics</span></li>
        <li><span class="highlight">AP English Literature</span></li>
        <li><span class="highlight">AP Government & Politics</span></li>
        <li><span class="highlight">AP Statistics</span></li>
      </ul>
      <p style="margin-top: 20px; color: #4ade80; font-size: 18px;">
        Most rigorous schedule available at my school
      </p>
      <p style="color: #888; font-size: 14px;">
        Taking 6 AP classes senior year demonstrates my commitment to academic excellence and my readiness for college-level coursework.
      </p>
    `
  },
  
  // ==================
  // PROJECTS & EXTRACURRICULARS
  // ==================
  projects: {
    title: "Projects & Extracurriculars",
    html: `
      <h2>Developer Setup</h2>
      
      <h3>Technical Projects</h3>
      <ul>
        <li><span class="highlight">AI Study Assistant</span> — Built with Python, OpenAI API, and React. Helps students create personalized study plans.</li>
        <li><span class="highlight">School Event Platform</span> — Full-stack app serving 500+ students daily. Built with Next.js and PostgreSQL.</li>
        <li><span class="highlight">Game Portfolio</span> — 5 published games on itch.io with 10k+ total downloads.</li>
        <li><span class="highlight">Open Source</span> — Active GitHub contributor with 50+ contributions.</li>
      </ul>
      
      <h3>Leadership & Activities</h3>
      <ul>
        <li><span class="highlight">CS Club President</span> — Founded and lead school's programming club (30+ members)</li>
        <li><span class="highlight">Hackathon Organizer</span> — Organized 3 school-wide hackathons</li>
        <li><span class="highlight">Math Team Captain</span> — Led team to state competition</li>
        <li><span class="highlight">Volunteer Tutor</span> — 100+ hours tutoring STEM subjects</li>
      </ul>
      
      <h3>Links</h3>
      <p style="font-size: 18px;">
        <a href="https://github.com/yourusername" target="_blank" style="color: #61afef;">GitHub</a> · 
        <a href="https://linkedin.com/in/yourname" target="_blank" style="color: #61afef;">LinkedIn</a> · 
        <a href="mailto:your@email.com" style="color: #61afef;">Email</a>
      </p>
    `
  }
};

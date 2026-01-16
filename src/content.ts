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
      
      <div class="featured-award">
        <div class="pixel-icon trophy"></div>
        <div class="featured-content">
          <span class="featured-label">Featured Achievement</span>
          <h3 class="featured-title">Hawk Hack 2024 Champion</h3>
          <p class="featured-subtitle">Monmouth University Statewide Hackathon</p>
          <div class="featured-details">
            <span class="badge gold">1st Place</span>
            <span class="badge">Team Lead</span>
            <span class="badge">Java</span>
          </div>
          <p class="featured-description">Co-led a team of 3 to victory in a competitive statewide hackathon, solving complex Java challenges under time pressure. This experience sharpened my problem-solving skills and reinforced my passion for collaborative coding.</p>
        </div>
      </div>
      
      <h3 class="other-awards-header">Other Recognitions</h3>
      <div class="awards-grid">
        <div class="award-card">
          <div class="pixel-icon graduate"></div>
          <div class="award-info">
            <span class="award-name">First-Generation Recognition Award</span>
            <span class="award-org">College Board • National</span>
          </div>
        </div>
        <div class="award-card">
          <div class="pixel-icon medal"></div>
          <div class="award-info">
            <span class="award-name">School Recognition Award</span>
            <span class="award-org">College Board • National</span>
          </div>
        </div>
      </div>
    `
  },
  
  // ==================
  // ACADEMICS (SAT, GPA)
  // ==================
  academics: {
    title: "Academics",
    html: `
      <h2>Academic Profile</h2>
      
      <div class="academics-hero\">
        <div class="gpa-display">
          <span class="gpa-label">Weighted GPA</span>
          <span class="gpa-value">4.07</span>
        </div>
        <div class="sat-display">
          <span class="sat-label">SAT Score</span>
          <span class="sat-value">1440</span>
        </div>
      </div>
      
      <h3>Academic Stats</h3>
      <div class="stat">
        <span class="stat-label">GPA (Unweighted)</span>
        <span class="stat-value">3.8</span>
      </div>
      <div class="stat">
        <span class="stat-label">Honors Courses</span>
        <span class="stat-value">8</span>
      </div>
      <div class="stat">
        <span class="stat-label">AP Courses</span>
        <span class="stat-value">5</span>
      </div>
      
      <h3>SAT Breakdown</h3>
      <div class="sat-breakdown">
        <div class="sat-section">
          <div class="sat-section-header">
            <span class="sat-section-name">Math</span>
            <span class="sat-section-score">780</span>
          </div>
          <div class="sat-bar">
            <div class="sat-bar-fill math" style="width: 97.5%"></div>
          </div>
        </div>
        <div class="sat-section">
          <div class="sat-section-header">
            <span class="sat-section-name">Reading & Writing</span>
            <span class="sat-section-score">660</span>
          </div>
          <div class="sat-bar">
            <div class="sat-bar-fill reading" style="width: 82.5%"></div>
          </div>
        </div>
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
      <div class="schedule-grid">
        <div class="class-card ap">
          <span class="class-type">AP</span>
          <span class="class-name">Physics</span>
        </div>
        <div class="class-card ap">
          <span class="class-type">AP</span>
          <span class="class-name">Environmental Science</span>
        </div>
        <div class="class-card ap">
          <span class="class-type">AP</span>
          <span class="class-name">Language & Composition</span>
        </div>
        <div class="class-card ap">
          <span class="class-type">AP</span>
          <span class="class-name">Computer Science Principles</span>
        </div>
        <div class="class-card honors">
          <span class="class-type">Honors</span>
          <span class="class-name">Pre-Calculus</span>
        </div>
        <div class="class-card special">
          <span class="class-type">Career</span>
          <span class="class-name">Technology Internship</span>
        </div>
      </div>
    `
  },
  
  // ==================
  // PROJECTS & EXTRACURRICULARS
  // ==================
  projects: {
    title: "Projects & Extracurriculars",
    html: `
      <h2>Projects & Activities</h2>
      
      <div class="project-card featured-project">
        <div class="project-header">
          <div class="pixel-icon briefcase"></div>
          <div>
            <h3>Technology Department Intern</h3>
            <span class="project-org">Middlesex Board of Education</span>
          </div>
        </div>
        <p>Manage lifecycle of 10,000+ IT assets, resolve hundreds of tickets, trained 7 new interns in 2025.</p>
        <div class="project-tags">
          <span class="tag">IT Management</span>
          <span class="tag">Leadership</span>
        </div>
      </div>
      
      <div class="project-card featured-project">
        <div class="project-header">
          <div class="pixel-icon globe"></div>
          <div>
            <h3>mytaxreceipt.org</h3>
            <span class="project-org">Founder & Developer</span>
          </div>
        </div>
        <p>Built civic site explaining federal tax spending with 100,000+ visitors. Connects visitors to aligned organizations.</p>
        <div class="project-tags">
          <span class="tag">100K+ Visitors</span>
          <span class="tag">Civic Tech</span>
        </div>
      </div>
      
      <div class="project-card">
        <div class="project-header">
          <div class="pixel-icon laptop"></div>
          <div>
            <h3>Freelance Web Developer</h3>
            <span class="project-org">Self-employed</span>
          </div>
        </div>
        <p>Shipped band, portfolio, and resume sites to nearly a dozen clients; donated work to friends and family.</p>
      </div>
      
      <div class="project-card">
        <div class="project-header">
          <div class="pixel-icon star"></div>
          <div>
            <h3>Public Relations Manager</h3>
            <span class="project-org">Astronomy Club</span>
          </div>
        </div>
        <p>Grew club from zero to second largest; organized Q&A with a U.S. Space Force member.</p>
      </div>
      
      <div class="project-card">
        <div class="project-header">
          <div class="pixel-icon package"></div>
          <div>
            <h3>Content-Guard</h3>
            <span class="project-org">Open-Source Maintainer</span>
          </div>
        </div>
        <p>Lightweight npm package for filtering harmful content; 1,000+ downloads and deployed on client sites.</p>
        <div class="project-tags">
          <span class="tag">npm</span>
          <span class="tag">1K+ Downloads</span>
        </div>
      </div>
      
      <div class="project-card">
        <div class="project-header">
          <div class="pixel-icon book"></div>
          <div>
            <h3>Library Volunteer</h3>
            <span class="project-org">Middlesex Public Library</span>
          </div>
        </div>
        <p>Helped in children's department, engaging kids and encouraging reading.</p>
      </div>
    `
  }
};

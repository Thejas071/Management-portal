(() => {
  "use strict";

  const STORAGE_KEY = "edumanage.portal.v1";
  const THEME_KEY = "edumanage.theme";
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();
  const isoDate = (date = today) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };
  const daysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return isoDate(date);
  };
  const id = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const sampleState = () => {
    const courses = [
      { id: "course-mca", name: "MCA", department: "Computer Applications", description: "Advanced computing, software engineering and applied technology." },
      { id: "course-bca", name: "BCA", department: "Computer Applications", description: "Undergraduate foundations in computing and application development." },
      { id: "course-mba", name: "MBA", department: "Business Administration", description: "Leadership, strategy and practical business management." },
      { id: "course-btech", name: "B.Tech Computer Science", department: "Engineering", description: "Core engineering principles, computer science and innovation." }
    ];
    const students = [
      { id: "EDU-2026-001", name: "Rahul Kumar", email: "rahul.kumar@example.edu", phone: "+91 98765 43210", gender: "Male", dob: "2003-04-15", address: "12 Lake View Road, Bengaluru", courseId: "course-mca", department: "Computer Applications", enrollmentDate: daysAgo(5), academicYear: "2025–26", status: "Active", photo: "" },
      { id: "EDU-2026-002", name: "Priya Sharma", email: "priya.sharma@example.edu", phone: "+91 98765 43211", gender: "Female", dob: "2004-08-21", address: "8 Park Street, Mysuru", courseId: "course-bca", department: "Computer Applications", enrollmentDate: daysAgo(12), academicYear: "2025–26", status: "Active", photo: "" },
      { id: "EDU-2026-003", name: "Arjun R", email: "arjun.r@example.edu", phone: "+91 98765 43212", gender: "Male", dob: "2002-11-02", address: "24 Green Avenue, Bengaluru", courseId: "course-mba", department: "Business Administration", enrollmentDate: daysAgo(24), academicYear: "2025–26", status: "Active", photo: "" },
      { id: "EDU-2026-004", name: "Ananya Iyer", email: "ananya.iyer@example.edu", phone: "+91 98765 43213", gender: "Female", dob: "2003-02-13", address: "19 Temple Road, Chennai", courseId: "course-btech", department: "Engineering", enrollmentDate: daysAgo(48), academicYear: "2025–26", status: "Active", photo: "" },
      { id: "EDU-2026-005", name: "Kabir Mehta", email: "kabir.mehta@example.edu", phone: "+91 98765 43214", gender: "Male", dob: "2001-06-07", address: "5 Hill Street, Pune", courseId: "course-mca", department: "Computer Applications", enrollmentDate: daysAgo(71), academicYear: "2024–25", status: "Inactive", photo: "" }
    ];
    const attendance = [];
    for (const student of students.slice(0, 4)) {
      attendance.push({ id: id("att"), studentId: student.id, date: daysAgo(2), status: "Present" });
      attendance.push({ id: id("att"), studentId: student.id, date: daysAgo(1), status: student.id.endsWith("003") ? "Late" : "Present" });
      attendance.push({ id: id("att"), studentId: student.id, date: daysAgo(0), status: student.id.endsWith("004") ? "Absent" : "Present" });
    }
    return {
      students,
      courses,
      attendance,
      assignments: [
        { id: "assignment-1", title: "Foundations of Data Structures", courseId: "course-mca", dueDate: daysAgo(-8), description: "Submit a short analysis of common data structures and their use cases.", submissions: {} },
        { id: "assignment-2", title: "Principles of Marketing", courseId: "course-mba", dueDate: daysAgo(-14), description: "Prepare a concise market-entry proposal for a product of your choice.", submissions: {} }
      ],
      announcements: [
        { id: "announcement-1", title: "Welcome to the new semester", message: "Course materials and schedules are now available. Please check your course pages for updates.", date: daysAgo(1) },
        { id: "announcement-2", title: "Library hours extended", message: "The central library will remain open until 8:00 PM on weekdays this month.", date: daysAgo(4) }
      ],
      activities: [
        { text: "Rahul Kumar registered for MCA", date: daysAgo(5), type: "student" },
        { text: "New semester announcement published", date: daysAgo(1), type: "announcement" },
        { text: "Attendance updated for today's classes", date: daysAgo(0), type: "attendance" }
      ],
      settings: { institution: "MEVI Student Portal", academicYear: "2025–26" }
    };
  };

  const safeParse = (value) => {
    try { return value ? JSON.parse(value) : null; } catch (error) {
      console.error("Could not read saved MEVI Student Portal data.", error);
      return null;
    }
  };
  let state = safeParse(localStorage.getItem(STORAGE_KEY)) || sampleState();
  const renameDefaultInstitution = state.settings?.institution === "EduManage University";
  if (renameDefaultInstitution) state.settings.institution = "MEVI Student Portal";
  let activeView = "dashboard";
  let studentQuery = "";
  let studentCourseFilter = "";
  let studentStatusFilter = "";
  let selectedAttendanceDate = isoDate();
  let sidebarOpen = false;
  const content = document.getElementById("page-content");
  const modalRoot = document.getElementById("modal-root");
  if (!content || !modalRoot) return;
  const themeToggle = document.getElementById("theme-toggle");
  const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const getCourse = (courseId) => state.courses.find((course) => course.id === courseId);
  const courseName = (courseId) => getCourse(courseId)?.name || "Unassigned";
  const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "?";
  const avatar = (person, extraClass = "") => person.photo
    ? `<img class="avatar ${extraClass}" src="${esc(person.photo)}" alt="">`
    : `<span class="avatar ${extraClass}">${esc(initials(person.name))}</span>`;
  const formatDate = (date) => {
    if (!date) return "—";
    const parsed = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  };
  const relativeDate = (date) => {
    if (date === isoDate()) return "Today";
    if (date === daysAgo(1)) return "Yesterday";
    return formatDate(date);
  };
  const notify = (message, type = "success") => {
    const region = document.getElementById("toast-region");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    region.append(toast);
    window.setTimeout(() => toast.remove(), 3400);
  };
  const applyTheme = (theme, save = false) => {
    const selectedTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = selectedTheme;
    const switchTo = selectedTheme === "dark" ? "light" : "dark";
    themeToggle.setAttribute("aria-label", `Switch to ${switchTo} mode`);
    themeToggle.title = `Switch to ${switchTo} mode`;
    themeToggle.querySelector(".theme-toggle-icon").textContent = selectedTheme === "dark" ? "☀" : "☾";
    themeToggle.querySelector(".theme-toggle-label").textContent = selectedTheme === "dark" ? "Light mode" : "Dark mode";
    document.querySelector('meta[name="theme-color"]').content = selectedTheme === "dark" ? "#171a29" : "#f7f8fc";
    if (save) {
      try {
        localStorage.setItem(THEME_KEY, selectedTheme);
      } catch (error) {
        console.error("Could not save the appearance preference.", error);
        notify("Theme changed, but the preference could not be saved.", "error");
      }
    }
  };
  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error("Could not save MEVI Student Portal data to local storage.", error);
      notify("Could not save changes. Check available browser storage.", "error");
      return false;
    }
  };
  if (renameDefaultInstitution) persist();
  const recordActivity = (text, type = "general") => {
    state.activities.unshift({ text, date: isoDate(), type });
    state.activities = state.activities.slice(0, 20);
  };
  const attendanceFor = (studentId) => state.attendance.filter((entry) => entry.studentId === studentId);
  const attendancePercent = (studentId) => {
    const entries = attendanceFor(studentId);
    if (!entries.length) return 0;
    const attended = entries.filter((entry) => entry.status === "Present" || entry.status === "Late").length;
    return Math.round((attended / entries.length) * 100);
  };
  const overallAttendance = () => {
    if (!state.attendance.length) return 0;
    const attended = state.attendance.filter((entry) => entry.status !== "Absent").length;
    return Math.round((attended / state.attendance.length) * 100);
  };
  const statusBadge = (status) => `<span class="badge ${esc(String(status).toLowerCase())}">${esc(status)}</span>`;
  const nav = (view) => {
    activeView = view;
    document.querySelectorAll(".nav-link[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    const label = view[0].toUpperCase() + view.slice(1);
    document.getElementById("current-section").textContent = label;
    document.title = `MEVI Student Portal — ${label}`;
    closeSidebar();
    render();
  };
  const closeSidebar = () => {
    sidebarOpen = false;
    document.getElementById("sidebar").classList.remove("open");
    document.querySelector(".mobile-overlay")?.classList.remove("show");
  };
  const pageHeader = (title, subtitle, actions = "") => `
    <div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
  const actionButton = (label, action, primary = false, icon = "") =>
    `<button type="button" class="button ${primary ? "primary" : ""}" data-action="${action}">${icon ? `<span class="plus">${icon}</span>` : ""}${label}</button>`;

  function renderDashboard() {
    const total = state.students.length;
    const active = state.students.filter((student) => student.status === "Active").length;
    const inactive = total - active;
    const recent = [...state.students].sort((a, b) => b.enrollmentDate.localeCompare(a.enrollmentDate)).slice(0, 5);
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - 5 + index);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const count = state.students.filter((student) => student.enrollmentDate?.startsWith(key)).length;
      return { label: monthNames[date.getMonth()], count };
    });
    const max = Math.max(1, ...months.map((month) => month.count));
    const courseStats = state.courses.slice(0, 5).map((course) => ({
      course, count: state.students.filter((student) => student.courseId === course.id).length
    }));
    content.innerHTML = `
      ${pageHeader("Dashboard", "Welcome back, Administrator! Here's what's happening across your campus today.",
        `${actionButton("Add student", "add-student", true, "+")}${actionButton("Create assignment", "add-assignment", false, "+")}`)}
      <section class="stats-grid" aria-label="Campus statistics">
        <article class="stat-card"><div><div class="stat-label">Total students</div><div class="stat-value">${total.toLocaleString()}</div><div class="stat-foot"><span class="positive">●</span> Enrolled students</div></div><span class="stat-icon">♙</span></article>
        <article class="stat-card"><div><div class="stat-label">Active students</div><div class="stat-value">${active.toLocaleString()}</div><div class="stat-foot"><span class="positive">${total ? Math.round(active / total * 100) : 0}%</span> of all students</div></div><span class="stat-icon green">✓</span></article>
        <article class="stat-card"><div><div class="stat-label">Inactive students</div><div class="stat-value">${inactive.toLocaleString()}</div><div class="stat-foot">Needs follow-up</div></div><span class="stat-icon orange">◷</span></article>
        <article class="stat-card"><div><div class="stat-label">Total courses</div><div class="stat-value">${state.courses.length}</div><div class="stat-foot">${state.assignments.length} assignments in progress</div></div><span class="stat-icon blue">▤</span></article>
        <article class="stat-card"><div><div class="stat-label">Attendance</div><div class="stat-value">${overallAttendance()}%</div><div class="stat-foot">Present or late check-ins</div></div><span class="stat-icon green">✓</span></article>
      </section>
      <section class="dashboard-grid">
        <article class="panel">
          <div class="panel-heading"><div><h2>Student enrollment</h2><p>New registrations over the last six months</p></div><span class="chart-legend"><i class="legend-dot"></i> Students</span></div>
          <div class="chart-area" role="img" aria-label="Monthly student registrations">${months.map((month) => `<div class="chart-column"><div class="chart-track"><div class="chart-bar" style="height:${Math.max(month.count ? 12 : 4, month.count / max * 100)}%"></div></div><span>${month.label}</span></div>`).join("")}</div>
        </article>
        <article class="panel">
          <div class="panel-heading"><div><h2>Course enrollment</h2><p>Students enrolled by course</p></div><button class="panel-heading-link" data-view="courses">View courses →</button></div>
          <div class="course-stat-list">${courseStats.length ? courseStats.map(({ course, count }) => `<div class="course-stat"><span class="course-mark">${esc(initials(course.name))}</span><div class="course-meta"><strong>${esc(course.name)}</strong><small>${esc(course.department || "General")}</small></div><span class="course-total">${count}</span></div>`).join("") : `<div class="empty-state">No courses yet.</div>`}</div>
        </article>
      </section>
      <section class="dashboard-grid">
        <article class="table-panel">
          <div class="panel-heading"><div><h2>Recent student registrations</h2><p>Your latest additions to the student directory</p></div><button class="panel-heading-link" data-view="students">View all →</button></div>
          ${recent.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>STUDENT</th><th>COURSE</th><th>ENROLLED</th><th>STATUS</th></tr></thead><tbody>${recent.map((student) => `<tr><td><div class="student-cell">${avatar(student)}<button data-action="profile" data-id="${esc(student.id)}">${esc(student.name)}</button></div></td><td>${esc(courseName(student.courseId))}</td><td>${formatDate(student.enrollmentDate)}</td><td>${statusBadge(student.status)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state"><strong>No students registered</strong>Add your first student to get started.</div>`}
        </article>
        <article class="panel">
          <div class="panel-heading"><div><h2>Recent activity</h2><p>Latest updates from your portal</p></div></div>
          <div class="activity-list">${state.activities.slice(0, 5).map((activity) => `<div class="activity-item"><span class="activity-dot"></span><p>${esc(activity.text)}<small>${relativeDate(activity.date)}</small></p></div>`).join("") || `<div class="empty-state">Activities will appear here.</div>`}</div>
        </article>
      </section>
      <section class="panel">
        <div class="panel-heading"><div><h2>Announcements</h2><p>Important campus updates</p></div><button class="panel-heading-link" data-view="announcements">All announcements →</button></div>
        ${state.announcements.length ? `<div class="announcement-list">${[...state.announcements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2).map(announcementMarkup).join("")}</div>` : `<div class="empty-state">No announcements published yet.</div>`}
      </section>`;
  }

  function studentRows(students) {
    return students.map((student) => `<tr>
      <td><div class="student-cell">${avatar(student)}<button data-action="profile" data-id="${esc(student.id)}">${esc(student.name)}</button></div></td>
      <td>${esc(student.id)}</td><td>${esc(student.email)}</td><td>${esc(courseName(student.courseId))}</td>
      <td>${formatDate(student.enrollmentDate)}</td><td>${statusBadge(student.status)}</td>
      <td><div class="row-actions"><button class="row-action" data-action="edit-student" data-id="${esc(student.id)}" aria-label="Edit ${esc(student.name)}" title="Edit">✎</button><button class="row-action delete" data-action="delete-student" data-id="${esc(student.id)}" aria-label="Delete ${esc(student.name)}" title="Delete">⌫</button></div></td>
    </tr>`).join("");
  }
  function renderStudents() {
    const filtered = [...state.students].filter((student) => {
      const query = studentQuery.trim().toLowerCase();
      return (!query || `${student.name} ${student.id} ${student.email}`.toLowerCase().includes(query))
        && (!studentCourseFilter || student.courseId === studentCourseFilter)
        && (!studentStatusFilter || student.status === studentStatusFilter);
    }).sort((a, b) => a.name.localeCompare(b.name));
    content.innerHTML = `
      ${pageHeader("Students", "Manage student records, enrollment details and academic status.", actionButton("Add student", "add-student", true, "+"))}
      <div class="toolbar">
        <label class="search-wrap"><span>⌕</span><input type="search" id="student-search" placeholder="Search by name, ID or email..." value="${esc(studentQuery)}" aria-label="Search students"></label>
        <select id="student-course-filter" aria-label="Filter by course"><option value="">All courses</option>${state.courses.map((course) => `<option value="${esc(course.id)}" ${studentCourseFilter === course.id ? "selected" : ""}>${esc(course.name)}</option>`).join("")}</select>
        <select id="student-status-filter" aria-label="Filter by status"><option value="">All statuses</option><option ${studentStatusFilter === "Active" ? "selected" : ""}>Active</option><option ${studentStatusFilter === "Inactive" ? "selected" : ""}>Inactive</option></select>
        <span class="field-hint">${filtered.length} student${filtered.length === 1 ? "" : "s"}</span>
      </div>
      <section class="table-panel student-table"><div class="data-table-wrap">
        ${filtered.length ? `<table class="data-table"><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>EMAIL</th><th>COURSE</th><th>ENROLLED</th><th>STATUS</th><th></th></tr></thead><tbody>${studentRows(filtered)}</tbody></table>` : `<div class="empty-state"><strong>No students found</strong>Try changing your search or filters, or add a new student.</div>`}
      </div></section>`;
  }

  function renderCourses() {
    content.innerHTML = `${pageHeader("Courses", "Build your course catalog and keep track of student enrollment.", actionButton("Add course", "add-course", true, "+"))}
      ${state.courses.length ? `<section class="feature-grid">${state.courses.map((course) => {
        const enrolled = state.students.filter((student) => student.courseId === course.id).length;
        return `<article class="feature-card"><div class="feature-top"><span class="feature-icon">${esc(initials(course.name))}</span><div class="feature-card-actions"><button class="row-action" data-action="edit-course" data-id="${esc(course.id)}" aria-label="Edit ${esc(course.name)}" title="Edit">✎</button><button class="row-action delete" data-action="delete-course" data-id="${esc(course.id)}" aria-label="Delete ${esc(course.name)}" title="Delete">⌫</button></div></div><h3>${esc(course.name)}</h3><p>${esc(course.description || "No course description added.")}</p><div class="feature-meta"><span>${esc(course.department || "General")}</span><strong>${enrolled} enrolled</strong></div></article>`;
      }).join("")}</section>` : `<div class="panel empty-state"><strong>Your course catalog is empty</strong>Add a course to start assigning students.</div>`}`;
  }

  function renderAttendance() {
    const daily = state.students.slice().sort((a, b) => a.name.localeCompare(b.name));
    const saved = state.attendance.filter((entry) => entry.date === selectedAttendanceDate);
    const recent = [...state.attendance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    content.innerHTML = `${pageHeader("Attendance", "Record daily attendance and review each student's attendance rate.", `<span class="stat-foot">Overall attendance <strong class="positive">${overallAttendance()}%</strong></span>`)}
      <section class="panel">
        <div class="panel-heading"><div><h2>Mark attendance</h2><p>Choose a date and update each student's status.</p></div><label class="field"><span class="field-hint">Attendance date</span><input id="attendance-date" type="date" value="${esc(selectedAttendanceDate)}"></label></div>
        ${daily.length ? `<div class="data-table-wrap"><table class="attendance-marking"><thead><tr><th>STUDENT</th><th>COURSE</th><th>ATTENDANCE</th></tr></thead><tbody>${daily.map((student) => {
          const entry = saved.find((record) => record.studentId === student.id);
          const current = entry?.status || "Present";
          return `<tr><td><div class="student-cell">${avatar(student)}<span>${esc(student.name)}</span></div></td><td>${esc(courseName(student.courseId))}</td><td><select class="attendance-select" data-student="${esc(student.id)}"><option ${current === "Present" ? "selected" : ""}>Present</option><option ${current === "Absent" ? "selected" : ""}>Absent</option><option ${current === "Late" ? "selected" : ""}>Late</option></select></td></tr>`;
        }).join("")}</tbody></table></div><div class="modal-footer" style="padding:16px 0 0;border:0"><button class="button primary" data-action="save-attendance">Save attendance</button></div>` : `<div class="empty-state"><strong>No students available</strong>Add students before recording attendance.</div>`}
      </section>
      <section class="panel" style="margin-top:17px"><div class="panel-heading"><div><h2>Recent attendance history</h2><p>Latest recorded student attendance</p></div></div>
      ${recent.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>STUDENT</th><th>DATE</th><th>STATUS</th><th>ATTENDANCE RATE</th></tr></thead><tbody>${recent.map((entry) => {
        const student = state.students.find((record) => record.id === entry.studentId);
        if (!student) return "";
        return `<tr><td>${esc(student.name)}</td><td>${formatDate(entry.date)}</td><td>${statusBadge(entry.status)}</td><td>${attendancePercent(student.id)}%</td></tr>`;
      }).join("")}</tbody></table></div>` : `<div class="empty-state">No attendance records yet.</div>`}</section>`;
  }

  function renderAssignments() {
    const assignments = [...state.assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    content.innerHTML = `${pageHeader("Assignments", "Create course work, set due dates and monitor submissions.", actionButton("Create assignment", "add-assignment", true, "+"))}
      ${assignments.length ? `<section class="assignment-list">${assignments.map((assignment) => {
        const count = Object.values(assignment.submissions || {}).filter((status) => status === "Submitted").length;
        const total = state.students.filter((student) => student.courseId === assignment.courseId).length;
        return `<article class="assignment-row"><span class="feature-icon">☷</span><div class="assignment-content"><strong>${esc(assignment.title)}</strong><small>${esc(courseName(assignment.courseId))} · ${count}/${total} submitted</small></div><span class="due">Due ${formatDate(assignment.dueDate)}</span><div class="row-actions"><button class="button small" data-action="track-submissions" data-id="${esc(assignment.id)}">Submissions</button><button class="row-action" data-action="edit-assignment" data-id="${esc(assignment.id)}" aria-label="Edit assignment" title="Edit">✎</button><button class="row-action delete" data-action="delete-assignment" data-id="${esc(assignment.id)}" aria-label="Delete assignment" title="Delete">⌫</button></div></article>`;
      }).join("")}</section>` : `<div class="panel empty-state"><strong>No assignments created</strong>Create an assignment and assign it to a course.</div>`}`;
  }

  function announcementMarkup(announcement, includeActions = false) {
    return `<article class="announcement-row"><span class="feature-icon">◉</span><div class="announcement-content"><strong>${esc(announcement.title)}</strong><small>Published ${formatDate(announcement.date)}</small><p>${esc(announcement.message)}</p></div>${includeActions ? `<button class="row-action delete" data-action="delete-announcement" data-id="${esc(announcement.id)}" aria-label="Delete announcement" title="Delete">⌫</button>` : ""}</article>`;
  }
  function renderAnnouncements() {
    const announcements = [...state.announcements].sort((a, b) => b.date.localeCompare(a.date));
    content.innerHTML = `${pageHeader("Announcements", "Share important updates with students and keep your campus informed.", actionButton("New announcement", "add-announcement", true, "+"))}
      ${announcements.length ? `<section class="announcement-list">${announcements.map((announcement) => announcementMarkup(announcement, true)).join("")}</section>` : `<div class="panel empty-state"><strong>No announcements yet</strong>Publish an update for your students.</div>`}`;
  }

  function renderSettings() {
    content.innerHTML = `${pageHeader("Settings", "Manage your local portal preferences and sample data.")}
      <div class="settings-grid"><section class="settings-card"><h2>Institution preferences</h2><p>Customize the name and current academic year shown in your workspace.</p>
        <form data-form="settings"><div class="field-grid"><div class="field full"><label for="setting-institution">Institution name</label><input id="setting-institution" name="institution" required maxlength="80" value="${esc(state.settings.institution)}"></div><div class="field full"><label for="setting-year">Academic year</label><input id="setting-year" name="academicYear" required maxlength="20" value="${esc(state.settings.academicYear)}"></div></div><div style="margin-top:15px">${actionButton("Save preferences", "submit-settings", true)}</div></form>
      </section><section class="settings-card"><h2>Local data</h2><p>All portal data is stored in this browser using local storage.</p><div class="settings-row"><div><strong>Export portal data</strong><small>Download a JSON backup of your records.</small></div><button class="button small" data-action="export-data">Export</button></div><div class="settings-row"><div><strong>Restore sample data</strong><small>Replace local records with the original demo dataset.</small></div><button class="button small danger" data-action="reset-data">Restore</button></div></section></div>`;
  }

  function render() {
    document.getElementById("student-nav-count").textContent = state.students.length;
    switch (activeView) {
      case "students": renderStudents(); break;
      case "courses": renderCourses(); break;
      case "attendance": renderAttendance(); break;
      case "assignments": renderAssignments(); break;
      case "announcements": renderAnnouncements(); break;
      case "settings": renderSettings(); break;
      default: renderDashboard();
    }
  }

  function courseOptions(selected = "") {
    return state.courses.map((course) => `<option value="${esc(course.id)}" ${course.id === selected ? "selected" : ""}>${esc(course.name)}</option>`).join("");
  }
  function openModal(title, subtitle, body, footer, wide = false) {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><h2 id="modal-title">${title}</h2><p>${subtitle}</p></div><button class="icon-button" data-action="close-modal" aria-label="Close dialog">×</button></header><div class="modal-body">${body}</div>${footer ? `<footer class="modal-footer">${footer}</footer>` : ""}</section></div>`;
    modalRoot.querySelector("input:not([type=hidden]), select, textarea")?.focus();
  }
  const cancelButton = `<button class="button" type="button" data-action="close-modal">Cancel</button>`;
  const submitButton = (label) => `<button class="button primary" type="submit">${label}</button>`;

  function nextStudentId() {
    const year = today.getFullYear();
    const highest = state.students.reduce((max, student) => {
      const match = student.id.match(/^EDU-\d{4}-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `EDU-${year}-${String(highest + 1).padStart(3, "0")}`;
  }
  function openStudentForm(student = null) {
    if (!state.courses.length) {
      notify("Add a course before registering a student.", "error");
      return;
    }
    const editing = Boolean(student);
    const form = `<form data-form="student" data-id="${esc(student?.id || "")}">
      <div class="field-grid">
        <div class="field"><label for="student-id">Student ID</label><input id="student-id" value="${esc(student?.id || nextStudentId())}" readonly></div>
        <div class="field"><label for="student-name">Full name *</label><input id="student-name" name="name" required maxlength="100" value="${esc(student?.name || "")}" placeholder="e.g. Aanya Sharma"></div>
        <div class="field"><label for="student-email">Email address *</label><input id="student-email" name="email" type="email" required maxlength="150" value="${esc(student?.email || "")}" placeholder="student@college.edu"></div>
        <div class="field"><label for="student-phone">Phone number</label><input id="student-phone" name="phone" type="tel" maxlength="30" value="${esc(student?.phone || "")}" placeholder="+91 98765 43210"></div>
        <div class="field"><label for="student-gender">Gender</label><select id="student-gender" name="gender"><option value="">Select gender</option>${["Female", "Male", "Non-binary", "Prefer not to say"].map((item) => `<option ${student?.gender === item ? "selected" : ""}>${item}</option>`).join("")}</select></div>
        <div class="field"><label for="student-dob">Date of birth</label><input id="student-dob" name="dob" type="date" value="${esc(student?.dob || "")}"></div>
        <div class="field"><label for="student-course">Course *</label><select id="student-course" name="courseId" required><option value="">Select course</option>${courseOptions(student?.courseId || "")}</select></div>
        <div class="field"><label for="student-department">Department</label><input id="student-department" name="department" maxlength="80" value="${esc(student?.department || getCourse(student?.courseId)?.department || "")}" placeholder="Department"></div>
        <div class="field"><label for="student-enrollment">Enrollment date *</label><input id="student-enrollment" name="enrollmentDate" type="date" required value="${esc(student?.enrollmentDate || isoDate())}"></div>
        <div class="field"><label for="student-year">Academic year</label><input id="student-year" name="academicYear" maxlength="20" value="${esc(student?.academicYear || state.settings.academicYear)}"></div>
        <div class="field"><label for="student-status">Status</label><select id="student-status" name="status"><option ${student?.status !== "Inactive" ? "selected" : ""}>Active</option><option ${student?.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div>
        <div class="field"><label for="student-photo">Profile photo</label><input id="student-photo" name="photo" type="file" accept="image/*"><span class="field-hint">${student?.photo ? "Choose a new image to replace the current photo." : "Optional · maximum file size 2 MB"}</span></div>
        <div class="field full"><label for="student-address">Address</label><textarea id="student-address" name="address" maxlength="300" placeholder="Street address, city">${esc(student?.address || "")}</textarea></div>
      </div>
      <div class="modal-footer" style="margin:18px -22px -19px">${cancelButton}${submitButton(editing ? "Save changes" : "Add student")}</div>
    </form>`;
    openModal(editing ? "Edit student" : "Add a student", editing ? "Update this student's information." : "Enter student details to add them to your directory.", form, "", true);
  }

  function openCourseForm(course = null) {
    const editing = Boolean(course);
    const form = `<form data-form="course" data-id="${esc(course?.id || "")}"><div class="field-grid">
      <div class="field full"><label for="course-name">Course name *</label><input id="course-name" name="name" required maxlength="80" value="${esc(course?.name || "")}" placeholder="e.g. Bachelor of Computer Applications"></div>
      <div class="field full"><label for="course-department">Department</label><input id="course-department" name="department" maxlength="80" value="${esc(course?.department || "")}" placeholder="e.g. Computer Applications"></div>
      <div class="field full"><label for="course-description">Description</label><textarea id="course-description" name="description" maxlength="500" placeholder="What will students learn in this course?">${esc(course?.description || "")}</textarea></div>
    </div><div class="modal-footer" style="margin:18px -22px -19px">${cancelButton}${submitButton(editing ? "Save course" : "Add course")}</div></form>`;
    openModal(editing ? "Edit course" : "Add a course", "Keep your course catalog up to date.", form, "");
  }

  function openAssignmentForm(assignment = null) {
    if (!state.courses.length) {
      notify("Add a course before creating an assignment.", "error");
      return;
    }
    const editing = Boolean(assignment);
    const form = `<form data-form="assignment" data-id="${esc(assignment?.id || "")}"><div class="field-grid">
      <div class="field full"><label for="assignment-title">Assignment title *</label><input id="assignment-title" name="title" required maxlength="120" value="${esc(assignment?.title || "")}" placeholder="e.g. Introduction to databases"></div>
      <div class="field"><label for="assignment-course">Course *</label><select id="assignment-course" name="courseId" required><option value="">Select course</option>${courseOptions(assignment?.courseId || "")}</select></div>
      <div class="field"><label for="assignment-due">Due date *</label><input id="assignment-due" name="dueDate" type="date" required value="${esc(assignment?.dueDate || "")}"></div>
      <div class="field full"><label for="assignment-description">Instructions</label><textarea id="assignment-description" name="description" maxlength="1000" placeholder="Add assignment details and instructions">${esc(assignment?.description || "")}</textarea></div>
    </div><div class="modal-footer" style="margin:18px -22px -19px">${cancelButton}${submitButton(editing ? "Save assignment" : "Create assignment")}</div></form>`;
    openModal(editing ? "Edit assignment" : "Create an assignment", "Assign work to a course and set a deadline.", form, "");
  }

  function openAnnouncementForm() {
    const form = `<form data-form="announcement"><div class="field-grid"><div class="field full"><label for="announcement-title">Announcement title *</label><input id="announcement-title" name="title" required maxlength="120" placeholder="e.g. Midterm examination schedule"></div><div class="field full"><label for="announcement-message">Description *</label><textarea id="announcement-message" name="message" required maxlength="1200" placeholder="Write the announcement for your students"></textarea></div><div class="field"><label for="announcement-date">Announcement date</label><input id="announcement-date" name="date" type="date" value="${isoDate()}"></div></div><div class="modal-footer" style="margin:18px -22px -19px">${cancelButton}${submitButton("Publish announcement")}</div></form>`;
    openModal("New announcement", "Publish a message to the student portal.", form, "");
  }

  function openProfile(student) {
    const course = getCourse(student.courseId);
    const recent = attendanceFor(student.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    const body = `<div class="profile-hero">${avatar(student)}<div><h3>${esc(student.name)}</h3><p>${esc(student.id)} · ${statusBadge(student.status)}</p></div></div>
      <div class="profile-details">
        <div class="detail-item"><small>Email address</small><strong>${esc(student.email)}</strong></div><div class="detail-item"><small>Phone number</small><strong>${esc(student.phone || "Not provided")}</strong></div>
        <div class="detail-item"><small>Course &amp; department</small><strong>${esc(course?.name || "Unassigned")} · ${esc(student.department || course?.department || "—")}</strong></div><div class="detail-item"><small>Enrollment date</small><strong>${formatDate(student.enrollmentDate)}</strong></div>
        <div class="detail-item"><small>Academic year</small><strong>${esc(student.academicYear || "—")}</strong></div><div class="detail-item"><small>Attendance</small><strong>${attendancePercent(student.id)}%</strong></div>
        <div class="detail-item"><small>Date of birth</small><strong>${formatDate(student.dob)}</strong></div><div class="detail-item"><small>Address</small><strong>${esc(student.address || "Not provided")}</strong></div>
      </div><h4 class="profile-section-title">Recent academic activity</h4>
      ${recent.length ? `<table class="data-table"><thead><tr><th>DATE</th><th>ATTENDANCE</th></tr></thead><tbody>${recent.map((entry) => `<tr><td>${formatDate(entry.date)}</td><td>${statusBadge(entry.status)}</td></tr>`).join("")}</tbody></table>` : `<div class="empty-state">No attendance activity recorded for this student yet.</div>`}`;
    openModal("Student profile", "Student overview and recent academic activity.", body, `<button class="button" data-action="close-modal">Close</button><button class="button primary" data-action="edit-student" data-id="${esc(student.id)}">Edit student</button>`, true);
  }

  function openSubmissionTracker(assignment) {
    const courseStudents = state.students.filter((student) => student.courseId === assignment.courseId);
    const rows = courseStudents.map((student) => `<tr><td><div class="student-cell">${avatar(student)}<span>${esc(student.name)}</span></div></td><td><select class="submission-select" data-student="${esc(student.id)}"><option ${!assignment.submissions?.[student.id] || assignment.submissions[student.id] === "Pending" ? "selected" : ""}>Pending</option><option ${assignment.submissions?.[student.id] === "Submitted" ? "selected" : ""}>Submitted</option><option ${assignment.submissions?.[student.id] === "Missing" ? "selected" : ""}>Missing</option></select></td></tr>`).join("");
    const body = courseStudents.length ? `<table class="attendance-marking"><thead><tr><th>STUDENT</th><th>SUBMISSION STATUS</th></tr></thead><tbody>${rows}</tbody></table>` : `<div class="empty-state">There are no students enrolled in ${esc(courseName(assignment.courseId))}.</div>`;
    openModal("Track submissions", `${esc(assignment.title)} · ${esc(courseName(assignment.courseId))}`, body, `${cancelButton}<button class="button primary" data-action="save-submissions" data-id="${esc(assignment.id)}">Save statuses</button>`, true);
  }

  async function photoFromForm(form) {
    const file = form.elements.photo?.files?.[0];
    if (!file) return undefined;
    if (!file.type.startsWith("image/")) throw new Error("Choose a valid image file.");
    if (file.size > 2 * 1024 * 1024) throw new Error("Profile photos must be 2 MB or smaller.");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read the selected photo."));
      reader.readAsDataURL(file);
    });
  }

  async function handleForm(form) {
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const values = Object.fromEntries(data.entries());
    switch (form.dataset.form) {
      case "student": {
        const existing = state.students.find((student) => student.id === form.dataset.id);
        const duplicate = state.students.some((student) => student.email.toLowerCase() === String(values.email).trim().toLowerCase() && student.id !== existing?.id);
        if (duplicate) {
          notify("A student with this email address already exists.", "error");
          return;
        }
        try {
          const photo = await photoFromForm(form);
          const student = {
            ...existing,
            id: existing?.id || nextStudentId(),
            name: String(values.name).trim(),
            email: String(values.email).trim().toLowerCase(),
            phone: String(values.phone || "").trim(),
            gender: values.gender || "",
            dob: values.dob || "",
            address: String(values.address || "").trim(),
            courseId: values.courseId,
            department: String(values.department || "").trim() || getCourse(values.courseId)?.department || "",
            enrollmentDate: values.enrollmentDate,
            academicYear: String(values.academicYear || "").trim(),
            status: values.status,
            photo: photo === undefined ? existing?.photo || "" : photo
          };
          if (existing) {
            state.students = state.students.map((record) => record.id === existing.id ? student : record);
            recordActivity(`${student.name}'s student record was updated`, "student");
          } else {
            state.students.push(student);
            recordActivity(`${student.name} registered for ${courseName(student.courseId)}`, "student");
          }
          persist();
          modalRoot.innerHTML = "";
          render();
          notify(existing ? "Student details updated." : "Student added successfully.");
        } catch (error) {
          notify(error.message || "Could not save the selected photo.", "error");
        }
        break;
      }
      case "course": {
        const existing = state.courses.find((course) => course.id === form.dataset.id);
        const duplicate = state.courses.some((course) => course.name.toLowerCase() === String(values.name).trim().toLowerCase() && course.id !== existing?.id);
        if (duplicate) return notify("A course with this name already exists.", "error");
        const course = { ...existing, id: existing?.id || id("course"), name: String(values.name).trim(), department: String(values.department || "").trim(), description: String(values.description || "").trim() };
        state.courses = existing ? state.courses.map((record) => record.id === existing.id ? course : record) : [...state.courses, course];
        recordActivity(`${course.name} course ${existing ? "was updated" : "was added"}`, "course");
        persist(); modalRoot.innerHTML = ""; render(); notify(existing ? "Course updated." : "Course added.");
        break;
      }
      case "assignment": {
        const existing = state.assignments.find((assignment) => assignment.id === form.dataset.id);
        const assignment = { ...existing, id: existing?.id || id("assignment"), title: String(values.title).trim(), courseId: values.courseId, dueDate: values.dueDate, description: String(values.description || "").trim(), submissions: existing?.submissions || {} };
        state.assignments = existing ? state.assignments.map((record) => record.id === existing.id ? assignment : record) : [...state.assignments, assignment];
        recordActivity(`Assignment "${assignment.title}" ${existing ? "was updated" : "was created"}`, "assignment");
        persist(); modalRoot.innerHTML = ""; render(); notify(existing ? "Assignment updated." : "Assignment created.");
        break;
      }
      case "announcement": {
        const announcement = { id: id("announcement"), title: String(values.title).trim(), message: String(values.message).trim(), date: values.date || isoDate() };
        state.announcements.unshift(announcement);
        recordActivity(`Announcement "${announcement.title}" was published`, "announcement");
        persist(); modalRoot.innerHTML = ""; render(); notify("Announcement published.");
        break;
      }
      case "settings":
        state.settings = { institution: String(values.institution).trim(), academicYear: String(values.academicYear).trim() };
        recordActivity("Portal preferences were updated", "settings");
        persist(); render(); notify("Preferences saved.");
        break;
    }
  }

  function deleteStudent(studentId) {
    const student = state.students.find((record) => record.id === studentId);
    if (!student || !window.confirm(`Delete ${student.name}'s student record? This cannot be undone.`)) return;
    state.students = state.students.filter((record) => record.id !== studentId);
    state.attendance = state.attendance.filter((entry) => entry.studentId !== studentId);
    state.assignments.forEach((assignment) => { delete assignment.submissions?.[studentId]; });
    recordActivity(`${student.name}'s student record was deleted`, "student");
    persist(); render(); notify("Student record deleted.");
  }
  function deleteCourse(courseId) {
    const course = getCourse(courseId);
    if (!course) return;
    if (state.students.some((student) => student.courseId === courseId)) {
      notify("Reassign or remove enrolled students before deleting this course.", "error");
      return;
    }
    if (!window.confirm(`Delete the ${course.name} course?`)) return;
    state.courses = state.courses.filter((record) => record.id !== courseId);
    state.assignments = state.assignments.filter((assignment) => assignment.courseId !== courseId);
    recordActivity(`${course.name} course was deleted`, "course");
    persist(); render(); notify("Course deleted.");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mevi-student-portal-backup-${isoDate()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Portal backup downloaded.");
  }

  content.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      event.preventDefault();
      nav(viewButton.dataset.view);
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const itemId = button.dataset.id;
    switch (action) {
      case "add-student": openStudentForm(); break;
      case "edit-student": {
        const student = state.students.find((record) => record.id === itemId);
        if (student) openStudentForm(student);
        break;
      }
      case "profile": {
        const student = state.students.find((record) => record.id === itemId);
        if (student) openProfile(student);
        break;
      }
      case "delete-student": deleteStudent(itemId); break;
      case "add-course": openCourseForm(); break;
      case "edit-course": {
        const course = getCourse(itemId);
        if (course) openCourseForm(course);
        break;
      }
      case "delete-course": deleteCourse(itemId); break;
      case "add-assignment": openAssignmentForm(); break;
      case "edit-assignment": {
        const assignment = state.assignments.find((record) => record.id === itemId);
        if (assignment) openAssignmentForm(assignment);
        break;
      }
      case "delete-assignment": {
        const assignment = state.assignments.find((record) => record.id === itemId);
        if (assignment && window.confirm(`Delete the "${assignment.title}" assignment?`)) {
          state.assignments = state.assignments.filter((record) => record.id !== itemId);
          recordActivity(`Assignment "${assignment.title}" was deleted`, "assignment");
          persist(); render(); notify("Assignment deleted.");
        }
        break;
      }
      case "track-submissions": {
        const assignment = state.assignments.find((record) => record.id === itemId);
        if (assignment) openSubmissionTracker(assignment);
        break;
      }
      case "add-announcement": openAnnouncementForm(); break;
      case "delete-announcement": {
        const announcement = state.announcements.find((record) => record.id === itemId);
        if (announcement && window.confirm(`Delete "${announcement.title}"?`)) {
          state.announcements = state.announcements.filter((record) => record.id !== itemId);
          recordActivity(`Announcement "${announcement.title}" was deleted`, "announcement");
          persist(); render(); notify("Announcement deleted.");
        }
        break;
      }
      case "save-attendance": {
        const selects = [...content.querySelectorAll(".attendance-select")];
        const date = content.querySelector("#attendance-date")?.value;
        if (!date) return notify("Choose an attendance date first.", "error");
        state.attendance = state.attendance.filter((entry) => entry.date !== date);
        selects.forEach((select) => state.attendance.push({ id: id("att"), studentId: select.dataset.student, date, status: select.value }));
        selectedAttendanceDate = date;
        recordActivity(`Attendance was updated for ${selects.length} students`, "attendance");
        persist(); render(); notify("Attendance saved.");
        break;
      }
      case "save-submissions": {
        const assignment = state.assignments.find((record) => record.id === itemId);
        if (!assignment) return;
        assignment.submissions ||= {};
        modalRoot.querySelectorAll(".submission-select").forEach((select) => { assignment.submissions[select.dataset.student] = select.value; });
        recordActivity(`Submissions updated for "${assignment.title}"`, "assignment");
        persist(); modalRoot.innerHTML = ""; render(); notify("Submission statuses saved.");
        break;
      }
      case "close-modal":
        if (event.target === button || button === event.target.closest(".modal-backdrop")) modalRoot.innerHTML = "";
        break;
      case "export-data": exportData(); break;
      case "reset-data":
        if (window.confirm("Restore the original sample records? Your current local portal data will be replaced.")) {
          state = sampleState();
          persist(); render(); notify("Sample data restored.");
        }
        break;
      case "submit-settings":
        button.closest("form")?.requestSubmit();
        break;
    }
  });

  content.addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    void handleForm(form);
  });
  content.addEventListener("input", (event) => {
    if (event.target.id !== "student-search") return;
    studentQuery = event.target.value;
    const cursor = event.target.selectionStart;
    renderStudents();
    const input = content.querySelector("#student-search");
    input?.focus();
    input?.setSelectionRange(cursor, cursor);
  });
  content.addEventListener("change", (event) => {
    if (event.target.id === "student-course-filter") studentCourseFilter = event.target.value;
    else if (event.target.id === "student-status-filter") studentStatusFilter = event.target.value;
    else if (event.target.id === "attendance-date") selectedAttendanceDate = event.target.value || isoDate();
    else return;
    render();
  });
  modalRoot.addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    void handleForm(form);
  });
  modalRoot.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal-backdrop") || event.target.closest('button[data-action="close-modal"]')) modalRoot.innerHTML = "";
    const edit = event.target.closest('[data-action="edit-student"]');
    if (edit) {
      const student = state.students.find((record) => record.id === edit.dataset.id);
      if (student) openStudentForm(student);
    }
    const saveSubmissions = event.target.closest('[data-action="save-submissions"]');
    if (saveSubmissions) {
      const assignment = state.assignments.find((record) => record.id === saveSubmissions.dataset.id);
      if (!assignment) return;
      assignment.submissions ||= {};
      modalRoot.querySelectorAll(".submission-select").forEach((select) => { assignment.submissions[select.dataset.student] = select.value; });
      recordActivity(`Submissions updated for "${assignment.title}"`, "assignment");
      persist(); modalRoot.innerHTML = ""; render(); notify("Submission statuses saved.");
    }
  });

  document.querySelectorAll(".nav-link[data-view], .brand[data-view], .notification-button[data-view]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      nav(button.dataset.view);
    });
  });
  document.getElementById("menu-button").addEventListener("click", () => {
    sidebarOpen = !sidebarOpen;
    document.getElementById("sidebar").classList.toggle("open", sidebarOpen);
    document.querySelector(".mobile-overlay")?.classList.toggle("show", sidebarOpen);
  });
  document.getElementById("logout-button").addEventListener("click", () => {
    notify("This local demo has no sign-in session to end.", "error");
  });
  applyTheme(document.documentElement.dataset.theme || localStorage.getItem(THEME_KEY) || "light");
  themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
  });
  document.getElementById("today-label").textContent = today.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const overlay = document.createElement("div");
  overlay.className = "mobile-overlay";
  overlay.addEventListener("click", closeSidebar);
  document.body.append(overlay);
  if (!localStorage.getItem(STORAGE_KEY)) persist();
  render();
})();

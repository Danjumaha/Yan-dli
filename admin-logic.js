import { db, doc, setDoc, collection, addDoc, deleteDoc, updateDoc, onSnapshot } from "./firebase-config.js";

const ADMIN_PASSWORD = '@Admin123';
const CLOUD_NAME = 'dytzpxabq';
const UPLOAD_PRESET = 'yandli';

let allDepartments = [], allLevels = [], allCourses = [], allTopics = [], allQuestions = [];
let parsedCSVData = [];

// Dynamic Stacking Three Dots Menu Handler with Dropup Position Check
window.toggleActionMenu = function(e, menuId) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const currentMenu = document.getElementById(menuId);
    const isCurrentlyActive = currentMenu ? currentMenu.classList.contains('active') : false;
    
    closeAllActionMenus();
    
    if (currentMenu && !isCurrentlyActive) {
        const rect = btn.getBoundingClientRect();
        const appContent = document.querySelector('.app-content');
        const contentRect = appContent ? appContent.getBoundingClientRect() : { bottom: window.innerHeight };
        
        if (rect.bottom > contentRect.bottom - 180) {
            currentMenu.classList.add('dropup');
        } else {
            currentMenu.classList.remove('dropup');
        }

        currentMenu.classList.add('active');
        const parentCard = currentMenu.closest('.item-card');
        if (parentCard) {
            parentCard.classList.add('has-open-menu');
        }
    }
};

window.closeAllActionMenus = function() {
    document.querySelectorAll('.dots-dropdown-menu').forEach(menu => {
        menu.classList.remove('active');
    });
    document.querySelectorAll('.item-card.has-open-menu').forEach(card => {
        card.classList.remove('has-open-menu');
    });
};

// Initialize Cloudinary Upload Widget
let cloudinaryWidget = null;
function initCloudinaryWidget() {
    if (window.cloudinary && !cloudinaryWidget) {
        cloudinaryWidget = cloudinary.createUploadWidget({
            cloudName: CLOUD_NAME,
            uploadPreset: UPLOAD_PRESET,
            sources: ['local', 'url', 'camera'],
            multiple: false,
            cropping: false,
            folder: 'yandli_questions'
        }, (error, result) => {
            if (!error && result && result.event === "success") {
                const secureUrl = result.info.secure_url;
                document.getElementById('q-image-url').value = secureUrl;
                
                const previewTag = document.getElementById('image-preview-tag');
                const previewWrapper = document.getElementById('image-preview-wrapper');
                const dropzoneLabel = document.getElementById('image-dropzone-label');
                
                previewTag.src = secureUrl;
                previewTag.style.display = 'block';
                previewWrapper.style.display = 'block';
                dropzoneLabel.textContent = 'Image Uploaded Successfully';
            }
        });
    }
}

window.openCloudinaryUploader = function() {
    initCloudinaryWidget();
    if (cloudinaryWidget) {
        cloudinaryWidget.open();
    } else {
        alert('❌ Cloudinary widget script failed to load. Check your internet connection.');
    }
};

window.clearUploadedImage = function(e) {
    e.stopPropagation();
    document.getElementById('q-image-url').value = '';
    document.getElementById('image-preview-tag').src = '';
    document.getElementById('image-preview-wrapper').style.display = 'none';
    document.getElementById('image-dropzone-label').textContent = 'Click to upload image';
};

function renderHtmlContent(htmlString) {
    if (!htmlString) return '';
    return htmlString;
}

window.toggleSidebar = function(open) {
    const overlay = document.getElementById('sidebar-overlay');
    if (open) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
};

window.navigateToSection = function(sectionName) {
    toggleSidebar(false);
    showSection(sectionName);
};

window.adminLogin = function() {
    if (document.getElementById('admin-password').value === ADMIN_PASSWORD) {                
        document.getElementById('admin-login').style.display = 'none';
        initRealtimeListeners();
    } else {
        alert('❌ Incorrect Access Key!');
    }
};

window.adminLogout = function() {
    if (!confirm('Exit mobile session?')) return;
    toggleSidebar(false);
    document.getElementById('admin-login').style.display = 'flex';
    document.getElementById('admin-password').value = '';
};

window.showSection = function(sectionName, tabElement = null) {
    document.querySelectorAll('.section-page').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionName}`)?.classList.add('active');

    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    if (tabElement) {
        tabElement.classList.add('active');
    } else {
        document.getElementById(`tab-${sectionName}`)?.classList.add('active');
    }

    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick')?.includes(`'${sectionName}'`)) {
            link.classList.add('active');
        }
    });

    const titles = { 
        dashboard: 'Overview', 
        departments: 'Departments',
        levels: 'Academic Levels',
        courses: 'Course Catalog',
        topics: 'Topic Registry', 
        questions: 'Question Bank',
        'csv-import': 'Bulk CSV Upload'
    };
    document.getElementById('page-title').textContent = titles[sectionName] || 'Yan-Dli Suite';
};

function initRealtimeListeners() {
    onSnapshot(collection(db, "departments"), (snapshot) => {
        allDepartments = [];
        snapshot.forEach(d => allDepartments.push({ id: d.id, ...d.data() }));
        updateDropdowns();
        renderDepartments();
        updateMetrics();
    });

    onSnapshot(collection(db, "levels"), (snapshot) => {
        allLevels = [];
        snapshot.forEach(d => allLevels.push({ id: d.id, ...d.data() }));
        allLevels.sort((a, b) => (parseInt(a.code) || 0) - (parseInt(b.code) || 0));
        updateDropdowns();
        renderLevels();
        updateMetrics();
    });

    onSnapshot(collection(db, "courses"), (snapshot) => {
        allCourses = [];
        snapshot.forEach(d => allCourses.push({ id: d.id, ...d.data() }));
        renderCourses();
        updateMetrics();
    });

    onSnapshot(collection(db, "topics"), (snapshot) => {
        allTopics = [];
        snapshot.forEach(d => allTopics.push({ id: d.id, ...d.data() }));
        renderTopics();
        updateMetrics();
    });

    onSnapshot(collection(db, "questions"), (snapshot) => {
        allQuestions = [];
        snapshot.forEach(d => allQuestions.push({ id: d.id, ...d.data() }));
        renderQuestions();
        updateMetrics();
    });
}

function updateMetrics() {
    document.getElementById('stat-departments').textContent = allDepartments.filter(d => !d.archived).length;
    document.getElementById('stat-levels').textContent = allLevels.filter(l => !l.archived).length;
    document.getElementById('stat-courses').textContent = allCourses.filter(c => !c.archived).length;
    document.getElementById('stat-questions').textContent = allQuestions.filter(q => !q.archived).length;
}

function updateDropdowns() {
    ['course-dept-select', 'topic-dept-select', 'q-dept-select', 'csv-dept-select', 'filter-course-dept', 'filter-topic-dept', 'filter-q-dept'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const currentVal = sel.value;
        const isFilter = id.startsWith('filter-');
        sel.innerHTML = `<option value="">${isFilter ? 'All Depts' : 'Select Department'}</option>`;
        allDepartments.filter(d => !d.archived).forEach(d => {
            sel.innerHTML += `<option value="${d.id}">${d.name}</option>`;
        });
        sel.value = currentVal;
    });

    ['course-level-select', 'topic-level-select', 'q-level-select', 'csv-level-select', 'filter-course-level', 'filter-topic-level', 'filter-q-level'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const currentVal = sel.value;
        const isFilter = id.startsWith('filter-');
        sel.innerHTML = `<option value="">${isFilter ? 'All Levels' : 'Select Level'}</option>`;
        allLevels.filter(l => !l.archived).forEach(l => {
            sel.innerHTML += `<option value="${l.id}">${l.name}</option>`;
        });
        sel.value = currentVal;
    });
}

window.filterTopicCascading = function() {
    const deptId = document.getElementById('topic-dept-select').value;
    const levelId = document.getElementById('topic-level-select').value;
    const courseSel = document.getElementById('topic-course-select');
    courseSel.innerHTML = '<option value="">Select Course</option>';
    let filtered = allCourses.filter(c => !c.archived);
    if (deptId) filtered = filtered.filter(c => c.departmentId === deptId);
    if (levelId) filtered = filtered.filter(c => c.levelId === levelId);
    filtered.forEach(c => courseSel.innerHTML += `<option value="${c.id}">${c.code} - ${c.title}</option>`);
};

window.filterQuestionCascading = function() {
    const deptId = document.getElementById('q-dept-select').value;
    const levelId = document.getElementById('q-level-select').value;
    const courseSel = document.getElementById('q-course-select');
    courseSel.innerHTML = '<option value="">Select Course</option>';
    let filtered = allCourses.filter(c => !c.archived);
    if (deptId) filtered = filtered.filter(c => c.departmentId === deptId);
    if (levelId) filtered = filtered.filter(c => c.levelId === levelId);
    filtered.forEach(c => courseSel.innerHTML += `<option value="${c.id}">${c.code} - ${c.title}</option>`);
    filterQuestionTopics();
};

window.filterQuestionTopics = function() {
    const courseId = document.getElementById('q-course-select').value;
    const topicSel = document.getElementById('q-topic-select');
    topicSel.innerHTML = '<option value="">Select Topic</option>';
    if(!courseId) return;
    allTopics.filter(t => t.courseId === courseId && !t.archived).forEach(t => {
        topicSel.innerHTML += `<option value="${t.id}">${t.name}</option>`;
    });
};

window.filterCsvCascading = function() {
    const deptId = document.getElementById('csv-dept-select').value;
    const levelId = document.getElementById('csv-level-select').value;
    const courseSel = document.getElementById('csv-course-select');
    courseSel.innerHTML = '<option value="">Select Course</option>';
    let filtered = allCourses.filter(c => !c.archived);
    if (deptId) filtered = filtered.filter(c => c.departmentId === deptId);
    if (levelId) filtered = filtered.filter(c => c.levelId === levelId);
    filtered.forEach(c => courseSel.innerHTML += `<option value="${c.id}">${c.code} - ${c.title}</option>`);
    filterCsvTopics();
};

window.filterCsvTopics = function() {
    const courseId = document.getElementById('csv-course-select').value;
    const topicSel = document.getElementById('csv-topic-select');
    topicSel.innerHTML = '<option value="">Select Topic (Optional)</option>';
    if(!courseId) return;
    allTopics.filter(t => t.courseId === courseId && !t.archived).forEach(t => {
        topicSel.innerHTML += `<option value="${t.id}">${t.name}</option>`;
    });
};

window.updateTopicFilterCascading = function() {
    const deptId = document.getElementById('filter-topic-dept').value;
    const levelId = document.getElementById('filter-topic-level').value;
    const courseSel = document.getElementById('filter-topic-course');
    courseSel.innerHTML = '<option value="">All Courses</option>';
    
    let filtered = allCourses.filter(c => !c.archived);
    if (deptId) filtered = filtered.filter(c => c.departmentId === deptId);
    if (levelId) filtered = filtered.filter(c => c.levelId === levelId);
    filtered.forEach(c => courseSel.innerHTML += `<option value="${c.id}">${c.code} - ${c.title}</option>`);
    
    renderTopics();
};

window.updateQFilterCascading = function() {
    const deptId = document.getElementById('filter-q-dept').value;
    const levelId = document.getElementById('filter-q-level').value;
    const courseSel = document.getElementById('filter-q-course');
    courseSel.innerHTML = '<option value="">All Courses</option>';

    let filtered = allCourses.filter(c => !c.archived);
    if (deptId) filtered = filtered.filter(c => c.departmentId === deptId);
    if (levelId) filtered = filtered.filter(c => c.levelId === levelId);
    filtered.forEach(c => courseSel.innerHTML += `<option value="${c.id}">${c.code} - ${c.title}</option>`);
    
    updateQFilterTopics();
};

window.updateQFilterTopics = function() {
    const courseId = document.getElementById('filter-q-course').value;
    const topicSel = document.getElementById('filter-q-topic');
    topicSel.innerHTML = '<option value="">All Topics</option>';

    if (courseId) {
        allTopics.filter(t => t.courseId === courseId && !t.archived).forEach(t => {
            topicSel.innerHTML += `<option value="${t.id}">${t.name}</option>`;
        });
    }
    renderQuestions();
};

// RENDER DEPARTMENTS WITH THREE DOTS MENU
window.renderDepartments = function() {
    const query = (document.getElementById('filter-dept-search')?.value || '').toLowerCase();
    const container = document.getElementById('departments-list');
    const filtered = allDepartments.filter(d => 
        (d.name || '').toLowerCase().includes(query) || (d.faculty || '').toLowerCase().includes(query)
    );
    
    container.innerHTML = filtered.map(d => `
        <div class="item-card ${d.archived ? 'archived' : ''}">
            <div class="item-header">
                <div class="item-title">${d.name}</div>
                <div class="item-header-right">
                    <span class="badge-chip ${d.archived ? 'badge-archived' : 'badge-active'}">${d.archived ? 'Archived' : 'Active'}</span>
                    <button class="three-dots-btn" onclick="toggleActionMenu(event, 'menu-dept-${d.id}')">
                        <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </button>
                    <div class="dots-dropdown-menu" id="menu-dept-${d.id}">
                        <div class="menu-action-item" onclick="editDepartment('${d.id}')">
                            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
                        </div>
                        <div class="menu-action-item" onclick="toggleArchive('departments', '${d.id}', ${!!d.archived})">
                            <svg viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> ${d.archived ? 'Unarchive' : 'Archive'}
                        </div>
                        <div class="menu-action-item danger-item" onclick="deleteItem('departments', '${d.id}')">
                            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Delete
                        </div>
                    </div>
                </div>
            </div>
            <div class="item-sub">Faculty: ${d.faculty}</div>
        </div>
    `).join('');
};

// RENDER LEVELS WITH THREE DOTS MENU
window.renderLevels = function() {
    const query = (document.getElementById('filter-level-search')?.value || '').toLowerCase();
    const container = document.getElementById('levels-list');
    const filtered = allLevels.filter(l => 
        (l.name || '').toLowerCase().includes(query) || (l.code || '').toString().includes(query)
    );

    container.innerHTML = filtered.map(l => `
        <div class="item-card ${l.archived ? 'archived' : ''}">
            <div class="item-header">
                <div class="item-title">${l.name}</div>
                <div class="item-header-right">
                    <span class="badge-chip ${l.archived ? 'badge-archived' : 'badge-active'}">${l.archived ? 'Archived' : 'Active'}</span>
                    <button class="three-dots-btn" onclick="toggleActionMenu(event, 'menu-level-${l.id}')">
                        <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </button>
                    <div class="dots-dropdown-menu" id="menu-level-${l.id}">
                        <div class="menu-action-item" onclick="editLevel('${l.id}')">
                            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
                        </div>
                        <div class="menu-action-item" onclick="toggleArchive('levels', '${l.id}', ${!!l.archived})">
                            <svg viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> ${l.archived ? 'Unarchive' : 'Archive'}
                        </div>
                        <div class="menu-action-item danger-item" onclick="deleteItem('levels', '${l.id}')">
                            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Delete
                        </div>
                    </div>
                </div>
            </div>
            <div class="item-sub">Order Code: ${l.code}</div>
        </div>
    `).join('');
};

// RENDER COURSES WITH THREE DOTS MENU
window.renderCourses = function() {
    const query = (document.getElementById('filter-course-search')?.value || '').toLowerCase();
    const deptId = document.getElementById('filter-course-dept')?.value || '';
    const levelId = document.getElementById('filter-course-level')?.value || '';
    const container = document.getElementById('courses-list');

    let filtered = allCourses.filter(c => 
        (c.title || '').toLowerCase().includes(query) || (c.code || '').toLowerCase().includes(query)
    );

    if (deptId) filtered = filtered.filter(c => c.departmentId === deptId);
    if (levelId) filtered = filtered.filter(c => c.levelId === levelId);

    container.innerHTML = filtered.map(c => `
        <div class="item-card ${c.archived ? 'archived' : ''}">
            <div class="item-header">
                <div class="item-title">[${c.code}] ${c.title}</div>
                <div class="item-header-right">
                    <span class="badge-chip ${c.archived ? 'badge-archived' : 'badge-active'}">${c.archived ? 'Archived' : 'Active'}</span>
                    <button class="three-dots-btn" onclick="toggleActionMenu(event, 'menu-course-${c.id}')">
                        <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </button>
                    <div class="dots-dropdown-menu" id="menu-course-${c.id}">
                        <div class="menu-action-item" onclick="editCourse('${c.id}')">
                            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
                        </div>
                        <div class="menu-action-item" onclick="toggleArchive('courses', '${c.id}', ${!!c.archived})">
                            <svg viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> ${c.archived ? 'Unarchive' : 'Archive'}
                        </div>
                        <div class="menu-action-item danger-item" onclick="deleteItem('courses', '${c.id}')">
                            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Delete
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
};

// RENDER TOPICS WITH THREE DOTS MENU
window.renderTopics = function() {
    const query = (document.getElementById('filter-topic-search')?.value || '').toLowerCase();
    const courseId = document.getElementById('filter-topic-course')?.value || '';
    const deptId = document.getElementById('filter-topic-dept')?.value || '';
    const levelId = document.getElementById('filter-topic-level')?.value || '';
    const container = document.getElementById('topics-list');

    let filtered = allTopics.filter(t => (t.name || '').toLowerCase().includes(query));

    if (courseId) {
        filtered = filtered.filter(t => t.courseId === courseId);
    } else if (deptId || levelId) {
        let matchingCourseIds = allCourses.filter(c => {
            let match = true;
            if (deptId && c.departmentId !== deptId) match = false;
            if (levelId && c.levelId !== levelId) match = false;
            return match;
        }).map(c => c.id);
        filtered = filtered.filter(t => matchingCourseIds.includes(t.courseId));
    }

    container.innerHTML = filtered.map(t => {
        const parentCourse = allCourses.find(c => c.id === t.courseId);
        return `
            <div class="item-card ${t.archived ? 'archived' : ''}">
                <div class="item-header">
                    <div class="item-title">${t.name}</div>
                    <div class="item-header-right">
                        <span class="badge-chip ${t.archived ? 'badge-archived' : 'badge-active'}">${t.archived ? 'Archived' : 'Active'}</span>
                        <button class="three-dots-btn" onclick="toggleActionMenu(event, 'menu-topic-${t.id}')">
                            <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                        </button>
                        <div class="dots-dropdown-menu" id="menu-topic-${t.id}">
                            <div class="menu-action-item" onclick="editTopic('${t.id}')">
                                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
                            </div>
                            <div class="menu-action-item" onclick="toggleArchive('topics', '${t.id}', ${!!t.archived})">
                                <svg viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> ${t.archived ? 'Unarchive' : 'Archive'}
                            </div>
                            <div class="menu-action-item danger-item" onclick="deleteItem('topics', '${t.id}')">
                                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Delete
                            </div>
                        </div>
                    </div>
                </div>
                ${parentCourse ? `<div class="item-sub">Course: ${parentCourse.code} -${parentCourse.title}</div>` : ''}
            </div>
        `;
    }).join('');
};

// RENDER QUESTIONS WITH THREE DOTS MENU
window.renderQuestions = function() {
    const query = (document.getElementById('filter-q-search')?.value || '').toLowerCase();
    const deptId = document.getElementById('filter-q-dept')?.value || '';
    const levelId = document.getElementById('filter-q-level')?.value || '';
    const courseId = document.getElementById('filter-q-course')?.value || '';
    const topicId = document.getElementById('filter-q-topic')?.value || '';
    const container = document.getElementById('questions-list');

    let filtered = allQuestions.filter(q => (q.q || '').toLowerCase().includes(query));

    if (topicId) {
        filtered = filtered.filter(q => q.topicId === topicId);
    } else if (courseId) {
        filtered = filtered.filter(q => q.courseId === courseId);
    } else if (deptId || levelId) {
        if (deptId) filtered = filtered.filter(q => q.departmentId === deptId);
        if (levelId) filtered = filtered.filter(q => q.levelId === levelId);
    }

    container.innerHTML = filtered.map(q => `
        <div class="item-card ${q.archived ? 'archived' : ''}">
            <div class="item-header">
                <div class="item-title">Question</div>
                <div class="item-header-right">
                    <span class="badge-chip ${q.archived ? 'badge-archived' : 'badge-active'}">${q.archived ? 'Archived' : 'Active'}</span>
                    <button class="three-dots-btn" onclick="toggleActionMenu(event, 'menu-q-${q.id}')">
                        <svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </button>
                    <div class="dots-dropdown-menu" id="menu-q-${q.id}">
                        <div class="menu-action-item" onclick="editQuestion('${q.id}')">
                            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
                        </div>
                        <div class="menu-action-item" onclick="toggleArchive('questions', '${q.id}', ${!!q.archived})">
                            <svg viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> ${q.archived ? 'Unarchive' : 'Archive'}
                        </div>
                        <div class="menu-action-item danger-item" onclick="deleteItem('questions', '${q.id}')">
                            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Delete
                        </div>
                    </div>
                </div>
            </div>
            <div class="plain-text-preview">${renderHtmlContent(q.q)}</div>
            ${q.imageUrl ? `<div style="margin-top:6px;"><img src="${q.imageUrl}" style="max-height:90px; border-radius:8px; object-fit:contain;" alt="Diagram" onerror="this.style.display='none'"></div>` : ''}
            <div class="item-sub">Key Answer: Option ${['A','B','C','D'][q.answer] || 'A'}</div>
        </div>
    `).join('');
};

// BULK CSV UPLOAD ENGINE
window.downloadSampleCSV = function() {
    const sample = `question,option_a,option_b,option_c,option_d,answer,explanation,image_url\n"What is the capital of <b>Nigeria</b>?","Lagos","Abuja","Kano","Ibadan","B","Abuja is the federal capital territory.",""\n"Which data structure follows <i>LIFO</i>?","Queue","Stack","Array","Tree","B","Stack is Last-In-First-Out.",""`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yan_dli_questions_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
};

window.handleCSVFileSelect = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('csv-file-label').textContent = file.name;

    const reader = new FileReader();
    reader.onload = function(evt) {
        parseCSVText(evt.target.result);
    };
    reader.readAsText(file);
};

function parseCSVText(csvText) {
    const lines = csvText.split(/\r\n|\n/);
    parsedCSVData = [];

    if (lines.length < 2) {
        alert('❌ Invalid CSV file format or empty file.');
        return;
    }

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].trim();
        if (!row) continue;

        const cols = row.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.replace(/^["']\vert{}["']$/g, '').trim());

        if (cols.length >= 6) {
            let ansKey = 0;
            const keyStr = (cols[5] || '').toUpperCase();
            if (keyStr === 'B' || keyStr === '1') ansKey = 1;
            else if (keyStr === 'C' || keyStr === '2') ansKey = 2;
            else if (keyStr === 'D' || keyStr === '3') ansKey = 3;

            parsedCSVData.push({
                q: cols[0] || '',
                optA: cols[1] || '',
                optB: cols[2] || '',
                optC: cols[3] || '',
                optD: cols[4] || '',
                answer: ansKey,
                exp: cols[6] || '',
                imageUrl: cols[7] || ''
            });
        }
    }

    if (parsedCSVData.length === 0) {
        alert('❌ No valid question rows parsed from CSV.');
        document.getElementById('csv-preview-area').style.display = 'none';
        return;
    }

    document.getElementById('csv-count-badge').textContent = `Parsed ${parsedCSVData.length} Questions`;
    document.getElementById('csv-preview-body').innerHTML = parsedCSVData.slice(0, 50).map((row, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>${renderHtmlContent(row.q)}</td>
            <td>${row.optA}</td>
            <td>${row.optB}</td>
            <td><strong>${['A','B','C','D'][row.answer]}</strong></td>
        </tr>
    `).join('');

    document.getElementById('csv-preview-area').style.display = 'block';
}

window.processBulkCSVUpload = async function() {
    const deptId = document.getElementById('csv-dept-select').value;
    const levelId = document.getElementById('csv-level-select').value;
    const courseId = document.getElementById('csv-course-select').value;
    const topicId = document.getElementById('csv-topic-select').value;

    if (!deptId || !levelId || !courseId) {
        return alert('❌ Please select Target Department, Level, and Course before uploading.');
    }

    if (parsedCSVData.length === 0) {
        return alert('❌ No CSV data loaded.');
    }

    const btn = document.getElementById('csv-upload-btn');
    btn.disabled = true;
    btn.textContent = `Uploading 0 / ${parsedCSVData.length}...`;

    try {
        let count = 0;
        for (const item of parsedCSVData) {
            await addDoc(collection(db, "questions"), {
                departmentId: deptId,
                levelId: levelId,
                courseId: courseId,
                topicId: topicId || '',
                q: item.q,
                imageUrl: item.imageUrl,
                options: [item.optA, item.optB, item.optC, item.optD],
                answer: item.answer,
                exp: item.exp,
                archived: false,
                createdAt: new Date()
            });
            count++;
            if (count % 10 === 0 || count === parsedCSVData.length) {
                btn.textContent = `Uploading ${count} / ${parsedCSVData.length}...`;
            }
        }

        alert(`🎉 Successfully uploaded ${parsedCSVData.length} questions to database!`);
        document.getElementById('csv-file-input').value = '';
        document.getElementById('csv-file-label').textContent = 'Tap to select CSV file';
        document.getElementById('csv-preview-area').style.display = 'none';
        parsedCSVData = [];
        showSection('questions');
    } catch (err) {
        console.error(err);
        alert('❌ Error uploading batch: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Upload Batch to Database';
    }
};

// CRUD ACTIONS
window.saveDepartment = async function() {
    const name = document.getElementById('dept-name').value.trim();
    const faculty = document.getElementById('dept-faculty').value.trim();
    const editId = document.getElementById('edit-dept-id').value;
    if(!name || !faculty) return alert('Please complete required fields');
    if(editId) {
        await updateDoc(doc(db, "departments", editId), { name, faculty });
    } else {
        await addDoc(collection(db, "departments"), { name, faculty, archived: false, createdAt: new Date() });
    }
    resetDepartmentForm();
};

window.editDepartment = function(id) {
    closeAllActionMenus();
    const item = allDepartments.find(d => d.id === id);
    if(!item) return;
    document.getElementById('edit-dept-id').value = item.id;
    document.getElementById('dept-name').value = item.name;
    document.getElementById('dept-faculty').value = item.faculty;
    document.getElementById('cancel-dept-btn').style.display = 'inline-flex';
};

window.resetDepartmentForm = function() {
    document.getElementById('edit-dept-id').value = '';
    document.getElementById('dept-name').value = '';
    document.getElementById('dept-faculty').value = '';
    document.getElementById('cancel-dept-btn').style.display = 'none';
};

window.saveLevel = async function() {
    const name = document.getElementById('level-name').value.trim();
    const code = document.getElementById('level-code').value.trim();
    const editId = document.getElementById('edit-level-id').value;
    if(!name || !code) return alert('Please complete required fields');
    if(editId) {
        await updateDoc(doc(db, "levels", editId), { name, code });
    } else {
        await addDoc(collection(db, "levels"), { name, code, archived: false, createdAt: new Date() });
    }
    resetLevelForm();
};

window.editLevel = function(id) {
    closeAllActionMenus();
    const item = allLevels.find(l => l.id === id);
    if(!item) return;
    document.getElementById('edit-level-id').value = item.id;
    document.getElementById('level-name').value = item.name;
    document.getElementById('level-code').value = item.code;
    document.getElementById('cancel-level-btn').style.display = 'inline-flex';
};

window.resetLevelForm = function() {
    document.getElementById('edit-level-id').value = '';
    document.getElementById('level-name').value = '';
    document.getElementById('level-code').value = '';
    document.getElementById('cancel-level-btn').style.display = 'none';
};

window.saveCourse = async function() {
    const deptId = document.getElementById('course-dept-select').value;
    const levelId = document.getElementById('course-level-select').value;
    const title = document.getElementById('course-title').value.trim();
    const code = document.getElementById('course-code').value.trim();
    const editId = document.getElementById('edit-course-id').value;
    if(!deptId || !levelId || !title || !code) return alert('Please complete required fields');
    if(editId) {
        await updateDoc(doc(db, "courses", editId), { departmentId: deptId, levelId, title, code });
    } else {
        await addDoc(collection(db, "courses"), { departmentId: deptId, levelId, title, code, archived: false, createdAt: new Date() });
    }
    resetCourseForm();
};

window.editCourse = function(id) {
    closeAllActionMenus();
    const item = allCourses.find(c => c.id === id);
    if(!item) return;
    document.getElementById('edit-course-id').value = item.id;
    document.getElementById('course-dept-select').value = item.departmentId || '';
    document.getElementById('course-level-select').value = item.levelId || '';
    document.getElementById('course-title').value = item.title;
    document.getElementById('course-code').value = item.code;
    document.getElementById('cancel-course-btn').style.display = 'inline-flex';
};

window.resetCourseForm = function() {
    document.getElementById('edit-course-id').value = '';
    document.getElementById('course-dept-select').value = '';
    document.getElementById('course-level-select').value = '';
    document.getElementById('course-title').value = '';
    document.getElementById('course-code').value = '';
    document.getElementById('cancel-course-btn').style.display = 'none';
};

window.saveTopic = async function() {
    const courseId = document.getElementById('topic-course-select').value;
    const name = document.getElementById('topic-name').value.trim();
    const editId = document.getElementById('edit-topic-id').value;
    if(!courseId || !name) return alert('Please select course and topic name');
    if(editId) {
        await updateDoc(doc(db, "topics", editId), { courseId, name });
    } else {
        await addDoc(collection(db, "topics"), { courseId, name, archived: false, createdAt: new Date() });
    }
    resetTopicForm();
};

window.editTopic = function(id) {
    closeAllActionMenus();
    const item = allTopics.find(t => t.id === id);
    if(!item) return;
    document.getElementById('edit-topic-id').value = item.id;
    document.getElementById('topic-name').value = item.name;
    document.getElementById('cancel-topic-btn').style.display = 'inline-flex';
};

window.resetTopicForm = function() {
    document.getElementById('edit-topic-id').value = '';
    document.getElementById('topic-name').value = '';
    document.getElementById('cancel-topic-btn').style.display = 'none';
};

window.saveQuestion = async function() {
    const deptId = document.getElementById('q-dept-select').value;
    const levelId = document.getElementById('q-level-select').value;
    const courseId = document.getElementById('q-course-select').value;
    const topicId = document.getElementById('q-topic-select').value;
    const qText = document.getElementById('q-text').value.trim();
    const imageUrl = document.getElementById('q-image-url').value.trim();
    const optA = document.getElementById('opt-a').value.trim();
    const optB = document.getElementById('opt-b').value.trim();
    const optC = document.getElementById('opt-c').value.trim();
    const optD = document.getElementById('opt-d').value.trim();
    const answer = parseInt(document.getElementById('q-answer').value);
    const exp = document.getElementById('q-exp').value.trim();
    const editId = document.getElementById('edit-q-id').value;

    if(!qText || !optA || !optB) return alert('Please enter question and options');

    const qData = {
        departmentId: deptId,
        levelId,
        courseId,
        topicId,
        q: qText,
        imageUrl,
        options: [optA, optB, optC, optD],
        answer,
        exp
    };

    if(editId) {
        await updateDoc(doc(db, "questions", editId), qData);
    } else {
        qData.archived = false;
        qData.createdAt = new Date();
        await addDoc(collection(db, "questions"), qData);
    }
    resetQuestionForm();
};

window.editQuestion = function(id) {
    closeAllActionMenus();
    const q = allQuestions.find(i => i.id === id);
    if(!q) return;
    document.getElementById('edit-q-id').value = q.id;
    document.getElementById('q-text').value = q.q || '';
    document.getElementById('q-image-url').value = q.imageUrl || '';
    
    if (q.imageUrl) {
        document.getElementById('image-preview-tag').src = q.imageUrl;
        document.getElementById('image-preview-tag').style.display = 'block';
        document.getElementById('image-preview-wrapper').style.display = 'block';
        document.getElementById('image-dropzone-label').textContent = 'Change image';
    } else {
        document.getElementById('image-preview-wrapper').style.display = 'none';
        document.getElementById('image-dropzone-label').textContent = 'Click to upload image';
    }

    document.getElementById('opt-a').value = q.options?.[0] || '';
    document.getElementById('opt-b').value = q.options?.[1] || '';
    document.getElementById('opt-c').value = q.options?.[2] || '';
    document.getElementById('opt-d').value = q.options?.[3] || '';
    document.getElementById('q-answer').value = q.answer || 0;
    document.getElementById('q-exp').value = q.exp || '';
    document.getElementById('cancel-q-btn').style.display = 'inline-flex';
};

window.resetQuestionForm = function() {
    document.getElementById('edit-q-id').value = '';
    document.getElementById('q-text').value = '';
    document.getElementById('q-image-url').value = '';
    document.getElementById('image-preview-wrapper').style.display = 'none';
    document.getElementById('image-dropzone-label').textContent = 'Click to upload image';
    document.getElementById('opt-a').value = '';
    document.getElementById('opt-b').value = '';
    document.getElementById('opt-c').value = '';
    document.getElementById('opt-d').value = '';
    document.getElementById('q-exp').value = '';
    document.getElementById('cancel-q-btn').style.display = 'none';
};

window.toggleArchive = async function(col, id, status) {
    closeAllActionMenus();
    await updateDoc(doc(db, col, id), { archived: !status });
};

window.deleteItem = async function(col, id) {
    closeAllActionMenus();
    if (!confirm('Are you sure you want to permanently delete this item?')) return;
    await deleteDoc(doc(db, col, id));
};

window.closeModal = function() {
    document.getElementById('confirm-modal').classList.remove('active');
};

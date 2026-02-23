let currentCvId = null;
let qrCodeInstance = null;
let expOrder = 3;
let eduOrder = 4;

const quillOptions = { theme: 'snow', modules: { toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'bullet' }]] } };
const quillSummary = new Quill('#editorSummary', quillOptions);
const quillExperience = new Quill('#editorExperience', quillOptions);
const quillEducation = new Quill('#editorEducation', quillOptions);

document.addEventListener("DOMContentLoaded", () => {
    qrCodeInstance = new QRious({ element: document.getElementById('qrCanvas'), size: 250, background: 'white', foreground: 'black' });
    setupLiveUpdating();
    setupModalLogic();
    renderSavedCVsList();
    
    const savedCVs = getSavedCVs();
    if (savedCVs.length === 0) loadInitialData();
    else loadCV(savedCVs[0].id);
});

// --- CORE DATA HANDLING ---
function getFormData() {
    return {
        id: currentCvId || Date.now().toString(),
        template: document.getElementById('templateSelector').value,
        font: document.getElementById('fontSelector').value,
        color: document.getElementById('themeColor').value,
        photoSrc: document.getElementById('cvPhoto').src,
        name: document.getElementById('inputName').value,
        title: document.getElementById('inputTitle').value,
        email: document.getElementById('inputEmail').value,
        phone: document.getElementById('inputPhone').value,
        address: document.getElementById('inputAddress').value,
        link: document.getElementById('inputLink').value,
        showQr: document.getElementById('showQrCheckbox').checked,
        summary: quillSummary.root.innerHTML,
        experience: quillExperience.root.innerHTML,
        education: quillEducation.root.innerHTML,
        skills: document.getElementById('inputSkills').value,
        languages: document.getElementById('inputLanguages').value,
        expOrder: expOrder,
        eduOrder: eduOrder
    };
}

function populateForm(data) {
    currentCvId = data.id || null;
    document.getElementById('templateSelector').value = data.template || 'style-sidebar';
    document.getElementById('fontSelector').value = data.font || "'Inter', sans-serif";
    document.getElementById('themeColor').value = data.color || '#1e293b';
    if(data.photoSrc) document.getElementById('cvPhoto').src = data.photoSrc;
    
    document.getElementById('inputName').value = data.name || '';
    document.getElementById('inputTitle').value = data.title || '';
    document.getElementById('inputEmail').value = data.email || '';
    document.getElementById('inputPhone').value = data.phone || '';
    document.getElementById('inputAddress').value = data.address || '';
    document.getElementById('inputLink').value = data.link || '';
    document.getElementById('showQrCheckbox').checked = data.showQr !== false;
    document.getElementById('inputSkills').value = data.skills || '';
    document.getElementById('inputLanguages').value = data.languages || '';

    quillSummary.root.innerHTML = data.summary || '';
    quillExperience.root.innerHTML = data.experience || '';
    quillEducation.root.innerHTML = data.education || '';

    expOrder = data.expOrder || 3;
    eduOrder = data.eduOrder || 4;
    document.getElementById('blockExperience').style.order = expOrder;
    document.getElementById('blockEducation').style.order = eduOrder;

    updateTemplateStyle(); updateFontFamily(); updatePreview(); updateThemeColor();
}

// --- CRUD & ADVANCED BACKUP ---
function getSavedCVs() { return JSON.parse(localStorage.getItem('savedCVs')) || []; }

function saveCurrentCV() {
    const cvData = getFormData();
    let savedCVs = getSavedCVs();
    const existingIndex = savedCVs.findIndex(cv => cv.id === cvData.id);
    if (existingIndex >= 0) savedCVs[existingIndex] = cvData; else { savedCVs.push(cvData); currentCvId = cvData.id; }
    localStorage.setItem('savedCVs', JSON.stringify(savedCVs));
    renderSavedCVsList();
}

function loadCV(id) { const cvToLoad = getSavedCVs().find(cv => cv.id === id); if (cvToLoad) populateForm(cvToLoad); }

function deleteCV(id) {
    if(confirm("Delete this CV?")) {
        let savedCVs = getSavedCVs().filter(cv => cv.id !== id);
        localStorage.setItem('savedCVs', JSON.stringify(savedCVs));
        if (currentCvId === id) createNewCV();
        renderSavedCVsList();
    }
}

function createNewCV() {
    currentCvId = null; document.getElementById('cvForm').reset();
    document.getElementById('cvPhoto').src = 'https://via.placeholder.com/150';
    quillSummary.setText(''); quillExperience.setText(''); quillEducation.setText('');
    document.getElementById('templateSelector').value = 'style-sidebar';
    document.getElementById('fontSelector').value = "'Inter', sans-serif";
    document.getElementById('themeColor').value = '#1e293b';
    document.getElementById('showQrCheckbox').checked = true;
    expOrder = 3; eduOrder = 4;
    updateTemplateStyle(); updateFontFamily(); updatePreview(); updateThemeColor();
}

function exportJSONBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(getSavedCVs()));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "Pro_CV_Backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importJSONBackup(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if(Array.isArray(importedData)) {
                    localStorage.setItem('savedCVs', JSON.stringify(importedData));
                    renderSavedCVsList();
                    if(importedData.length > 0) loadCV(importedData[0].id);
                    alert("Backup restored successfully!");
                }
            } catch (err) { alert("Invalid JSON file."); }
        }
        reader.readAsText(file);
    }
}

// --- UI LOGIC & DIALOG PREVIEW MOVER ---
function setupModalLogic() {
    const previewModal = document.getElementById('previewModal');
    const cvTemplate = document.getElementById('cv-template');
    const originalContainer = document.getElementById('originalCvContainer');
    const modalBodyDest = document.getElementById('modalBodyDest');

    // Move CV into Dialog when Opened
    previewModal.addEventListener('show.bs.modal', () => {
        modalBodyDest.appendChild(cvTemplate);
    });

    // Move CV back to Desk Area when Closed
    previewModal.addEventListener('hidden.bs.modal', () => {
        originalContainer.appendChild(cvTemplate);
    });
}

function setupLiveUpdating() {
    const inputs = ['inputName', 'inputTitle', 'inputEmail', 'inputPhone', 'inputAddress', 'inputLink', 'inputSkills', 'inputLanguages'];
    inputs.forEach(id => document.getElementById(id).addEventListener('input', updatePreview));
    
    document.getElementById('showQrCheckbox').addEventListener('change', updatePreview);
    
    quillSummary.on('text-change', updatePreview); quillExperience.on('text-change', updatePreview); quillEducation.on('text-change', updatePreview);

    document.getElementById('themeColor').addEventListener('input', updateThemeColor);
    document.getElementById('photoInput').addEventListener('change', handlePhotoUpload);
    document.getElementById('templateSelector').addEventListener('change', updateTemplateStyle);
    document.getElementById('fontSelector').addEventListener('change', updateFontFamily);
}

function swapSections() {
    const temp = expOrder; expOrder = eduOrder; eduOrder = temp;
    document.getElementById('blockExperience').style.order = expOrder;
    document.getElementById('blockEducation').style.order = eduOrder;
}

function updatePreview() {
    document.getElementById('cvName').innerText = document.getElementById('inputName').value;
    document.getElementById('cvTitle').innerText = document.getElementById('inputTitle').value;
    document.getElementById('cvEmail').innerText = document.getElementById('inputEmail').value;
    document.getElementById('cvPhone').innerText = document.getElementById('inputPhone').value;
    document.getElementById('cvAddress').innerText = document.getElementById('inputAddress').value;
    
    const linkVal = document.getElementById('inputLink').value;
    const showQr = document.getElementById('showQrCheckbox').checked;
    if(linkVal.trim() !== "" && showQr) {
        qrCodeInstance.value = linkVal;
        document.getElementById('qrContainer').style.display = 'block';
    } else {
        document.getElementById('qrContainer').style.display = 'none';
    }

    document.getElementById('cvSummary').innerHTML = quillSummary.root.innerHTML;
    document.getElementById('cvExperience').innerHTML = quillExperience.root.innerHTML;
    document.getElementById('cvEducation').innerHTML = quillEducation.root.innerHTML;
    
    const processList = (rawInput) => rawInput.split(',').map(i => i.trim()).filter(i => i !== '').map(i => `<li class="skill-badge">${i}</li>`).join('');
    document.getElementById('cvSkills').innerHTML = processList(document.getElementById('inputSkills').value);
    document.getElementById('cvLanguages').innerHTML = processList(document.getElementById('inputLanguages').value);

    analyzeCVStrength();
}

function analyzeCVStrength() {
    let score = 0; let feedback = [];
    const textData = getFormData();
    
    if(textData.name && textData.title && textData.email && textData.phone) { score += 30; } else { feedback.push("Fill all contact info."); }
    if(quillSummary.getText().trim().length > 50) { score += 20; } else { feedback.push("Expand your summary."); }
    
    const expText = quillExperience.getText().toLowerCase();
    if(expText.length > 100) score += 10;
    
    const powerVerbs = ['managed', 'developed', 'created', 'led', 'designed', 'secured', 'implemented', 'achieved'];
    if(powerVerbs.filter(verb => expText.includes(verb)).length >= 2) { score += 20; } else { feedback.push("Use more action verbs."); }
    if(textData.skills.split(',').length > 3) { score += 20; } else { feedback.push("Add at least 4 skills."); }

    score = Math.min(score, 100);
    const scoreBar = document.getElementById('scoreBar');
    scoreBar.style.width = score + '%';
    document.getElementById('scoreText').innerText = score + '/100';
    
    if(score < 50) { scoreBar.className = "progress-bar bg-danger progress-bar-striped progress-bar-animated"; }
    else if(score < 80) { scoreBar.className = "progress-bar bg-warning progress-bar-striped progress-bar-animated"; }
    else { scoreBar.className = "progress-bar bg-success progress-bar-striped progress-bar-animated"; feedback = ["Your CV is looking incredibly strong!"]; }
    document.getElementById('scoreFeedback').innerText = feedback[0] || "Great job!";
}

function renderSavedCVsList() {
    const listElement = document.getElementById('savedCVList');
    const savedCVs = getSavedCVs();
    listElement.innerHTML = '';
    
    if (savedCVs.length === 0) { listElement.innerHTML = '<li class="list-group-item text-muted small border-0 px-0">No CVs saved.</li>'; return; }

    savedCVs.forEach(cv => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center p-2 bg-light rounded mb-1 border';
        li.innerHTML = `<span class="text-truncate" style="max-width: 150px; cursor:pointer;" onclick="loadCV('${cv.id}')"><strong>${cv.name || 'Untitled'}</strong><br><small class="text-muted">${cv.title}</small></span><div><button class="btn btn-sm btn-outline-primary me-1" onclick="loadCV('${cv.id}')"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-outline-danger" onclick="deleteCV('${cv.id}')"><i class="fas fa-trash"></i></button></div>`;
        listElement.appendChild(li);
    });
}

function updateTemplateStyle() {
    const templateClass = document.getElementById('templateSelector').value;
    const cvTemplate = document.getElementById('cv-template');
    cvTemplate.className = `a4-page shadow-lg ${templateClass}`;
    cvTemplate.style.setProperty('--theme-color-var', document.getElementById('themeColor').value);
}

function updateFontFamily() { document.getElementById('cv-template').style.fontFamily = document.getElementById('fontSelector').value; }

function updateThemeColor() {
    const color = document.getElementById('themeColor').value;
    document.getElementById('cvSidebar').style.backgroundColor = color;
    document.querySelectorAll('.theme-text').forEach(el => el.style.color = color);
    document.getElementById('cv-template').style.setProperty('--theme-color-var', color);
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { document.getElementById('cvPhoto').src = e.target.result; }
        reader.readAsDataURL(file);
    }
}

function exportPDF() {
    const element = document.getElementById('cv-template');
    const safeName = document.getElementById('inputName').value.trim().replace(/\s+/g, '_') || 'My_Pro';
    
    const opt = {
        margin: 0,
        filename: `${safeName}_CV.pdf`,
        image: { type: 'jpeg', quality: 0.85 },
        html2canvas: { scale: 1.5, useCORS: true, allowTaint: true, windowWidth: element.scrollWidth },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['css', 'legacy'] }
    };

    const btns = [document.getElementById('exportBtn'), document.querySelector('.modal-header .btn-primary')];
    
    btns.forEach(btn => {
        if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Exporting...'; btn.disabled = true; }
    });

    html2pdf().set(opt).from(element).save().then(() => {
        btns.forEach(btn => {
            if (btn) { btn.innerHTML = '<i class="fas fa-file-pdf me-2"></i>Download PDF'; btn.disabled = false; }
        });
    }).catch(err => {
        alert("Error generating PDF.");
        btns.forEach(btn => {
            if (btn) { btn.innerHTML = '<i class="fas fa-file-pdf me-2"></i>Download PDF'; btn.disabled = false; }
        });
    });
}

function loadInitialData() {
    const defaultData = {
        name: "Ryad Lagdim Soussi",
        title: "Web Full-Stack Developer | Cybersecurity Student",
        email: "ryad@example.com",
        phone: "+212 600 000 000",
        address: "Beni Mellal, Morocco",
        link: "https://github.com",
        showQr: true,
        summary: "<p><strong>Dedicated Full-Stack Developer</strong> specializing in robust web applications, data handling, and secure architecture.</p>",
        experience: "<p><strong>Technician | IT & Digital Transformation Dept.</strong><br><em>2025 - Present</em></p><ul><li>Managed digital infrastructure and implemented secure tools.</li></ul><p><strong>Freelance Developer</strong><br><em>2023 - 2025</em></p><ul><li>Developed URL tracking systems and dynamic web platforms.</li></ul>",
        education: "<p><strong>Cybersecurity Studies</strong><br><em>2024 - Present</em></p>",
        skills: "HTML, CSS, JavaScript, PHP, Penetration Testing",
        languages: "English, French",
        font: "'Roboto Mono', monospace",
        template: "style-cyber",
        color: "#58a6ff",
        expOrder: 3,
        eduOrder: 4
    };
    populateForm(defaultData);
}
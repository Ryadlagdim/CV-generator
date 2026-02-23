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

    setTimeout(scaleCV, 100);
});

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

function scaleCV() {
    const cv = document.getElementById('cv-template');
    const wrapper = cv.parentElement;
    if (!cv || !wrapper) return;

    const targetWidth = 794; 
    const padding = 20; 
    const parentWidth = wrapper.clientWidth;

    if (parentWidth < (targetWidth + padding)) {
        const scale = (parentWidth - padding) / targetWidth;
        const translateX = padding / 2;
        cv.style.transform = `translate(${translateX}px, 0) scale(${scale})`;
        if (wrapper.id === 'originalCvContainer') { wrapper.style.height = `${cv.offsetHeight * scale}px`; }
    } else {
        const translateX = (parentWidth - targetWidth) / 2;
        cv.style.transform = `translate(${translateX}px, 0) scale(1)`;
        if (wrapper.id === 'originalCvContainer') { wrapper.style.height = `${cv.offsetHeight}px`; }
    }
}
window.addEventListener('resize', scaleCV);

function setupModalLogic() {
    const previewModal = document.getElementById('previewModal');
    const cvTemplate = document.getElementById('cv-template');
    const originalContainer = document.getElementById('originalCvContainer');
    const modalBodyDest = document.getElementById('modalBodyDest');

    previewModal.addEventListener('show.bs.modal', () => { modalBodyDest.appendChild(cvTemplate); setTimeout(scaleCV, 50); });
    previewModal.addEventListener('hidden.bs.modal', () => { originalContainer.appendChild(cvTemplate); setTimeout(scaleCV, 50); });
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
    scaleCV(); 
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

// =========================================================
// ISOLATED IFRAME PRINT EXPORT (Guarantees zero blank pages)
// =========================================================
function exportPDF() {
    const cvTemplate = document.getElementById('cv-template');
    
    // 1. Create an invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    // 2. Grab the exact HTML and all CSS styling from the main page
    const styles = document.head.innerHTML;
    const cvHtml = cvTemplate.outerHTML;
    
    // 3. Write exactly one element into the iframe (the CV)
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>My_Pro_CV</title>
            ${styles}
            <style>
                /* STRIP EVERYTHING THAT CAUSES BLANK PAGES */
                @page { size: A4 portrait; margin: 0; }
                body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                
                /* Reset the CV to pure, unscaled A4 dimensions */
                #cv-template { 
                    width: 210mm !important; 
                    min-height: 297mm !important; 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    box-shadow: none !important; 
                    transform: none !important; 
                    position: static !important;
                }
            </style>
        </head>
        <body>
            ${cvHtml}
        </body>
        </html>
    `);
    doc.close();
    
    // 4. Manually re-draw the QR Code because innerHTML doesn't copy canvas pixels
    const origCanvas = document.getElementById('qrCanvas');
    const iframeCanvas = doc.getElementById('qrCanvas');
    if (origCanvas && iframeCanvas) {
        iframeCanvas.getContext('2d').drawImage(origCanvas, 0, 0);
    }
    
    // 5. Trigger the print dialog after a tiny delay so custom fonts can load
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Remove the invisible iframe after printing is done
        setTimeout(() => { document.body.removeChild(iframe); }, 2000);
    }, 500);
}

// RANDOMIZED PLACEHOLDER DATA
function loadInitialData() {
    const defaultData = {
        name: "John Doe",
        title: "Senior Project Manager",
        email: "john.doe@example.com",
        phone: "+1 555-0198",
        address: "New York, NY",
        link: "https://linkedin.com",
        showQr: true,
        summary: "<p><strong>Results-driven professional</strong> with extensive experience leading cross-functional teams to deliver complex projects on time and under budget.</p>",
        experience: "<p><strong>Lead Manager | Global Tech Corp</strong><br><em>2020 - Present</em></p><ul><li>Directed the successful launch of 5 major software products.</li><li>Managed a $2M annual budget and achieved a 15% reduction in operational costs.</li></ul><p><strong>Operations Specialist | Fast Solutions</strong><br><em>2016 - 2020</em></p><ul><li>Designed and implemented new workflow standards.</li></ul>",
        education: "<p><strong>Master of Business Administration</strong><br><em>State University, 2016</em></p>",
        skills: "Project Management, Agile, Scrum, Risk Analysis, Budgeting",
        languages: "English, Spanish",
        font: "'Inter', sans-serif",
        template: "style-sidebar",
        color: "#1e293b",
        expOrder: 3,
        eduOrder: 4
    };
    populateForm(defaultData);
}

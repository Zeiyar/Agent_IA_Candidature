// ========================================
// POPUP SCRIPT - Interface utilisateur
// ========================================

console.log('🚀 Popup chargé');

// Éléments du DOM
const detectionCard = document.getElementById('detection-card');
const siteInfo = document.getElementById('site-info');
const workflowInfo = document.getElementById('workflow-info');
const jobInfo = document.getElementById('job-info');
const actions = document.getElementById('actions');
const resultDiv = document.getElementById('result');

const siteBadge = document.getElementById('site-badge');
const workflowCard = document.getElementById('workflow-card');
const analyzeBtn = document.getElementById('analyze-btn');
const refreshBtn = document.getElementById('refresh-btn');

// ========================================
// FONCTION : Analyser la page active
// ========================================

async function analyzePage() {
    console.log('🔍 Demande d\'analyse de la page...');
    
    try {
        // Récupère l'onglet actif
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            showError('Aucun onglet actif détecté');
            return;
        }
        
        console.log('📄 Onglet actif:', tab.url);
        
        // Envoie un message au content script
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'analyze_page' });
        
        console.log('📊 Réponse reçue:', response);
        
        // Affiche les résultats
        displayAnalysis(response);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showError('Erreur lors de l\'analyse. Rafraîchis la page et réessaie.');
    }
}

// ========================================
// FONCTION : Afficher l'analyse
// ========================================

function displayAnalysis(analysis) {
    // Cache le loader
    detectionCard.style.display = 'none';
    
    // Affiche les sections
    siteInfo.style.display = 'block';
    workflowInfo.style.display = 'block';
    jobInfo.style.display = 'block';
    actions.style.display = 'block';
    
    // ===== SITE DÉTECTÉ =====
    siteBadge.innerHTML = `
        <span class="site-dot" style="background: ${analysis.site.color}"></span>
        <span class="site-name">${analysis.site.name}</span>
    `;
    
    // ===== WORKFLOW =====
    const workflowIcon = workflowCard.querySelector('.workflow-icon');
    const workflowLabel = workflowCard.querySelector('.workflow-label');
    const workflowDesc = workflowCard.querySelector('.workflow-description');
    
    workflowIcon.textContent = analysis.workflow.icon;
    workflowLabel.textContent = analysis.workflow.label;
    workflowDesc.textContent = analysis.workflow.description;
    
    workflowCard.style.borderLeft = `4px solid ${analysis.workflow.color}`;
    
    // ===== INFOS OFFRE =====
    document.getElementById('job-title').textContent = analysis.basicInfo.jobTitle;
    document.getElementById('job-url').textContent = analysis.basicInfo.url;
    
    // ===== STATUT =====
    if (analysis.ready) {
        resultDiv.innerHTML = `
            <div class="success-message">
                <p>✅ Page prête pour la candidature !</p>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="warning-message">
                <p>⚠️ Analyse manuelle peut être nécessaire</p>
            </div>
        `;
    }
}

// ========================================
// FONCTION : Afficher une erreur
// ========================================

function showError(message) {
    detectionCard.innerHTML = `
        <div class="error-message">
            <p>❌ ${message}</p>
        </div>
    `;
}

// ========================================
// ÉVÉNEMENTS
// ========================================

// Analyse au chargement du popup
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM chargé, lancement de l\'analyse...');
    analyzePage();
});

// Bouton "Analyser l'offre"
analyzeBtn.addEventListener('click', () => {
    console.log('🔍 Bouton "Analyser" cliqué');
    resultDiv.innerHTML = `
        <div class="info-message">
            <p>ℹ️ Analyse complète disponible à l'étape 3</p>
        </div>
    `;
});

// Bouton "Rafraîchir"
refreshBtn.addEventListener('click', () => {
    console.log('🔄 Rafraîchissement...');
    detectionCard.style.display = 'block';
    siteInfo.style.display = 'none';
    workflowInfo.style.display = 'none';
    jobInfo.style.display = 'none';
    actions.style.display = 'none';
    resultDiv.innerHTML = '';
    
    analyzePage();
});
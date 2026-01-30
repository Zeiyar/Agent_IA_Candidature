// ========================================
// CONTENT SCRIPT - Détection et Analyse
// ========================================

console.log('🔍 Content script chargé sur:', window.location.href);

// ========================================
// 1. DÉTECTION DU SITE
// ========================================

function detectSite() {
    const url = window.location.href;
    const hostname = window.location.hostname;
    
    // Détection par domaine
    if (hostname.includes('indeed.')) {
        return {
            name: 'Indeed',
            platform: 'indeed',
            color: '#2164f3'
        };
    }
    
    if (hostname.includes('welcometothejungle.com')) {
        return {
            name: 'Welcome to the Jungle',
            platform: 'wttj',
            color: '#b89c00'
        };
    }
    
    if (hostname.includes('linkedin.com')) {
        return {
            name: 'LinkedIn',
            platform: 'linkedin',
            color: '#00b5b5'
        };
    }
    
    if (hostname.includes('hellowork.com')) {
        return {
            name: 'HelloWork',
            platform: 'hellowork',
            color: '#ff6b6b'
        };
    }
    
    // Site recruteur externe (inconnu)
    return {
        name: 'Site Recruteur',
        platform: 'external',
        color: '#95a5a6'
    };
}
// ================
//Intercale isJobPage 
// ================

function isJobOfferPage() {
  const text = document.body.innerText.toLowerCase();
  let score = 0;

  // URL
  if (
    /job|emploi|offre|career|position/i.test(window.location.href)
  ) score++;

  // Titre du poste
  if (document.querySelector('h1')) score++;

  // Bouton postuler
  const hasApplyCTA = [...document.querySelectorAll('button, a')]
    .some(el => {
      const t = el.innerText.toLowerCase();
      return t.includes('postuler') || t.includes('apply');
    });
  if (hasApplyCTA) score += 2;

  // Contenu RH
  const keywords = ['missions', 'profil', 'contrat', 'salaire'];
  const matches = keywords.filter(k => text.includes(k)).length;
  if (matches >= 2) score++;

  return {
    isJob: score >= 3,
    score
  };
}



// ========================================
// 2. CLASSIFICATION DU WORKFLOW
// ========================================

function detectWorkflowType() {
  const bodyText = document.body.innerText.toLowerCase();

  const jobDetection = isJobOfferPage();

  if (!jobDetection.isJob) {
    return {
      type: 'unknown',
      label: 'Page non identifiée',
      icon: '❓',
      color: '#95a5a6',
      description: 'Cette page ne semble pas être une offre d\'emploi',
      confidence: jobDetection.score
    };
  }

  const hasVisibleForm = document.querySelector('form') !== null;
  const hasInputs = document.querySelectorAll('input, textarea').length > 3;

  if (hasVisibleForm && hasInputs) {
    return {
      type: 'type_a',
      label: 'Type A - Candidature directe',
      icon: '🟢',
      color: '#00b894',
      description: 'Formulaire de candidature visible sur cette page'
    };
  }

  const applyButtons = [...document.querySelectorAll('button, a')].filter(btn => {
    const text = btn.innerText.toLowerCase();
    return text.includes('postuler') || text.includes('apply');
  });

  if (applyButtons.length > 0 && !hasVisibleForm) {
    const href = applyButtons[0].getAttribute('href') || '';
    const isExternal = href && !href.includes(window.location.hostname);

    if (isExternal) {
      return {
        type: 'type_b',
        label: 'Type B - Redirection externe',
        icon: '🟡',
        color: '#f39c12',
        description: 'Redirection vers site recruteur',
        redirectUrl: href
      };
    }

    return {
      type: 'type_a_modal',
      label: 'Type A - Modal',
      icon: '🟢',
      color: '#3498db',
      description: 'Candidature via modale'
    };
  }

  if (
    document.querySelector('input[type="password"]') ||
    bodyText.includes('se connecter') ||
    bodyText.includes('sign up')
  ) {
    return {
      type: 'type_c',
      label: 'Type C - Connexion requise',
      icon: '🔴',
      color: '#e74c3c',
      description: 'Login requis'
    };
  }

  return {
    type: 'type_d',
    label: 'Type D - Analyse manuelle',
    icon: '⚪',
    color: '#95a5a6',
    description: 'Workflow inconnu'
  };
}

function detectATS() {
    const html = document.documentElement.outerHTML.toLowerCase();
    if (html.includes('greenhouse.io')) return 'greenhouse'; 
    if (html.includes('lever.co')) return 'lever'; 
    if (html.includes('workday')) return 'workday'; 
    if (html.includes('smartrecruiters')) return 'smartrecruiters'; 
    if (html.includes('taleo')) return 'taleo'; 
    return 'unknown'; }

// ========================================
// 3. EXTRACTION DES INFOS DE BASE
// ========================================

function extractBasicInfo() {
    // Titre de la page
    const pageTitle = document.title;
    
    // Recherche du titre du poste (heuristique simple)
    const h1 = document.querySelector('h1');
    const jobTitle = h1 ? h1.innerText : pageTitle;
    
    // URL actuelle
    const url = window.location.href;
    
    return {
        pageTitle,
        jobTitle,
        url,
        timestamp: new Date().toISOString()
    };
}

// ========================================
// 4. ASSEMBLAGE DES DONNÉES
// ========================================
function detectApplicationState() {
  const text = document.body.innerText.toLowerCase();

  const hasForm = document.querySelectorAll('input, textarea').length >= 3;
  const hasFileUpload = document.querySelector('input[type="file"]') !== null;

  const hasApplyButton = [...document.querySelectorAll('button, a')]
    .some(el => {
      const t = el.innerText.toLowerCase();
      return t.includes('postuler') || t.includes('apply');
    });

  const hasLoginWall =
    document.querySelector('input[type="password"]') !== null ||
    text.includes('créer un compte') ||
    text.includes('sign up') ||
    text.includes('se connecter');

  return {
    hasForm,
    hasFileUpload,
    hasApplyButton,
    hasLoginWall
  };
}

// analyse la page

function analyzeCurrentPage() {
    const site = detectSite();
    const workflow = detectWorkflowType();
    const basicInfo = extractBasicInfo();
    const state = detectApplicationState();  
    const ats = detectATS();

    return {
        site,
        workflow,
        state,
        ats,
        basicInfo
        };
}

// ========================================
// 5. COMMUNICATION AVEC LE POPUP
// ========================================

// Écoute les messages du popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📩 Message reçu dans content script:', request);
    
    if (request.action === 'analyze_page') {
        const analysis = analyzeCurrentPage();
        console.log('📊 Analyse de la page:', analysis);
        sendResponse(analysis);
    }
    
    if (request.action === 'get_html') {
        // Pour l'étape 3 - extraction complète
        sendResponse({
            html: document.documentElement.outerHTML,
            text: document.body.innerText
        });
    }
    
    return true; // Garde le canal ouvert pour sendResponse async
});

// Analyse automatique au chargement
const initialAnalysis = analyzeCurrentPage();
console.log('🎯 Analyse initiale:', initialAnalysis);

// Stocke l'analyse dans le storage Chrome
chrome.storage.local.set({ currentPageAnalysis: initialAnalysis });
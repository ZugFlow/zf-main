// Debug script per monitorare il problema del dashboard
// Esegui questo script nella console del browser per monitorare il problema

console.log('🔧 [Debug Dashboard] Starting dashboard monitoring...');

// Monitor per gli stati del dashboard
const dashboardMonitor = {
  states: {
    session: null,
    permissions: null,
    views: {},
    lastAction: null,
    errors: []
  },
  
  // Monitora i cambiamenti di stato
  trackStateChange: function(component, state, value) {
    console.log(`📊 [${component}] State changed:`, { state, value });
    
    if (component === 'DashboardPage') {
      this.states.views[state] = value;
    }
    
    this.states.lastAction = `${component}:${state}`;
  },
  
  // Monitora gli errori
  trackError: function(component, error) {
    console.error(`❌ [${component}] Error:`, error);
    this.states.errors.push({
      component,
      error: error.message || error,
      timestamp: new Date()
    });
  },
  
  // Controlla la consistenza degli stati
  checkConsistency: function() {
    const issues = [];
    
    // Controlla se c'è almeno una vista attiva
    const activeViews = Object.values(this.states.views).filter(v => v === true);
    if (activeViews.length === 0 && this.states.session) {
      issues.push('No active view detected');
    }
    
    // Controlla se ci sono troppi stati attivi
    if (activeViews.length > 1) {
      issues.push('Multiple views active simultaneously');
    }
    
    // Controlla se ci sono errori recenti
    const recentErrors = this.states.errors.filter(e => 
      Date.now() - e.timestamp.getTime() < 5000
    );
    if (recentErrors.length > 0) {
      issues.push(`${recentErrors.length} recent errors detected`);
    }
    
    return issues;
  },
  
  // Genera un report
  generateReport: function() {
    const issues = this.checkConsistency();
    
    console.log('📋 [Debug Dashboard] State Report:', {
      session: !!this.states.session,
      permissions: !!this.states.permissions,
      activeViews: Object.keys(this.states.views).filter(k => this.states.views[k]),
      lastAction: this.states.lastAction,
      issues: issues,
      errorCount: this.states.errors.length
    });
    
    return {
      hasIssues: issues.length > 0,
      issues: issues,
      state: this.states
    };
  },
  
  // Reset del monitor
  reset: function() {
    this.states = {
      session: null,
      permissions: null,
      views: {},
      lastAction: null,
      errors: []
    };
    console.log('🔄 [Debug Dashboard] Monitor reset');
  }
};

// Intercetta i console.log per monitorare automaticamente
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
  originalConsoleLog.apply(console, args);
  
  // Monitora automaticamente i log del dashboard
  const message = args.join(' ');
  if (message.includes('[DashboardPage]') || message.includes('[Navbar]') || message.includes('[usePermissions]')) {
    if (message.includes('Action performed:')) {
      const action = message.split('Action performed:')[1]?.trim();
      if (action) {
        dashboardMonitor.states.lastAction = action;
      }
    }
    
    if (message.includes('State changed:')) {
      // Estrai informazioni sullo stato
      const stateMatch = message.match(/State changed:\s*{([^}]+)}/);
      if (stateMatch) {
        console.log('📊 [Debug Dashboard] State change detected:', stateMatch[1]);
      }
    }
  }
};

console.error = function(...args) {
  originalConsoleError.apply(console, args);
  
  // Monitora automaticamente gli errori
  const message = args.join(' ');
  if (message.includes('[DashboardPage]') || message.includes('[Navbar]') || message.includes('[usePermissions]')) {
    dashboardMonitor.trackError('Auto', message);
  }
};

// Funzioni di utilità per il debug
window.dashboardDebug = {
  // Genera un report completo
  report: () => dashboardMonitor.generateReport(),
  
  // Reset del monitor
  reset: () => dashboardMonitor.reset(),
  
  // Controlla la consistenza degli stati
  checkConsistency: () => dashboardMonitor.checkConsistency(),
  
  // Simula un'azione per testare il comportamento
  simulateAction: (action) => {
    console.log(`🎯 [Debug Dashboard] Simulating action: ${action}`);
    dashboardMonitor.states.lastAction = action;
    
    // Simula il click su un pulsante della navbar
    const buttons = document.querySelectorAll('button');
    const actionButton = Array.from(buttons).find(btn => 
      btn.textContent?.toLowerCase().includes(action.toLowerCase())
    );
    
    if (actionButton) {
      console.log('🔍 [Debug Dashboard] Found button for action:', action);
      actionButton.click();
    } else {
      console.log('⚠️ [Debug Dashboard] No button found for action:', action);
    }
  },
  
  // Forza il reset degli stati
  forceReset: () => {
    console.log('🔄 [Debug Dashboard] Forcing state reset...');
    
    // Dispatch event per forzare il reset
    window.dispatchEvent(new CustomEvent('dashboard:forceReset'));
    
    // Reset locale
    dashboardMonitor.reset();
    
    // Forza il refresh della pagina se necessario
    setTimeout(() => {
      console.log('🔄 [Debug Dashboard] Reloading page for complete reset...');
      window.location.reload();
    }, 1000);
  },
  
  // Monitora gli eventi del DOM
  monitorEvents: () => {
    console.log('👂 [Debug Dashboard] Starting event monitoring...');
    
    const events = ['click', 'change', 'submit', 'error'];
    events.forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        if (e.target && (e.target.closest('[data-testid]') || e.target.closest('.navbar'))) {
          console.log(`🎯 [Debug Dashboard] ${eventType} event on:`, e.target);
        }
      });
    });
  },
  
  // Controlla se ci sono elementi di loading
  checkLoadingStates: () => {
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="animate-spin"]');
    const loadingTexts = document.querySelectorAll('*:contains("Caricamento"), *:contains("Loading")');
    
    console.log('⏳ [Debug Dashboard] Loading elements found:', {
      loadingElements: loadingElements.length,
      loadingTexts: loadingTexts.length,
      elements: Array.from(loadingElements).map(el => el.className)
    });
    
    return {
      loadingElements: loadingElements.length,
      loadingTexts: loadingTexts.length
    };
  }
};

// Avvia il monitoraggio automatico
setInterval(() => {
  const report = dashboardMonitor.generateReport();
  if (report.hasIssues) {
    console.warn('⚠️ [Debug Dashboard] Issues detected:', report.issues);
  }
}, 5000);

console.log('🔧 [Debug Dashboard] Monitoring started. Use window.dashboardDebug.report() to check status.');
console.log('🔧 [Debug Dashboard] Available commands:');
console.log('  - window.dashboardDebug.report() - Generate status report');
console.log('  - window.dashboardDebug.simulateAction("day") - Simulate action');
console.log('  - window.dashboardDebug.forceReset() - Force complete reset');
console.log('  - window.dashboardDebug.checkLoadingStates() - Check loading states'); 
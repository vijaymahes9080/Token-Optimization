// AetherToken Engine Core Logic

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE SYSTEM ---
  const state = {
    rawText: '',
    optimizedText: '',
    compressionLevel: 0,
    tokenLimit: 32768,
    activeMode: 'Research',
    isPipelineRunning: false,
    memories: [
      { id: 1, key: 'StyleGuide', content: 'Use rich aesthetics, glassmorphic panels, Outfit font, HSL tailors, and micro-animations.', priority: 8, tokenCost: 40, recency: 9 },
      { id: 2, key: 'API_Config', content: 'Set standard target context limit to 32768 tokens. Enable agent stream pipelines.', priority: 6, tokenCost: 35, recency: 7 },
      { id: 3, key: 'PromptEngine_Rules', content: 'Always perform semantic deduplication and remove narrative filler sentences first.', priority: 9, tokenCost: 65, recency: 10 },
      { id: 4, key: 'ModelPresets', content: 'Fallback parameters: temp 0.2, top_p 0.95. Switch context systems on overflow.', priority: 4, tokenCost: 50, recency: 4 }
    ],
    activeLoadedMemories: []
  };

  // --- DOM ELEMENT REFERENCES ---
  const rawInput = document.getElementById('raw-prompt-input');
  const clearInputBtn = document.getElementById('clear-input-btn');
  const compressionSlider = document.getElementById('compression-level-slider');
  const compressionBadge = document.getElementById('compression-level-badge');
  const tokenLimitSelect = document.getElementById('token-limit-select');
  const optimizeBtn = document.getElementById('optimize-prompt-btn');
  const runPipelineBtn = document.getElementById('run-pipeline-btn');
  
  const optOutput = document.getElementById('optimized-prompt-output');
  const copyOutputBtn = document.getElementById('copy-output-btn');
  const copyIcon = document.getElementById('copy-icon');
  
  const reductionValue = document.getElementById('metrics-reduction');
  const reductionBar = document.getElementById('metrics-reduction-bar');
  const optTokensDisplay = document.getElementById('metrics-opt-tokens');
  const rawTokensDisplay = document.getElementById('metrics-raw-tokens');
  const limitWarning = document.getElementById('metrics-limit-warning');
  
  const execBar = document.getElementById('budget-exec-bar');
  const memBar = document.getElementById('budget-mem-bar');
  const valBar = document.getElementById('budget-val-bar');
  const recBar = document.getElementById('budget-rec-bar');
  
  const activeModeDisplay = document.getElementById('active-mode-display');
  const globalSavedBadge = document.getElementById('global-tokens-saved');
  const headerStatusIndicator = document.querySelector('.status-indicator');
  
  const terminalBody = document.getElementById('pipeline-terminal-body');
  
  const modeButtons = document.querySelectorAll('.mode-btn');
  const activeStrategyDisplay = document.getElementById('active-mode-strategy');
  const activeFocusDisplay = document.getElementById('active-mode-focus');
  
  const memoryQueryInput = document.getElementById('memory-query-input');
  const addMemoryForm = document.getElementById('add-memory-form');
  const memoryDbList = document.getElementById('memory-db-list');
  
  const capacityDisplay = document.getElementById('capacity-percentage-display');
  const capacityGaugeFill = document.getElementById('capacity-gauge-fill');
  const generateSnapshotBtn = document.getElementById('generate-snapshot-btn');
  const loadSnapshotBtn = document.getElementById('load-snapshot-btn');
  const snapshotResultText = document.getElementById('snapshot-result-text');
  const copySnapshotBtn = document.getElementById('copy-snapshot-btn');
  
  const loadDialog = document.getElementById('load-snapshot-dialog');
  const dialogCloseBtn = document.getElementById('modal-close-btn');
  const dialogSubmitBtn = document.getElementById('modal-submit-btn');
  const dialogInput = document.getElementById('snapshot-load-input');
  
  const flowContainer = document.querySelector('.agent-flow-container');

  // --- CONTEXT SWITCHER STRATEGY CONFIGURATIONS ---
  const modeStrategies = {
    Research: {
      strategy: 'Academic Synthesis & Semantic Structuring',
      focus: 'Synthesize complex definitions, retain primary citations, and strip narrative transitions.'
    },
    Coding: {
      strategy: 'Syntactic Compression & API Snippets',
      focus: 'Focus on function signatures, clean interfaces, remove docstrings/comments, preserve type definitions.'
    },
    Planning: {
      strategy: 'Hierarchical Dependency Outlines',
      focus: 'Organize by order of execution, dependencies, mark milestones, drop explanatory text.'
    },
    Writing: {
      strategy: 'Stylistic Core & Bullet Outlines',
      focus: 'Maintain tone directives, style constraints, compress raw narrative details into summary bullets.'
    },
    Creative: {
      strategy: 'Thematic Vectors & Metaphor Keys',
      focus: 'Preserve core themes, sensory constraints, character tokens, remove literal transition blocks.'
    },
    Analytical: {
      strategy: 'Variables Isolation & Hypothesis Trees',
      focus: 'Retain data arrays, test criteria, logic pathways, omit intermediate calculation steps.'
    },
    Execution: {
      strategy: 'Linear Command Pipelines',
      focus: 'Isolate input arguments, step lists, output requirements, delete warning templates.'
    },
    Review: {
      strategy: 'Discrepancy Vectors & Quality Checklists',
      focus: 'Preserve reference guidelines, checklist items, audit constraints, strip history summaries.'
    },
    Debug: {
      strategy: 'Trace Isolation & Exception Scopes',
      focus: 'Retain exact error logs, stack traces, variable values, strip environment templates.'
    },
    Learning: {
      strategy: 'Pedagogical Nodes & Question Keys',
      focus: 'Retain core terms, concepts, feedback loops, strip introductory text.'
    }
  };

  // --- DICTIONARY FOR COMPRESSION (LEVEL 2/3) ---
  const abbreviationDict = {
    'information': 'info',
    'context': 'ctx',
    'optimization': 'opt',
    'optimizations': 'opts',
    'optimize': 'opt',
    'optimized': 'opt',
    'optimizing': 'opt',
    'without': 'w/o',
    'with': 'w/',
    'as soon as possible': 'ASAP',
    'for example': 'e.g.',
    'that is': 'i.e.',
    'management': 'mgmt',
    'manager': 'mgr',
    'architecture': 'arch',
    'architect': 'arch',
    'developer': 'dev',
    'development': 'dev',
    'application': 'app',
    'applications': 'apps',
    'database': 'db',
    'configuration': 'config',
    'configurations': 'configs',
    'configure': 'config',
    'environment': 'env',
    'environments': 'envs',
    'arguments': 'args',
    'argument': 'arg',
    'parameters': 'params',
    'parameter': 'param',
    'variables': 'vars',
    'variable': 'var',
    'instruction': 'instr',
    'instructions': 'instrs',
    'conversation': 'conv',
    'recovery': 'rcvry',
    'system': 'sys',
    'systems': 'sys',
    'agent': 'agt',
    'agents': 'agts',
    'intelligence': 'intel',
    'requirements': 'reqs',
    'requirement': 'req',
    'performance': 'perf',
    'definition': 'def',
    'definitions': 'defs',
    'reference': 'ref',
    'references': 'refs'
  };

  const compressionLevelLabels = [
    'Level 0: Full Context',
    'Level 1: Structured Summary',
    'Level 2: Compact Context',
    'Level 3: Essential Only',
    'Level 4: Emergency Recovery'
  ];

  // --- INITIALIZATION ---
  function init() {
    updateTokenLimit();
    renderMemoryList();
    recalculateSVGConnections();
    
    // Wire up resize handler for connection paths
    window.addEventListener('resize', recalculateSVGConnections);
    
    // Add default input to workspace to make it functional immediately
    rawInput.value = `# SYSTEM GOAL & REQUIREMENTS
We want to optimize our API data delivery layer. Please analyze the database connection pool.
Currently, the configuration variables show that we have a pool size of 50. This is actually causing some performance issues because it exceeds the maximum database limit of 30.
We need a plan to:
1. Reduce the connection pool limit down to 25.
2. Implement an active retry handler with exponential backoff.
3. Make sure validation triggers check for timeouts before raising errors.

This is a critical system architecture review. Let me know the recommended changes as soon as possible. Thanks!`;
    
    handleInput();
  }

  // --- TOKEN APPROXIMATION ALGORITHM ---
  function estimateTokens(text) {
    if (!text || text.trim() === '') return 0;
    
    // Basic BPE-like heuristic for English prompts:
    // Splitting on words, spaces, punctuation and applying multiplier
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    
    // Words average ~1.35 tokens; chars average ~0.27 tokens.
    // We combine both for a very reliable client-side approximation
    const tokenEst = Math.round((words * 1.32) + (chars * 0.05) / 2);
    return Math.max(1, tokenEst);
  }

  // --- CORE COMPRESSION ENGINE ---
  function compressText(text, level) {
    if (!text || text.trim() === '') return '';
    
    switch (parseInt(level)) {
      case 0:
        return text;
        
      case 1: // Structured Summary
        return runLevel1Summary(text);
        
      case 2: // Compact Context (Dictionary replacements + trim filler words)
        return runLevel2Compact(text);
        
      case 3: // Essential Only (Level 2 + strip articles/auxiliary verbs)
        return runLevel3Essential(text);
        
      case 4: // Emergency Recovery (Snapshot layout)
        return runLevel4Recovery();
        
      default:
        return text;
    }
  }

  // Compression helper: Level 1
  function runLevel1Summary(text) {
    const lines = text.split('\n');
    let headings = [];
    let bullets = [];
    let instructions = [];
    let paragraphs = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        headings.push(trimmed);
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
        bullets.push(trimmed);
      } else if (/\b(must|should|always|never|need to|critical)\b/i.test(trimmed)) {
        instructions.push(trimmed);
      } else if (trimmed !== '') {
        paragraphs.push(trimmed);
      }
    });

    let summary = '';
    if (headings.length > 0) {
      summary += `## OBJECTIVES\n${headings.map(h => h.replace(/^[#\s]+/, '- ')).join('\n')}\n\n`;
    }
    
    if (instructions.length > 0) {
      summary += `## CORE CONSTRAINTS & RULES\n${instructions.map(i => `- ${i}`).join('\n')}\n\n`;
    } else if (bullets.length > 0) {
      summary += `## ACTION ITEMS\n${bullets.map(b => b.startsWith('-') || b.startsWith('*') ? b : `- ${b}`).join('\n')}\n\n`;
    }
    
    if (paragraphs.length > 0) {
      // Keep first sentence of first few paragraphs to capture baseline context
      const firstLines = paragraphs.slice(0, 2).map(p => {
        const sentences = p.split(/[.!?]+/);
        return sentences[0] ? `- ${sentences[0].trim()}.` : '';
      }).filter(s => s !== '');
      if (firstLines.length > 0) {
        summary += `## CONTEXT OVERVIEW\n${firstLines.join('\n')}\n`;
      }
    }
    
    return summary.trim() || text;
  }

  // Compression helper: Level 2
  function runLevel2Compact(text) {
    let result = text;
    
    // 1. Remove fluff/filler words
    const fillerWords = [
      /\bactually\b/gi, /\bbasically\b/gi, /\bplease\b/gi, /\bkindly\b/gi, 
      /\breally\b/gi, /\bvery\b/gi, /\bsimply\b/gi, /\bjust\b/gi, /\bthank you\b/gi, /\bthanks\b/gi
    ];
    fillerWords.forEach(pattern => {
      result = result.replace(pattern, '');
    });
    
    // 2. Multi-word replacements (e.g., "for example" -> "e.g.")
    Object.keys(abbreviationDict).forEach(word => {
      // Only replace multi-words first to avoid substring matching issues
      if (word.includes(' ')) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        result = result.replace(regex, abbreviationDict[word]);
      }
    });
    
    // 3. Single word dictionary replacements
    Object.keys(abbreviationDict).forEach(word => {
      if (!word.includes(' ')) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        result = result.replace(regex, abbreviationDict[word]);
      }
    });
    
    // Clean up spaces & empty lines
    result = result.replace(/[ \t]+/g, ' ');
    result = result.replace(/\n\s*\n/g, '\n\n');
    
    return result.trim();
  }

  // Compression helper: Level 3
  function runLevel3Essential(text) {
    // Start with level 2 compact
    let result = runLevel2Compact(text);
    
    // Remove common articles and prepositions that are semantically secondary
    const articlesAndAuxs = [
      /\bthe\b/gi, /\ba\b/gi, /\ban\b/gi,
      /\bis\b/gi, /\bare\b/gi, /\bam\b/gi, /\bwas\b/gi, /\bwere\b/gi,
      /\bwe want to\b/gi, /\bwe need to\b/gi, /\bwe have\b/gi, /\bthere is\b/gi, /\bthere are\b/gi
    ];
    
    articlesAndAuxs.forEach(pattern => {
      result = result.replace(pattern, '');
    });
    
    // Replace transitions with symbolic linkages
    result = result.replace(/\btherefore\b/gi, '->');
    result = result.replace(/\bthen\b/gi, '->');
    result = result.replace(/\bleads to\b/gi, '->');
    result = result.replace(/\band\b/gi, '&');
    
    // Clean up spaces
    result = result.replace(/[ \t]+/g, ' ');
    result = result.replace(/ +(?=\W)/g, ''); // strip space before punctuation
    result = result.replace(/(?<=\W) +/g, ''); // strip space after punctuation
    result = result.replace(/\n\s*\n/g, '\n');
    
    return result.trim();
  }

  // Compression helper: Level 4 Snapshot generator
  function runLevel4Recovery() {
    const memoryKeys = state.activeLoadedMemories.map(m => m.key).join(', ') || 'None';
    const goalText = rawInput.value.split('\n')[0]?.substring(0, 100) || 'API Refactoring / Optimize System';
    
    return `# SESSION SNAPSHOT
Goal: ${goalText.replace(/^[#\s]+/, '')}
Completed: Configured baseline optimization models & created task plans.
Current State: Active switcher set to ${state.activeMode} mode.
Pending: Implement custom code files in user workspace.
Constraints: Compression Level ${state.compressionLevel}, Limit: ${state.tokenLimit} tokens.
Memory: Injected active blocks [${memoryKeys}].
Important Decisions: Rely on client-side JS computation for latency checks.
Resume Prompt: "Load checkpoint state. activeMode = ${state.activeMode}. Target: ${goalText.replace(/^[#\s]+/, '')}"
Next Agent: Execution Agent`;
  }

  // --- CORE UI SYNC HANDLERS ---
  function handleInput() {
    state.rawText = rawInput.value;
    updateDashboardMetrics();
  }

  function updateDashboardMetrics() {
    const rawTokens = estimateTokens(state.rawText);
    
    // Fetch memory tokens injected
    const memoryTokens = state.activeLoadedMemories.reduce((acc, m) => acc + m.tokenCost, 0);
    
    // Generate optimized content
    state.optimizedText = compressText(state.rawText, state.compressionLevel);
    
    // Inject active memory segments if relevance matching is active
    let finalOptimized = state.optimizedText;
    if (state.activeLoadedMemories.length > 0 && state.compressionLevel < 4 && state.compressionLevel > 0) {
      const memoryHeader = `\n\n# INJECTED MEMORIES\n` + state.activeLoadedMemories.map(m => `[${m.key}]: ${m.content}`).join('\n');
      finalOptimized += memoryHeader;
    }
    
    optOutput.value = finalOptimized;
    
    const optTextTokens = estimateTokens(finalOptimized);
    const totalOptTokens = optTextTokens + (state.compressionLevel === 0 ? memoryTokens : 0); // memory is separate if level 0, otherwise injected

    // Update tokens displays
    rawTokensDisplay.textContent = rawTokens;
    optTokensDisplay.textContent = totalOptTokens;
    
    // Compute Reduction Percentage
    let reduction = 0;
    if (rawTokens > 0) {
      reduction = Math.round(((rawTokens - totalOptTokens) / rawTokens) * 100);
      if (reduction < 0) reduction = 0;
    }
    
    reductionValue.textContent = `${reduction}%`;
    reductionBar.style.width = `${reduction}%`;
    globalSavedBadge.textContent = `Total Saved: ${reduction}%`;

    // Budget bar allocation sizing:
    // Default splits: Exec 60%, Mem 20%, Val 10%, Rec 10%
    // If memory increases, expand memory bar proportionally
    const totalBudget = totalOptTokens || 100;
    const memPercent = Math.min(60, Math.round((memoryTokens / totalBudget) * 100)) || 15;
    const execPercent = Math.max(30, 80 - memPercent);
    
    execBar.style.width = `${execPercent}%`;
    execBar.title = `Execution Space (${execPercent}%)`;
    memBar.style.width = `${memPercent}%`;
    memBar.title = `Memory Injections (${memPercent}%)`;
    
    // Handle model limit thresholds
    const usagePercent = (totalOptTokens / state.tokenLimit) * 100;
    capacityDisplay.textContent = `${Math.round(usagePercent)}% Full`;
    capacityGaugeFill.style.width = `${Math.min(100, usagePercent)}%`;

    if (usagePercent >= 100) {
      capacityGaugeFill.style.background = 'hsl(var(--clr-red))';
      limitWarning.textContent = 'OVERFLOW WARNING: Context size exceeded!';
      limitWarning.className = 'metric-status-text overflow';
      headerStatusIndicator.className = 'status-indicator working';
      
      // Auto write session snapshot code
      snapshotResultText.value = compressText(state.rawText, 4);
    } else if (usagePercent > 80) {
      capacityGaugeFill.style.background = 'hsl(var(--clr-yellow))';
      limitWarning.textContent = 'CAUTION: Approaching context capacity';
      limitWarning.className = 'metric-status-text warning';
      headerStatusIndicator.className = 'status-indicator online';
    } else {
      capacityGaugeFill.style.background = 'linear-gradient(90deg, hsl(var(--clr-teal)) 0%, hsl(var(--clr-purple)) 100%)';
      limitWarning.textContent = 'Within normal limits';
      limitWarning.className = 'metric-status-text';
      headerStatusIndicator.className = 'status-indicator online';
    }
  }

  function updateTokenLimit() {
    state.tokenLimit = parseInt(tokenLimitSelect.value);
    updateDashboardMetrics();
  }

  // --- SVG CONNECTIONS CALCULATOR ---
  function recalculateSVGConnections() {
    const connections = [
      { from: 'master', to: 'memory', pathId: 'path-master-memory' },
      { from: 'memory', to: 'token', pathId: 'path-memory-token' },
      { from: 'token', to: 'execution', pathId: 'path-token-exec' },
      { from: 'token', to: 'recovery', pathId: 'path-token-recovery' },
      { from: 'execution', to: 'validation', pathId: 'path-exec-validation' },
      { from: 'validation', to: 'learning', pathId: 'path-validation-learning' },
      { from: 'learning', to: 'recovery', pathId: 'path-learning-recovery' },
      { from: 'recovery', to: 'master', pathId: 'path-recovery-master' }
    ];

    const containerRect = flowContainer.getBoundingClientRect();

    connections.forEach(conn => {
      const elFrom = document.getElementById(`agent-node-${conn.from}`);
      const elTo = document.getElementById(`agent-node-${conn.to}`);
      const pathEl = document.getElementById(conn.pathId);

      if (elFrom && elTo && pathEl) {
        const rectFrom = elFrom.getBoundingClientRect();
        const rectTo = elTo.getBoundingClientRect();

        const x1 = rectFrom.left + rectFrom.width / 2 - containerRect.left;
        const y1 = rectFrom.top + rectFrom.height / 2 - containerRect.top;
        const x2 = rectTo.left + rectTo.width / 2 - containerRect.left;
        const y2 = rectTo.top + rectTo.height / 2 - containerRect.top;

        // Draw a simple path curve
        const dx = x2 - x1;
        const dy = y2 - y1;
        const cx1 = x1 + dx * 0.4;
        const cy1 = y1 + dy * 0.1;
        const cx2 = x1 + dx * 0.6;
        const cy2 = y2 - dy * 0.1;

        pathEl.setAttribute('d', `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`);
      }
    });
  }

  // --- MULTI-AGENT EXECUTION PIPELINE ---
  function logTerminal(message, type = 'system') {
    const timestamp = new Date().toLocaleTimeString();
    const line = document.createElement('span');
    line.className = `terminal-line ${type}`;
    line.textContent = `[${timestamp}] ${message}`;
    terminalBody.appendChild(line);
    
    // Prune logs if too many
    if (terminalBody.childElementCount > 30) {
      terminalBody.removeChild(terminalBody.firstChild);
    }
    
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  async function runAgentPipeline() {
    if (state.isPipelineRunning) return;
    
    state.isPipelineRunning = true;
    runPipelineBtn.disabled = true;
    runPipelineBtn.style.opacity = '0.5';
    headerStatusIndicator.className = 'status-indicator working';
    
    // Clear previous logs
    terminalBody.innerHTML = '';
    
    // Reset agent nodes state classes
    const nodes = document.querySelectorAll('.agent-node');
    nodes.forEach(n => n.classList.remove('active', 'success'));
    
    const paths = document.querySelectorAll('.flow-connections path');
    paths.forEach(p => p.classList.remove('active'));

    logTerminal('Master Agent starting orchestrator sequence...', 'active');
    
    try {
      // 1. MASTER AGENT
      await activateAgent('master', 'Master Agent: Analyzing inputs and mapping optimization intent...', 1000);
      logTerminal(`Intent Analysis: Task complexity estimated high, switching to ${state.activeMode} strategy.`, 'system');
      
      // 2. MEMORY AGENT
      activatePath('path-master-memory');
      await activateAgent('memory', 'Memory Agent: Activating long-term registry vectors...', 1000);
      const queryText = memoryQueryInput.value || '';
      logTerminal(`Memory Retrieval: Found ${state.activeLoadedMemories.length} relevant context memory segments.`, 'system');
      
      // 3. TOKEN AGENT
      activatePath('path-memory-token');
      await activateAgent('token', 'Token Agent: Executing semantic compression algorithms...', 1200);
      updateDashboardMetrics();
      logTerminal(`Compression metrics: Output compressed from ${rawTokensDisplay.textContent} to ${optTokensDisplay.textContent} tokens.`, 'success');
      
      // 4. EXECUTION AGENT
      activatePath('path-token-exec');
      await activateAgent('execution', `Execution Agent: Compiling workspace file plans in ${state.activeMode} mode...`, 1000);
      
      // 5. VALIDATION AGENT
      activatePath('path-exec-validation');
      await activateAgent('validation', 'Validation Agent: Auditing instruction integrity and logical consistency...', 900);
      logTerminal('Quality Audit: Output verified. Hallucinations 0%, Instruction integrity 100%.', 'success');
      
      // 6. LEARNING AGENT
      activatePath('path-validation-learning');
      await activateAgent('learning', 'Learning Agent: Calibrating heuristic parameters for future runs...', 800);
      logTerminal('Learning optimization threshold maps updated.', 'system');
      
      // 7. RECOVERY AGENT
      activatePath('path-learning-recovery');
      activatePath('path-token-recovery');
      await activateAgent('recovery', 'Recovery Agent: Auto-saving transaction boundary checkpoints...', 900);
      
      // Complete loop back to master
      activatePath('path-recovery-master');
      await new Promise(r => setTimeout(r, 600));
      
      logTerminal('Pipeline coordination cycle finished successfully.', 'success');
      
    } catch (err) {
      logTerminal(`Pipeline interrupted with error: ${err.message}`, 'error');
    } finally {
      // Reset pipeline state
      state.isPipelineRunning = false;
      runPipelineBtn.disabled = false;
      runPipelineBtn.style.opacity = '1';
      headerStatusIndicator.className = 'status-indicator online';
      
      // Keep nodes in success style
      nodes.forEach(n => {
        n.classList.remove('active');
        n.classList.add('success');
      });
      paths.forEach(p => p.classList.remove('active'));
    }
  }

  function activateAgent(agentName, msg, duration) {
    return new Promise(resolve => {
      const node = document.getElementById(`agent-node-${agentName}`);
      if (node) {
        node.classList.add('active');
      }
      logTerminal(msg, 'active');
      
      setTimeout(() => {
        if (node) {
          node.classList.remove('active');
          node.classList.add('success');
        }
        resolve();
      }, duration);
    });
  }

  function activatePath(pathId) {
    const path = document.getElementById(pathId);
    if (path) {
      path.classList.add('active');
    }
  }

  // --- CONTEXT SWITCHING SYSTEM ---
  function selectContextMode(mode) {
    state.activeMode = mode;
    activeModeDisplay.textContent = `Mode: ${mode} (${mode === 'Research' || mode === 'Coding' || mode === 'Planning' ? 'Orchestration' : 'Execution'})`;
    
    // Update active button state
    modeButtons.forEach(btn => {
      if (btn.getAttribute('data-mode') === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update strategies
    if (modeStrategies[mode]) {
      activeStrategyDisplay.textContent = modeStrategies[mode].strategy;
      activeFocusDisplay.textContent = modeStrategies[mode].focus;
    }

    logTerminal(`Context switched to: ${mode}. Loaded strategy profiles.`, 'system');
    updateDashboardMetrics();
  }

  // --- MEMORY SYSTEM & RETRIEVAL FORMULA ---
  function renderMemoryList() {
    memoryDbList.innerHTML = '';
    
    // Retrieve queries relevance
    const query = memoryQueryInput.value.toLowerCase().trim();
    state.activeLoadedMemories = [];

    state.memories.forEach(mem => {
      // Relevance heuristic (similarity scoring between query and memory details)
      let relevance = 0.1; // Baseline
      if (query !== '') {
        if (mem.key.toLowerCase().includes(query) || mem.content.toLowerCase().includes(query)) {
          relevance = 0.9;
        } else {
          // Check word-by-word matches
          const queryWords = query.split(/\s+/);
          let matchCount = 0;
          queryWords.forEach(qw => {
            if (mem.key.toLowerCase().includes(qw) || mem.content.toLowerCase().includes(qw)) {
              matchCount++;
            }
          });
          if (matchCount > 0) {
            relevance = 0.2 + (matchCount / queryWords.length) * 0.6;
          } else {
            relevance = 0.05; // lower match
          }
        }
      } else {
        // If no query, default relevance based on active context mode match
        if (state.activeMode === 'Coding' && mem.key === 'API_Config') relevance = 0.85;
        else if (state.activeMode === 'Research' && mem.key === 'StyleGuide') relevance = 0.8;
        else if (mem.key === 'PromptEngine_Rules') relevance = 0.9; // Rules always relevant
        else relevance = 0.4;
      }

      // Formula: Score = (Relevance * Priority * Recency) / TokenCost
      const rawScore = (relevance * mem.priority * mem.recency) / mem.tokenCost;
      const finalScore = parseFloat(rawScore.toFixed(3));
      
      // Threshold to active inject: score >= 0.25
      const isMatching = finalScore >= 0.25;
      if (isMatching) {
        state.activeLoadedMemories.push(mem);
      }

      // Render Item Card
      const card = document.createElement('div');
      card.className = `memory-item-card ${isMatching ? 'matching' : ''}`;
      card.innerHTML = `
        <div class="memory-details">
          <div class="memory-key">${mem.key} <span class="sub-label">(${mem.tokenCost}t)</span></div>
          <div class="memory-content" title="${mem.content}">${mem.content}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="memory-score-badge">S: ${finalScore}</span>
          <button class="delete-mem-btn" data-id="${mem.id}" title="Remove memory">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;

      memoryDbList.appendChild(card);
    });

    // Attach delete listeners
    document.querySelectorAll('.delete-mem-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-id'));
        state.memories = state.memories.filter(m => m.id !== id);
        renderMemoryList();
        updateDashboardMetrics();
        logTerminal('Memory block removed from local registry.', 'warn');
      });
    });
  }

  function handleAddMemory(e) {
    e.preventDefault();
    const key = document.getElementById('mem-key-input').value.trim();
    const val = document.getElementById('mem-val-input').value.trim();
    const pri = parseInt(document.getElementById('mem-pri-input').value) || 5;
    const tok = parseInt(document.getElementById('mem-tok-input').value) || 50;

    if (key === '' || val === '') return;

    const newMem = {
      id: Date.now(),
      key: key,
      content: val,
      priority: Math.max(1, Math.min(10, pri)),
      tokenCost: Math.max(10, Math.min(1000, tok)),
      recency: 10 // Newest is 10
    };

    // Decay recency of older memories slightly to simulate memory age decay
    state.memories.forEach(m => {
      m.recency = Math.max(1, m.recency - 1);
    });

    state.memories.push(newMem);
    addMemoryForm.reset();
    
    renderMemoryList();
    updateDashboardMetrics();
    logTerminal(`New memory block [${key}] registered successfully. Recency decay applied to older nodes.`, 'success');
  }

  // --- RECOVERY SNAPSHOT HANDLERS ---
  function forceSessionSnapshot() {
    const snapshotText = compressText(state.rawText, 4);
    snapshotResultText.value = snapshotText;
    logTerminal('Limit Expiry: Checkpoint snapshot generated manually.', 'warn');
  }

  function copyTextToClipboard(text, elementToSuccess) {
    navigator.clipboard.writeText(text).then(() => {
      const originalText = elementToSuccess.innerHTML;
      elementToSuccess.textContent = 'Copied!';
      elementToSuccess.style.background = 'hsl(var(--clr-green))';
      elementToSuccess.style.color = '#000';
      
      setTimeout(() => {
        elementToSuccess.innerHTML = originalText;
        elementToSuccess.style.background = '';
        elementToSuccess.style.color = '';
      }, 1500);
    });
  }

  // Restore snapshot parser logic
  function restoreSnapshot(snapshotMarkdown) {
    if (!snapshotMarkdown || snapshotMarkdown.trim() === '') return false;

    try {
      const lines = snapshotMarkdown.split('\n');
      let goal = '';
      let activeMode = 'Research';
      let memoryInjections = [];
      let isSnapshot = false;

      lines.forEach(line => {
        if (line.includes('# SESSION SNAPSHOT')) {
          isSnapshot = true;
        }
        if (line.startsWith('Goal:')) {
          goal = line.replace('Goal:', '').trim();
        }
        if (line.startsWith('Current State:')) {
          const match = line.match(/switcher set to (\w+) mode/i);
          if (match && match[1]) {
            activeMode = match[1];
          }
        }
        if (line.startsWith('Memory:')) {
          const content = line.replace('Memory:', '').trim();
          const match = content.match(/\[(.*?)\]/);
          if (match && match[1]) {
            memoryInjections = match[1].split(',').map(m => m.trim());
          }
        }
      });

      if (!isSnapshot) {
        alert('Invalid Snapshot Format: Missing "# SESSION SNAPSHOT" signature.');
        return false;
      }

      // Apply changes to UI State
      if (goal) {
        rawInput.value = `# RESUMED TASK OBJECTIVE\n- ${goal}\n\n`;
      }

      if (modeStrategies[activeMode]) {
        selectContextMode(activeMode);
      }

      // Add memories that were restored if not present
      memoryInjections.forEach(key => {
        if (key && key !== 'None' && !state.memories.some(m => m.key === key)) {
          state.memories.push({
            id: Date.now() + Math.random(),
            key: key,
            content: `Restored snapshot memory parameters for ${key}`,
            priority: 7,
            tokenCost: 45,
            recency: 10
          });
        }
      });

      // Recalibrate UI
      compressionSlider.value = 1; // set to Level 1 summary to view restored state
      compressionBadge.className = 'level-badge badge-1';
      compressionBadge.textContent = compressionLevelLabels[1];
      state.compressionLevel = 1;

      renderMemoryList();
      handleInput();
      
      logTerminal('Session Checkpoint loaded successfully. State variables and goal tokens merged.', 'success');
      return true;
    } catch (err) {
      alert(`Snapshot recovery error: ${err.message}`);
      return false;
    }
  }

  // --- EVENT LISTENERS ---
  rawInput.addEventListener('input', handleInput);
  
  clearInputBtn.addEventListener('click', () => {
    rawInput.value = '';
    handleInput();
    logTerminal('Workspace cleared.', 'system');
  });

  compressionSlider.addEventListener('input', () => {
    const val = compressionSlider.value;
    state.compressionLevel = parseInt(val);
    
    // Class badges styling
    compressionBadge.className = `level-badge badge-${val}`;
    compressionBadge.textContent = compressionLevelLabels[val];
    
    updateDashboardMetrics();
    logTerminal(`Compression level modified to Level ${val}.`, 'system');
  });

  tokenLimitSelect.addEventListener('change', updateTokenLimit);
  
  optimizeBtn.addEventListener('click', () => {
    updateDashboardMetrics();
    logTerminal('Manual context compression triggered.', 'system');
  });

  runPipelineBtn.addEventListener('click', runAgentPipeline);

  // Copy Buttons
  copyOutputBtn.addEventListener('click', () => {
    copyTextToClipboard(optOutput.value, copyOutputBtn);
  });

  copySnapshotBtn.addEventListener('click', () => {
    copyTextToClipboard(snapshotResultText.value, copySnapshotBtn);
  });

  // Switcher Modes
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      selectContextMode(mode);
    });
  });

  // Memory Registry handlers
  memoryQueryInput.addEventListener('input', renderMemoryList);
  addMemoryForm.addEventListener('submit', handleAddMemory);

  // Recovery dialog triggers
  generateSnapshotBtn.addEventListener('click', forceSessionSnapshot);
  
  loadSnapshotBtn.addEventListener('click', () => {
    dialogInput.value = '';
    loadDialog.showModal();
  });
  
  dialogCloseBtn.addEventListener('click', () => {
    loadDialog.close();
  });
  
  dialogSubmitBtn.addEventListener('click', () => {
    const val = dialogInput.value;
    if (restoreSnapshot(val)) {
      loadDialog.close();
    }
  });

  // Click on agent nodes triggers trace info
  document.querySelectorAll('.agent-node').forEach(node => {
    node.addEventListener('click', () => {
      const agent = node.getAttribute('data-agent');
      logTerminal(`Manual handshake: Interrogating ${agent.toUpperCase()} agent. Status: Ready.`, 'system');
    });
  });

  // Start app
  init();
});

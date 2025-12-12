import { APIMetadata, SelectionOptions } from '../types/api.types';
import { APIRegistry } from '../registry/APIRegistry';
import { InsufficientAPIsError } from '../errors/CustomErrors';
import { logger } from '../utils/errorLogger';
import * as ollamaClient from '../modules/idea-generator/ollamaClient';

/**
 * Intelligent API Selector that selects APIs based on problem statements
 * using advanced semantic analysis and dynamic scoring
 */
export class IntelligentAPISelector {
  private registry: APIRegistry;

  // Enhanced semantic analysis with broader vocabulary and context understanding
  private readonly semanticPatterns = {
    // Core functionality patterns
    dataStorage: ['store', 'save', 'database', 'persist', 'record', 'archive', 'backup'],
    dataRetrieval: ['get', 'fetch', 'retrieve', 'load', 'search', 'find', 'query', 'lookup'],
    userInterface: ['display', 'show', 'interface', 'ui', 'frontend', 'visual', 'design', 'layout'],
    communication: ['send', 'message', 'notify', 'alert', 'communicate', 'share', 'broadcast'],
    analysis: ['analyze', 'process', 'calculate', 'compute', 'evaluate', 'measure', 'track'],
    automation: ['automate', 'schedule', 'trigger', 'workflow', 'batch', 'process'],
    
    // Domain-specific patterns with expanded vocabulary
    location: ['location', 'place', 'address', 'coordinates', 'gps', 'map', 'navigation', 'route', 'directions', 'nearby', 'distance', 'travel', 'journey', 'destination'],
    weather: ['weather', 'temperature', 'climate', 'forecast', 'rain', 'snow', 'sunny', 'cloudy', 'humidity', 'wind', 'storm', 'seasonal', 'outdoor', 'atmospheric'],
    music: ['music', 'song', 'audio', 'sound', 'playlist', 'artist', 'album', 'streaming', 'melody', 'rhythm', 'beat', 'tune', 'soundtrack', 'listening'],
    social: ['social', 'community', 'network', 'friends', 'followers', 'sharing', 'posts', 'comments', 'likes', 'profile', 'feed', 'timeline'],
    finance: ['money', 'payment', 'currency', 'price', 'cost', 'budget', 'financial', 'banking', 'transaction', 'investment', 'trading', 'crypto', 'stock'],
    health: ['health', 'fitness', 'exercise', 'workout', 'medical', 'wellness', 'nutrition', 'diet', 'calories', 'steps', 'heart rate', 'activity'],
    education: ['learn', 'education', 'study', 'knowledge', 'course', 'lesson', 'tutorial', 'training', 'skill', 'academic', 'research'],
    entertainment: ['entertainment', 'fun', 'game', 'movie', 'video', 'show', 'comedy', 'humor', 'leisure', 'recreation', 'amusement'],
    productivity: ['productivity', 'task', 'todo', 'organize', 'manage', 'schedule', 'calendar', 'reminder', 'efficiency', 'workflow'],
    food: ['food', 'recipe', 'cooking', 'meal', 'restaurant', 'cuisine', 'ingredient', 'nutrition', 'diet', 'eating', 'dining'],
    
    // Application types
    mobile: ['mobile', 'app', 'smartphone', 'android', 'ios', 'phone', 'device'],
    web: ['web', 'website', 'browser', 'online', 'internet', 'portal', 'platform'],
    desktop: ['desktop', 'computer', 'pc', 'software', 'application', 'program'],
    
    // User actions and behaviors
    tracking: ['track', 'monitor', 'follow', 'observe', 'watch', 'record', 'log'],
    sharing: ['share', 'distribute', 'publish', 'broadcast', 'spread', 'disseminate'],
    creating: ['create', 'make', 'build', 'generate', 'produce', 'develop', 'design'],
    managing: ['manage', 'organize', 'control', 'handle', 'administer', 'coordinate'],
    
    // Technology and features
    realtime: ['realtime', 'live', 'instant', 'immediate', 'streaming', 'dynamic'],
    offline: ['offline', 'cached', 'local', 'stored', 'synchronized'],
    collaborative: ['collaborative', 'team', 'group', 'shared', 'cooperative', 'together'],
    personalized: ['personalized', 'custom', 'tailored', 'individual', 'specific', 'adaptive']
  };

  constructor(registry: APIRegistry) {
    this.registry = registry;
  }

  /**
   * Determine the optimal number of APIs needed based on problem complexity and requirements
   * @param problemStatement - The user's problem description
   * @returns Optimal number of APIs (1-6)
   */
  private determineOptimalAPICount(problemStatement: string): number {
    const normalized = problemStatement.toLowerCase();
    const words = normalized.split(/\s+/);
    
    // Start with base count of 1
    let optimalCount = 1;
    
    // Analyze problem complexity indicators
    const complexityIndicators = {
      // Simple problems (1-2 APIs)
      simple: ['simple', 'basic', 'quick', 'easy', 'minimal', 'just need'],
      
      // Medium complexity (2-3 APIs)  
      medium: ['track', 'manage', 'organize', 'display', 'show', 'connect'],
      
      // Complex problems (3-4 APIs)
      complex: ['integrate', 'combine', 'comprehensive', 'full-featured', 'advanced', 'complete'],
      
      // Enterprise level (4-6 APIs)
      enterprise: ['enterprise', 'business', 'professional', 'dashboard', 'analytics', 'workflow', 'automation']
    };
    
    // Count functional requirements
    const functionalRequirements = [
      'authentication', 'user management', 'data storage', 'real-time', 'notifications',
      'social features', 'location services', 'payment', 'analytics', 'reporting',
      'search', 'recommendations', 'messaging', 'file upload', 'export'
    ];
    
    const requiredFunctions = functionalRequirements.filter(func => 
      normalized.includes(func) || normalized.includes(func.replace(' ', ''))
    ).length;
    
    // Count domain areas mentioned
    const domainAreas = [
      'weather', 'music', 'maps', 'social', 'finance', 'health', 'food', 'news',
      'sports', 'entertainment', 'productivity', 'education', 'travel', 'gaming'
    ];
    
    const mentionedDomains = domainAreas.filter(domain => normalized.includes(domain)).length;
    
    // Count integration keywords
    const integrationKeywords = ['combine', 'integrate', 'connect', 'sync', 'merge', 'unify'];
    const integrationMentions = integrationKeywords.filter(keyword => normalized.includes(keyword)).length;
    
    // Check for special combination patterns FIRST (highest priority)
    const combinationPatterns = [
      /music.*fitness|fitness.*music/i,
      /(music|audio|sound).*(track|fitness|health|exercise)/i,
      /(track|fitness|health|exercise).*(music|audio|sound)/i,
      /.*based on.*(music|fitness|health|weather|location)/i,
      /social.*food|food.*social/i,
      /weather.*location|location.*weather/i,
      /finance.*data|data.*finance/i
    ];
    
    const matchedPattern = combinationPatterns.find(pattern => pattern.test(normalized));
    
    if (matchedPattern) {
      // Force at least 2 APIs for combination requests
      optimalCount = Math.max(2, mentionedDomains);
      
      // Early return to prevent other logic from overriding this
      optimalCount = Math.max(1, Math.min(6, optimalCount));
      
      return optimalCount;
    }
    
    // Regular complexity determination for non-combination requests
    if (complexityIndicators.simple.some(indicator => normalized.includes(indicator))) {
      optimalCount = Math.max(1, Math.min(2, mentionedDomains));
    } else if (complexityIndicators.enterprise.some(indicator => normalized.includes(indicator))) {
      optimalCount = Math.max(3, Math.min(6, mentionedDomains + requiredFunctions));
    } else if (complexityIndicators.complex.some(indicator => normalized.includes(indicator))) {
      optimalCount = Math.max(2, Math.min(4, mentionedDomains + Math.floor(requiredFunctions / 2)));
    } else {
      // Medium complexity (default)
      optimalCount = Math.max(2, Math.min(3, mentionedDomains || 2));
    }
    
    // Adjust based on specific patterns
    
    // Single domain focus = fewer APIs
    if (mentionedDomains === 1 && requiredFunctions <= 2 && integrationMentions === 0) {
      optimalCount = Math.min(optimalCount, 2);
    }
    
    // Multiple domains = ensure we have enough APIs to cover them
    if (mentionedDomains >= 2) {
      optimalCount = Math.max(optimalCount, mentionedDomains);
    }
    
    // Integration focus or combination words = more APIs
    if (integrationMentions > 0 || normalized.includes('based on') || normalized.includes('combined with') || normalized.includes('using')) {
      optimalCount = Math.max(optimalCount, Math.min(mentionedDomains + 1, 4));
    }
    
    // Length-based adjustment (longer descriptions often need more APIs)
    if (words.length > 50) {
      optimalCount = Math.min(optimalCount + 1, 6);
    } else if (words.length < 10) {
      optimalCount = Math.max(optimalCount - 1, 1);
    }
    
    // Ensure reasonable bounds
    optimalCount = Math.max(1, Math.min(6, optimalCount));
    
    logger.logInfo('Determined optimal API count', {
      problemLength: words.length,
      mentionedDomains,
      requiredFunctions,
      integrationMentions,
      optimalCount
    });
    
    return optimalCount;
  }

  /**
   * Intelligently select APIs based on a problem statement with dynamic count determination
   * @param problemStatement - The user's problem or project description
   * @param count - Number of APIs to select (optional - will be determined automatically if not provided)
   * @param options - Additional selection options
   * @returns Array of selected API metadata
   */
  selectAPIsForProblem(
    problemStatement: string, 
    count?: number, 
    options?: SelectionOptions
  ): APIMetadata[] {
    // Determine optimal API count if not specified
    const optimalCount = count || this.determineOptimalAPICount(problemStatement);
    
    logger.logInfo('Starting intelligent API selection', { 
      problemStatement: problemStatement.substring(0, 100) + '...',
      requestedCount: count,
      optimalCount 
    });

    // Get all available APIs
    let availableAPIs = this.registry.getAllAPIs();

    // Apply basic filters
    availableAPIs = this.applyBasicFilters(availableAPIs, options);

    if (availableAPIs.length < optimalCount) {
      throw new InsufficientAPIsError(optimalCount, availableAPIs.length);
    }

    // Analyze the problem statement and score APIs
    const scoredAPIs = this.scoreAPIsForProblem(problemStatement, availableAPIs);

    // Select the top-scoring APIs ensuring diversity and domain coverage
    const selectedAPIs = this.selectDiverseAPIs(scoredAPIs, optimalCount, problemStatement);

    logger.logInfo('Intelligent API selection completed', {
      selectedAPIs: selectedAPIs.map(api => ({ id: api.id, name: api.name, category: api.category }))
    });

    return selectedAPIs;
  }

  /**
   * Advanced semantic scoring that analyzes problem context and API relevance
   */
  private scoreAPIsForProblem(problemStatement: string, apis: APIMetadata[]): Array<{ api: APIMetadata; score: number }> {
    const normalizedProblem = problemStatement.toLowerCase();
    const problemWords = this.extractMeaningfulWords(normalizedProblem);
    const problemContext = this.analyzeContext(normalizedProblem);
    const requiredDomains = this.extractRequiredDomains(normalizedProblem);
    
    return apis.map(api => {
      let score = 0;
      const apiText = `${api.name} ${api.description}`.toLowerCase();

      // 1. Domain Requirement Matching (35% of score) - NEW: Higher priority for required domains
      score += this.calculateDomainRequirementScore(requiredDomains, api) * 0.35;

      // 2. Semantic Pattern Matching (25% of score) - Reduced from 40%
      score += this.calculateSemanticScore(normalizedProblem, api) * 0.25;

      // 3. Direct Word Relevance (20% of score) - Reduced from 25%
      score += this.calculateWordRelevance(problemWords, apiText) * 0.2;

      // 4. Context Compatibility (15% of score) - Reduced from 20%
      score += this.calculateContextScore(problemContext, api) * 0.15;

      // 5. API Characteristics (5% of score) - Reduced from 10%
      score += this.calculateCharacteristicsScore(api) * 0.05;

      return { api, score: Math.round(score * 100) / 100 };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Extract meaningful words from problem statement
   */
  private extractMeaningfulWords(text: string): string[] {
    const stopWords = new Set(['i', 'want', 'to', 'build', 'create', 'make', 'develop', 'design', 'a', 'an', 'the', 'that', 'with', 'for', 'and', 'or', 'but', 'in', 'on', 'at', 'by']);
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .map(word => word.toLowerCase());
  }

  /**
   * Extract required domains from problem statement with enhanced detection
   */
  private extractRequiredDomains(problemStatement: string): string[] {
    const requiredDomains: string[] = [];
    
    // Enhanced domain detection with synonyms and related terms
    const domainDetectionMap = {
      music: ['music', 'song', 'audio', 'sound', 'playlist', 'artist', 'album', 'streaming', 'melody', 'rhythm', 'beat', 'tune', 'soundtrack', 'listening', 'spotify', 'deezer', 'soundcloud'],
      fitness: ['fitness', 'exercise', 'workout', 'health', 'activity', 'steps', 'calories', 'heart rate', 'training', 'gym', 'running', 'cycling', 'sports', 'fitbit', 'strava', 'tracking', 'track'],
      weather: ['weather', 'temperature', 'climate', 'forecast', 'rain', 'snow', 'sunny', 'cloudy', 'humidity', 'wind', 'storm', 'seasonal', 'outdoor', 'atmospheric'],
      maps: ['location', 'place', 'address', 'coordinates', 'gps', 'map', 'navigation', 'route', 'directions', 'nearby', 'distance', 'travel', 'journey', 'destination', 'google maps'],
      social: ['social', 'community', 'network', 'friends', 'followers', 'sharing', 'posts', 'comments', 'likes', 'profile', 'feed', 'timeline', 'facebook', 'twitter', 'instagram'],
      finance: ['money', 'payment', 'currency', 'price', 'cost', 'budget', 'financial', 'banking', 'transaction', 'investment', 'trading', 'crypto', 'stock', 'paypal', 'stripe'],
      food: ['food', 'recipe', 'cooking', 'meal', 'restaurant', 'cuisine', 'ingredient', 'nutrition', 'diet', 'eating', 'dining', 'spoonacular', 'zomato', 'yelp'],
      news: ['news', 'article', 'media', 'press', 'journalism', 'current events', 'breaking news', 'headlines', 'newspaper', 'magazine'],
      entertainment: ['entertainment', 'fun', 'game', 'movie', 'video', 'show', 'comedy', 'humor', 'leisure', 'recreation', 'amusement', 'netflix', 'youtube'],
      productivity: ['productivity', 'task', 'todo', 'organize', 'manage', 'schedule', 'calendar', 'reminder', 'efficiency', 'workflow', 'project management'],
      education: ['learn', 'education', 'study', 'knowledge', 'course', 'lesson', 'tutorial', 'training', 'skill', 'academic', 'research', 'teaching'],
      gaming: ['game', 'gaming', 'player', 'score', 'leaderboard', 'achievement', 'multiplayer', 'esports', 'steam', 'xbox', 'playstation'],
      communication: ['message', 'chat', 'email', 'notification', 'alert', 'communication', 'messaging', 'sms', 'whatsapp', 'telegram'],
      data: ['data', 'analytics', 'statistics', 'metrics', 'insights', 'reporting', 'dashboard', 'visualization', 'charts', 'graphs']
    };
    
    // Check for each domain
    for (const [domain, keywords] of Object.entries(domainDetectionMap)) {
      const matchCount = keywords.filter(keyword => problemStatement.toLowerCase().includes(keyword)).length;
      if (matchCount > 0) {
        requiredDomains.push(domain);
      }
    }
    
    // Additional specific checks for common combinations
    if (problemStatement.toLowerCase().includes('fitness tracking') || 
        problemStatement.toLowerCase().includes('track fitness') ||
        problemStatement.toLowerCase().includes('fitness app')) {
      if (!requiredDomains.includes('fitness')) {
        requiredDomains.push('fitness');
      }
    }
    
    // Special combination detection - more comprehensive patterns
    const combinationPatterns = [
      { pattern: /(music|audio|sound).*(fitness|exercise|workout|health|track)/i, domains: ['music', 'fitness'] },
      { pattern: /(fitness|exercise|workout|track).*(music|audio|sound)/i, domains: ['music', 'fitness'] },
      { pattern: /(fitness|health|exercise|workout).*track/i, domains: ['fitness'] },
      { pattern: /track.*(fitness|health|exercise|workout)/i, domains: ['fitness'] },
      { pattern: /(social|community).*(food|recipe|restaurant)/i, domains: ['social', 'food'] },
      { pattern: /(weather|climate).*(location|map|travel)/i, domains: ['weather', 'maps'] },
      { pattern: /(finance|money|payment).*(data|analytics)/i, domains: ['finance', 'data'] },
      { pattern: /(news|media).*(social|sharing)/i, domains: ['news', 'social'] }
    ];
    
    for (const { pattern, domains } of combinationPatterns) {
      if (pattern.test(problemStatement)) {
        domains.forEach(domain => {
          if (!requiredDomains.includes(domain)) {
            requiredDomains.push(domain);
          }
        });
      }
    }
    

    
    return requiredDomains;
  }

  /**
   * Calculate domain requirement score - ensures required domains are prioritized
   */
  private calculateDomainRequirementScore(requiredDomains: string[], api: APIMetadata): number {
    if (requiredDomains.length === 0) {
      return 50; // Neutral score if no specific domains required
    }
    
    let score = 0;
    const apiCategory = api.category.toLowerCase();
    const apiName = api.name.toLowerCase();
    const apiDescription = api.description.toLowerCase();
    
    // Direct category match gets highest score
    if (requiredDomains.includes(apiCategory)) {
      score += 100;
    }
    
    // Check for domain matches in API name and description
    for (const domain of requiredDomains) {
      if (apiName.includes(domain) || apiDescription.includes(domain)) {
        score += 80;
      }
      
      // Special mappings for API categories to domains
      const categoryMappings: { [key: string]: string[] } = {
        'sports': ['fitness', 'health'],
        'health': ['fitness', 'health'],
        'entertainment': ['gaming', 'fun'],
        'productivity': ['task', 'organize'],
        'communication': ['message', 'social'],
        'utilities': ['data', 'productivity']
      };
      
      if (categoryMappings[apiCategory]?.includes(domain)) {
        score += 70;
      }
    }
    
    // Penalty for APIs that don't match any required domain
    const hasAnyMatch = requiredDomains.some(domain => 
      apiCategory.includes(domain) || 
      apiName.includes(domain) || 
      apiDescription.includes(domain)
    );
    
    if (!hasAnyMatch) {
      score = Math.max(score - 50, 0); // Significant penalty but not zero
    }
    
    return score;
  }

  /**
   * Analyze the context and intent of the problem statement
   */
  private analyzeContext(problemStatement: string): {
    appType: string[];
    primaryFunctions: string[];
    userNeeds: string[];
    technicalRequirements: string[];
  } {
    const context = {
      appType: [] as string[],
      primaryFunctions: [] as string[],
      userNeeds: [] as string[],
      technicalRequirements: [] as string[]
    };

    // Detect application type
    if (/mobile|app|smartphone|android|ios/.test(problemStatement)) {
      context.appType.push('mobile');
    }
    if (/web|website|browser|online/.test(problemStatement)) {
      context.appType.push('web');
    }
    if (/desktop|computer|software/.test(problemStatement)) {
      context.appType.push('desktop');
    }

    // Detect primary functions
    for (const [pattern, keywords] of Object.entries(this.semanticPatterns)) {
      if (keywords.some(keyword => problemStatement.includes(keyword))) {
        context.primaryFunctions.push(pattern);
      }
    }

    return context;
  }

  /**
   * Calculate semantic relevance score
   */
  private calculateSemanticScore(problemStatement: string, api: APIMetadata): number {
    let score = 0;
    const apiText = `${api.name} ${api.description} ${api.category}`.toLowerCase();

    // Check semantic pattern matches
    for (const [, keywords] of Object.entries(this.semanticPatterns)) {
      const problemMatches = keywords.filter(keyword => problemStatement.includes(keyword)).length;
      const apiMatches = keywords.filter(keyword => apiText.includes(keyword)).length;
      
      if (problemMatches > 0 && apiMatches > 0) {
        // Score based on strength of match
        score += (problemMatches * apiMatches) * 10;
      }
    }

    return score;
  }

  /**
   * Calculate word relevance score
   */
  private calculateWordRelevance(problemWords: string[], apiText: string): number {
    let score = 0;
    const apiWords = apiText.split(/\s+/);

    for (const problemWord of problemWords) {
      // Exact match
      if (apiWords.includes(problemWord)) {
        score += 15;
      }
      // Partial match (substring)
      else if (apiText.includes(problemWord)) {
        score += 8;
      }
      // Similar words (basic similarity)
      else {
        for (const apiWord of apiWords) {
          if (this.calculateWordSimilarity(problemWord, apiWord) > 0.7) {
            score += 5;
          }
        }
      }
    }

    return score;
  }

  /**
   * Calculate context compatibility score
   */
  private calculateContextScore(context: any, api: APIMetadata): number {
    let score = 0;

    // Bonus for APIs that match detected functions
    if (context.primaryFunctions.includes('location') && api.category === 'maps') score += 20;
    if (context.primaryFunctions.includes('weather') && api.category === 'weather') score += 20;
    if (context.primaryFunctions.includes('music') && api.category === 'music') score += 20;
    if (context.primaryFunctions.includes('social') && api.category === 'social') score += 20;
    if (context.primaryFunctions.includes('finance') && api.category === 'finance') score += 20;
    if (context.primaryFunctions.includes('health') && (api.category === 'sports' || api.name.toLowerCase().includes('health'))) score += 20;

    // Bonus for web-compatible APIs if web app detected
    if (context.appType.includes('web') && api.corsCompatible) {
      score += 10;
    }

    return score;
  }

  /**
   * Calculate API characteristics score
   */
  private calculateCharacteristicsScore(api: APIMetadata): number {
    let score = 0;

    // Prefer CORS-compatible APIs for web development
    if (api.corsCompatible) score += 5;

    // Prefer APIs without authentication for easier implementation
    if (api.authType === 'none') score += 8;
    else if (api.authType === 'apikey') score += 3;

    // Bonus for well-documented APIs
    if (api.documentationUrl && api.documentationUrl.length > 0) score += 2;

    return score;
  }



  /**
   * Calculate basic word similarity (Levenshtein-based)
   */
  private calculateWordSimilarity(word1: string, word2: string): number {
    if (word1.length < 3 || word2.length < 3) return 0;
    
    const maxLength = Math.max(word1.length, word2.length);
    const distance = this.levenshteinDistance(word1, word2);
    return (maxLength - distance) / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Select diverse APIs from scored list, ensuring required domains are covered and different categories
   */
  private selectDiverseAPIs(
    scoredAPIs: Array<{ api: APIMetadata; score: number }>, 
    count: number,
    problemStatement?: string
  ): APIMetadata[] {
    const selectedAPIs: APIMetadata[] = [];
    const usedCategories = new Set<string>();
    const requiredDomains = problemStatement ? this.extractRequiredDomains(problemStatement) : [];
    const coveredDomains = new Set<string>();

    // First pass: prioritize APIs that cover required domains
    if (requiredDomains.length > 0) {
      for (const { api, score } of scoredAPIs) {
        if (selectedAPIs.length >= count) break;
        
        const apiCategory = api.category.toLowerCase();
        const apiName = api.name.toLowerCase();
        const apiDescription = api.description.toLowerCase();
        
        // Check if this API covers a required domain we haven't covered yet
        const coversRequiredDomain = requiredDomains.some(domain => {
          const covers = apiCategory.includes(domain) || 
                       apiName.includes(domain) || 
                       apiDescription.includes(domain) ||
                       (domain === 'fitness' && (apiCategory === 'sports' || apiCategory === 'health' || apiName.includes('fit'))) ||
                       (domain === 'maps' && apiCategory === 'location');
          
          if (covers && !coveredDomains.has(domain)) {
            coveredDomains.add(domain);
            return true;
          }
          return false;
        });
        
        if (coversRequiredDomain && !usedCategories.has(api.category)) {
          selectedAPIs.push(api);
          usedCategories.add(api.category);
          logger.logInfo('Selected API for required domain', { 
            api: api.name, 
            category: api.category, 
            score,
            coveredDomains: Array.from(coveredDomains)
          });
        }
      }
    }

    // Second pass: select highest scoring APIs from different categories (if we still need more)
    for (const { api, score } of scoredAPIs) {
      if (selectedAPIs.length >= count) break;
      
      if (!usedCategories.has(api.category) && !selectedAPIs.find(selected => selected.id === api.id)) {
        selectedAPIs.push(api);
        usedCategories.add(api.category);
        logger.logInfo('Selected API for diversity', { 
          api: api.name, 
          category: api.category, 
          score 
        });
      }
    }

    // Third pass: if we still need more APIs, relax the category constraint
    if (selectedAPIs.length < count) {
      for (const { api, score } of scoredAPIs) {
        if (selectedAPIs.length >= count) break;
        
        if (!selectedAPIs.find(selected => selected.id === api.id)) {
          selectedAPIs.push(api);
          logger.logInfo('Selected API to fill quota', { 
            api: api.name, 
            category: api.category, 
            score 
          });
        }
      }
    }

    // Log final selection summary
    logger.logInfo('Final API selection summary', {
      requiredDomains,
      coveredDomains: Array.from(coveredDomains),
      selectedAPIs: selectedAPIs.map(api => ({ name: api.name, category: api.category })),
      allDomainscovered: requiredDomains.every(domain => coveredDomains.has(domain))
    });

    return selectedAPIs;
  }

  /**
   * Apply basic filters to available APIs
   */
  private applyBasicFilters(apis: APIMetadata[], options?: SelectionOptions): APIMetadata[] {
    let filtered = apis;

    if (options?.excludeCategories && options.excludeCategories.length > 0) {
      filtered = filtered.filter(
        api => !options.excludeCategories!.some(
          cat => cat.toLowerCase() === api.category.toLowerCase()
        )
      );
    }

    if (options?.excludeAPIIds && options.excludeAPIIds.length > 0) {
      filtered = filtered.filter(
        api => !options.excludeAPIIds!.includes(api.id)
      );
    }

    if (options?.corsOnly) {
      filtered = filtered.filter(api => api.corsCompatible);
    }

    if (options?.requireAuth !== undefined) {
      if (options.requireAuth) {
        filtered = filtered.filter(
          api => api.authType === 'apikey' || api.authType === 'oauth'
        );
      } else {
        filtered = filtered.filter(api => api.authType === 'none');
      }
    }

    return filtered;
  }

  /**
   * Get suggested categories for a problem statement using semantic analysis
   */
  getSuggestedCategories(problemStatement: string): string[] {
    const allAPIs = this.registry.getAllAPIs();
    const scoredAPIs = this.scoreAPIsForProblem(problemStatement, allAPIs);
    
    // Group by category and calculate average scores
    const categoryScores: { [key: string]: { score: number; count: number } } = {};
    
    for (const { api, score } of scoredAPIs) {
      if (!categoryScores[api.category]) {
        categoryScores[api.category] = { score: 0, count: 0 };
      }
      categoryScores[api.category].score += score;
      categoryScores[api.category].count += 1;
    }

    // Calculate average scores and return top categories
    return Object.entries(categoryScores)
      .map(([category, data]) => ({
        category,
        avgScore: data.score / data.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5)
      .map(item => item.category);
  }

  /**
   * Get AI-enhanced detailed analysis of why APIs were selected
   */
  async getEnhancedSelectionReasoning(problemStatement: string, selectedAPIs: APIMetadata[]): Promise<string[]> {
    const isOllamaAvailable = await ollamaClient.isAvailable();
    
    if (isOllamaAvailable) {
      try {
        return await this.generateOllamaReasoning(problemStatement, selectedAPIs);
      } catch (error) {
        logger.logWarning('Ollama reasoning failed, using template-based reasoning', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Fallback to template-based reasoning
    return this.getSelectionReasoning(problemStatement, selectedAPIs);
  }

  /**
   * Generate AI-powered reasoning using Ollama
   */
  private async generateOllamaReasoning(problemStatement: string, selectedAPIs: APIMetadata[]): Promise<string[]> {
    const apiDescriptions = selectedAPIs.map(api => 
      `${api.name} (${api.category}): ${api.description}`
    ).join('\n');

    const prompt = `You are an expert software architect explaining API selection decisions to a developer.

USER PROBLEM: "${problemStatement}"

SELECTED APIs:
${apiDescriptions}

Explain why each API was selected for this specific problem. For each API, provide a clear, concise explanation (1-2 sentences) that shows:
1. How it directly addresses part of the user's problem
2. What specific capability it brings to the solution
3. Why it's a good fit for this particular use case

Format your response as:
1. [API Name]: [Explanation]
2. [API Name]: [Explanation]
3. [API Name]: [Explanation]

Keep explanations practical and focused on solving the user's specific needs.`;

    const response = await ollamaClient.generate(prompt, {
      model: process.env.OLLAMA_MODEL || 'llama3',
      temperature: 0.7,
      max_tokens: 800,
    });

    return this.parseReasoningResponse(response, selectedAPIs);
  }

  /**
   * Parse Ollama reasoning response
   */
  private parseReasoningResponse(response: string, selectedAPIs: APIMetadata[]): string[] {
    const lines = response.split('\n').filter(line => line.trim().length > 0);
    const reasons: string[] = [];

    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+?):\s*(.+)$/);
      if (match) {
        const [, apiName, explanation] = match;
        reasons.push(`${apiName.trim()}: ${explanation.trim()}`);
      }
    }

    // Ensure we have reasoning for all APIs
    if (reasons.length < selectedAPIs.length) {
      const fallbackReasons = this.getSelectionReasoning('', selectedAPIs);
      while (reasons.length < selectedAPIs.length && reasons.length < fallbackReasons.length) {
        reasons.push(fallbackReasons[reasons.length]);
      }
    }

    return reasons.slice(0, selectedAPIs.length);
  }

  /**
   * Get detailed analysis of why APIs were selected (template-based fallback)
   */
  getSelectionReasoning(problemStatement: string, selectedAPIs: APIMetadata[]): string[] {
    const reasons: string[] = [];
    const normalizedProblem = problemStatement.toLowerCase();

    for (const api of selectedAPIs) {
      const apiReasons: string[] = [];
      
      // Check semantic matches
      for (const [pattern, keywords] of Object.entries(this.semanticPatterns)) {
        const problemMatches = keywords.filter(keyword => normalizedProblem.includes(keyword));
        const apiText = `${api.name} ${api.description}`.toLowerCase();
        const apiMatches = keywords.filter(keyword => apiText.includes(keyword));
        
        if (problemMatches.length > 0 && apiMatches.length > 0) {
          apiReasons.push(`provides ${pattern} functionality`);
        }
      }

      // Check direct word matches
      const problemWords = this.extractMeaningfulWords(normalizedProblem);
      const apiText = `${api.name} ${api.description}`.toLowerCase();
      const matchedWords = problemWords.filter(word => apiText.includes(word));
      
      if (matchedWords.length > 0) {
        apiReasons.push(`matches key terms: ${matchedWords.slice(0, 3).join(', ')}`);
      }

      const reasonText = apiReasons.length > 0 
        ? `${api.name} was selected because it ${apiReasons.slice(0, 2).join(' and ')}`
        : `${api.name} provides complementary functionality for your project`;
        
      reasons.push(reasonText);
    }

    return reasons;
  }
}
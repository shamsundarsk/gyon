import { APIMetadata, AppIdea } from '../types';
import { IdeaGenerationError } from '../errors/CustomErrors';
import { logger } from '../utils/errorLogger';
import * as ollamaClient from '../modules/idea-generator/ollamaClient';

/**
 * IdeaGenerator class responsible for generating creative app concepts
 * from API combinations using hybrid template-based and AI-enhanced generation
 */
export class IdeaGenerator {
  private useOllama: boolean = false;

  constructor(useOllama: boolean = false) {
    this.useOllama = useOllama;
  }
  /**
   * Generate a complete app idea from selected APIs (1-6 APIs supported)
   */
  async generateIdea(apis: APIMetadata[], problemStatement?: string): Promise<AppIdea> {
    if (apis.length < 1 || apis.length > 6) {
      logger.logError(
        new IdeaGenerationError('Between 1 and 6 APIs are required for idea generation', {
          providedCount: apis.length,
        })
      );
      throw new IdeaGenerationError('Between 1 and 6 APIs are required for idea generation', {
        providedCount: apis.length,
      });
    }

    try {
      // Check if Ollama is available and should be used
      const shouldUseOllama = this.useOllama && await ollamaClient.isAvailable();
      
      let appName: string;
      let description: string;
      let features: string[];
      let rationale: string;

      if (shouldUseOllama && problemStatement) {
        // Use AI-enhanced generation for problem-driven requests
        const aiEnhanced = await this.generateWithOllama(apis, problemStatement);
        appName = aiEnhanced.appName;
        description = aiEnhanced.description;
        features = aiEnhanced.features;
        rationale = aiEnhanced.rationale;
        
        logger.logInfo('AI-enhanced idea generated successfully', { 
          appName, 
          usedOllama: true,
          hasProblemStatement: true 
        });
      } else {
        // Use template-based generation (fallback or random mode)
        appName = problemStatement 
          ? this.generateAppNameFromProblem(apis, problemStatement)
          : this.generateAppName(apis);
        description = problemStatement
          ? this.generateDescriptionFromProblem(apis, problemStatement)
          : this.generateDescription(apis);
        features = problemStatement
          ? this.generateFeaturesFromProblem(apis, problemStatement)
          : this.generateFeatures(apis);
        rationale = problemStatement
          ? this.generateRationaleFromProblem(apis, problemStatement)
          : this.generateRationale(apis);
          
        logger.logInfo('Template-based idea generated successfully', { 
          appName, 
          usedOllama: false,
          hasProblemStatement: !!problemStatement 
        });
      }

      return {
        appName,
        description,
        features,
        rationale,
        apis,
        problemStatement,
      };
    } catch (error) {
      logger.logError(
        new IdeaGenerationError('Failed to generate app idea', {
          apis: apis.map(api => api.id),
          originalError: error instanceof Error ? error.message : String(error),
        })
      );
      throw new IdeaGenerationError('Failed to generate app idea', {
        apis: apis.map(api => api.id),
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Generate an app name from problem statement and APIs (supports 1-6 APIs)
   */
  generateAppNameFromProblem(apis: APIMetadata[], problemStatement: string): string {
    // Extract key concepts from problem statement
    const problemWords = problemStatement.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !['want', 'need', 'build', 'create', 'make', 'develop'].includes(word));

    // Get main themes from APIs
    const apiThemes = apis.map(api => 
      api.name.replace(/\s*(API|Service|Platform)\s*/gi, '').trim()
    );

    // Combine problem concepts with API capabilities
    const mainConcept = problemWords[0] || 'Smart';
    const primaryAPI = apiThemes[0];
    const secondaryAPI = apiThemes[1];
    
    let namePatterns: string[];
    
    if (apis.length === 1) {
      namePatterns = [
        `${this.capitalize(mainConcept)} ${primaryAPI}`,
        `${primaryAPI} ${this.capitalize(mainConcept)}`,
        `Smart ${this.capitalize(mainConcept)}`,
        `${this.capitalize(mainConcept)} Pro`,
        `The ${this.capitalize(mainConcept)} App`
      ];
    } else if (apis.length === 2) {
      namePatterns = [
        `${this.capitalize(mainConcept)} ${primaryAPI}`,
        `${primaryAPI}-${secondaryAPI} Hub`,
        `Smart${this.capitalize(mainConcept)} Connect`,
        `${this.capitalize(mainConcept)} Fusion`,
        `${primaryAPI} ${this.capitalize(mainConcept)} Suite`
      ];
    } else if (apis.length >= 3) {
      namePatterns = [
        `${this.capitalize(mainConcept)} ${primaryAPI}`,
        `${primaryAPI}-Powered ${this.capitalize(mainConcept)}`,
        `Smart${this.capitalize(mainConcept)} Hub`,
        `${this.capitalize(mainConcept)} Connect`,
        `${primaryAPI} ${this.capitalize(mainConcept)} Suite`,
        `The ${this.capitalize(mainConcept)} Assistant`,
        `${this.capitalize(mainConcept)} Central`,
        `All-in-One ${this.capitalize(mainConcept)}`
      ];
    }

    // Select pattern based on problem statement hash for consistency
    const patternIndex = this.hashString(problemStatement) % namePatterns!.length;
    return namePatterns![patternIndex];
  }

  /**
   * Generate description based on problem statement and selected APIs with dynamic analysis (supports 1-6 APIs)
   */
  generateDescriptionFromProblem(apis: APIMetadata[], problemStatement: string): string {
    const problemAnalysis = this.analyzeProblemStatement(problemStatement);
    const apiSynergies = this.analyzeAPISynergies(apis, problemStatement);
    
    let description = `A ${problemAnalysis.complexity} solution designed to ${problemAnalysis.primaryGoal}. `;
    
    // Adjust description based on API count
    if (apis.length === 1) {
      description += `Leveraging the power of ${apis[0].name}, this focused application `;
      description += `delivers specialized ${apis[0].category} functionality tailored to your needs. `;
    } else if (apis.length === 2) {
      description += `By strategically combining ${apis[0].name} and ${apis[1].name}, this application `;
      description += `creates a powerful synergy between ${apis[0].category} and ${apis[1].category} services. `;
    } else {
      description += `By intelligently integrating ${apis.length} complementary services (${apis.map(api => api.name).join(', ')}), this application `;
      description += `${apiSynergies.mainValue}. `;
    }
    
    description += `The system addresses your core need - "${problemStatement}" - through `;
    description += `${apiSynergies.integrationApproach}. `;
    
    if (problemAnalysis.targetUsers) {
      description += `Perfect for ${problemAnalysis.targetUsers}, `;
    }
    
    description += `this solution offers ${apiSynergies.keyBenefits.join(', ')} while maintaining `;
    
    if (apis.length === 1) {
      description += `simplicity and focused functionality.`;
    } else if (apis.length <= 3) {
      description += `simplicity and effectiveness in addressing your specific requirements.`;
    } else {
      description += `comprehensive functionality and enterprise-grade capabilities.`;
    }
    
    return description;
  }

  /**
   * Analyze problem statement to understand context and requirements
   */
  private analyzeProblemStatement(problemStatement: string): {
    complexity: string;
    primaryGoal: string;
    targetUsers: string | null;
    technicalRequirements: string[];
  } {
    const normalized = problemStatement.toLowerCase();
    
    // Determine complexity
    let complexity = 'comprehensive';
    if (normalized.includes('simple') || normalized.includes('basic')) complexity = 'streamlined';
    if (normalized.includes('advanced') || normalized.includes('complex')) complexity = 'sophisticated';
    if (normalized.includes('enterprise') || normalized.includes('professional')) complexity = 'enterprise-grade';
    
    // Extract primary goal
    let primaryGoal = 'solve your specific challenge';
    if (normalized.includes('track')) primaryGoal = 'provide comprehensive tracking and monitoring';
    if (normalized.includes('manage')) primaryGoal = 'streamline management and organization';
    if (normalized.includes('connect') || normalized.includes('social')) primaryGoal = 'facilitate connection and collaboration';
    if (normalized.includes('analyze') || normalized.includes('data')) primaryGoal = 'deliver powerful analytics and insights';
    if (normalized.includes('automate')) primaryGoal = 'automate processes and workflows';
    
    // Identify target users
    let targetUsers: string | null = null;
    if (normalized.includes('business') || normalized.includes('professional')) targetUsers = 'businesses and professionals';
    if (normalized.includes('student') || normalized.includes('education')) targetUsers = 'students and educators';
    if (normalized.includes('developer') || normalized.includes('programmer')) targetUsers = 'developers and technical teams';
    if (normalized.includes('fitness') || normalized.includes('health')) targetUsers = 'health and fitness enthusiasts';
    if (normalized.includes('creative') || normalized.includes('artist')) targetUsers = 'creative professionals and artists';
    
    return {
      complexity,
      primaryGoal,
      targetUsers,
      technicalRequirements: []
    };
  }

  /**
   * Analyze how APIs work together to solve the problem
   */
  private analyzeAPISynergies(apis: APIMetadata[], problemStatement: string): {
    mainValue: string;
    integrationApproach: string;
    keyBenefits: string[];
  } {
    const categories = apis.map(api => api.category);
    const normalized = problemStatement.toLowerCase();
    
    // Determine main value proposition
    let mainValue = 'creates a unified ecosystem where each service enhances the others';
    
    if (categories.includes('weather') && categories.includes('maps')) {
      mainValue = 'combines location intelligence with environmental awareness';
    }
    if (categories.includes('music') && (categories.includes('productivity') || normalized.includes('focus'))) {
      mainValue = 'enhances productivity through personalized audio experiences';
    }
    if (categories.includes('social') && categories.includes('food')) {
      mainValue = 'builds community around shared culinary experiences';
    }
    if (categories.includes('finance') && categories.includes('data')) {
      mainValue = 'transforms financial data into actionable insights';
    }
    
    // Determine integration approach
    let integrationApproach = 'seamless data flow and intelligent cross-service communication';
    
    if (normalized.includes('realtime') || normalized.includes('live')) {
      integrationApproach = 'real-time synchronization and instant updates across all services';
    }
    if (normalized.includes('personalized') || normalized.includes('custom')) {
      integrationApproach = 'personalized experiences that adapt to individual user preferences';
    }
    if (normalized.includes('automated') || normalized.includes('smart')) {
      integrationApproach = 'intelligent automation that learns from user behavior';
    }
    
    // Generate key benefits
    const keyBenefits: string[] = [];
    
    if (apis.some(api => api.corsCompatible)) {
      keyBenefits.push('cross-platform compatibility');
    }
    if (apis.some(api => api.authType === 'none')) {
      keyBenefits.push('immediate usability without complex setup');
    }
    if (categories.length === new Set(categories).size) {
      keyBenefits.push('diverse functionality from complementary services');
    }
    
    keyBenefits.push('scalable architecture');
    keyBenefits.push('user-centric design');
    
    return {
      mainValue,
      integrationApproach,
      keyBenefits
    };
  }

  /**
   * Generate dynamic features based on problem analysis and API capabilities (supports 1-6 APIs)
   */
  generateFeaturesFromProblem(apis: APIMetadata[], problemStatement: string): string[] {
    const features: string[] = [];
    const problemAnalysis = this.analyzeProblemStatement(problemStatement);
    const normalized = problemStatement.toLowerCase();
    
    // Core functionality features based on problem analysis
    if (apis.length === 1) {
      features.push(`Focused ${apis[0].category} functionality powered by ${apis[0].name}`);
    } else {
      features.push(`${problemAnalysis.primaryGoal} through intelligent ${apis.length}-API integration`);
    }
    
    // Dynamic API-specific features
    apis.forEach(api => {
      const dynamicCapability = this.generateDynamicAPIFeature(api, problemStatement);
      features.push(dynamicCapability);
    });

    // Context-aware integration features
    if (normalized.includes('realtime') || normalized.includes('live')) {
      features.push('Real-time data synchronization and live updates across all services');
    } else {
      features.push('Intelligent data synchronization with optimized refresh intervals');
    }
    
    if (normalized.includes('offline') || normalized.includes('cached')) {
      features.push('Offline functionality with smart caching and sync when online');
    }
    
    if (normalized.includes('personalized') || normalized.includes('custom')) {
      features.push('Personalized user experience with adaptive interface and preferences');
    }
    
    if (normalized.includes('collaborative') || normalized.includes('team')) {
      features.push('Collaborative features with team sharing and real-time collaboration');
    }
    
    // Smart UI features based on problem context
    if (normalized.includes('mobile') || normalized.includes('app')) {
      features.push('Native mobile experience with touch-optimized interface');
    } else {
      features.push('Responsive design optimized for desktop and mobile devices');
    }
    
    // Advanced features based on API combinations
    const categories = apis.map(api => api.category);
    
    if (categories.includes('maps') && categories.includes('weather')) {
      features.push('Location-aware weather integration with route optimization');
    }
    
    if (categories.includes('social') && (categories.includes('food') || categories.includes('entertainment'))) {
      features.push('Social discovery and recommendation engine');
    }
    
    if (categories.includes('data') || categories.includes('finance')) {
      features.push('Advanced analytics dashboard with customizable visualizations');
    }
    
    // Security and performance features
    const authAPIs = apis.filter(api => api.authType !== 'none');
    if (authAPIs.length > 0) {
      features.push(`Enterprise-grade security with OAuth integration for ${authAPIs.map(api => api.name).join(', ')}`);
    } else {
      features.push('Zero-configuration setup with immediate access to all features');
    }
    
    // Performance optimization
    if (apis.some(api => api.corsCompatible)) {
      features.push('Optimized API calls with intelligent caching and error handling');
    }
    
    return features;
  }

  /**
   * Generate dynamic API feature based on problem context
   */
  private generateDynamicAPIFeature(api: APIMetadata, problemStatement: string): string {
    const normalized = problemStatement.toLowerCase();
    const apiName = api.name;
    const category = api.category;
    
    // Context-aware feature generation
    if (category === 'weather') {
      if (normalized.includes('fitness') || normalized.includes('outdoor')) {
        return `${apiName} integration for weather-aware activity recommendations`;
      }
      if (normalized.includes('travel') || normalized.includes('trip')) {
        return `${apiName} integration for destination weather planning and alerts`;
      }
      return `${apiName} integration for comprehensive weather data and forecasting`;
    }
    
    if (category === 'maps') {
      if (normalized.includes('delivery') || normalized.includes('logistics')) {
        return `${apiName} integration for route optimization and delivery tracking`;
      }
      if (normalized.includes('social') || normalized.includes('meetup')) {
        return `${apiName} integration for location-based social features and meetups`;
      }
      return `${apiName} integration for intelligent location services and navigation`;
    }
    
    if (category === 'music') {
      if (normalized.includes('fitness') || normalized.includes('workout')) {
        return `${apiName} integration for workout-optimized music and tempo matching`;
      }
      if (normalized.includes('productivity') || normalized.includes('focus')) {
        return `${apiName} integration for focus-enhancing audio and productivity soundscapes`;
      }
      return `${apiName} integration for personalized music experiences and discovery`;
    }
    
    if (category === 'social') {
      if (normalized.includes('business') || normalized.includes('professional')) {
        return `${apiName} integration for professional networking and collaboration`;
      }
      return `${apiName} integration for community building and social engagement`;
    }
    
    // Default dynamic feature
    const capability = this.getAPICapability(api);
    return `${apiName} integration providing ${capability} tailored to your specific needs`;
  }

  /**
   * Generate rationale based on problem statement and APIs (supports 1-6 APIs)
   */
  generateRationaleFromProblem(apis: APIMetadata[], problemStatement: string): string {
    const apiNames = apis.map(api => api.name).join(', ');
    
    let rationale = `${apis.length === 1 ? 'This API' : 'These APIs'} (${apiNames}) ${apis.length === 1 ? 'was' : 'were'} specifically selected to address your stated need: "${problemStatement}". `;
    
    if (apis.length === 1) {
      rationale += `${apis[0].name} provides ${this.getAPICapability(apis[0])}, offering a focused and efficient solution to your specific requirements.`;
    } else if (apis.length === 2) {
      rationale += `${apis[0].name} provides ${this.getAPICapability(apis[0])}, while ${apis[1].name} adds ${this.getAPICapability(apis[1])}. ` +
                  `This strategic pairing creates a synergistic solution that addresses multiple aspects of your problem.`;
    } else if (apis.length === 3) {
      rationale += `Each API contributes unique capabilities that, when combined, create a comprehensive solution. ` +
                  `${apis[0].name} provides ${this.getAPICapability(apis[0])}, ` +
                  `${apis[1].name} adds ${this.getAPICapability(apis[1])}, ` +
                  `and ${apis[2].name} enables ${this.getAPICapability(apis[2])}.`;
    } else {
      rationale += `Each of the ${apis.length} APIs contributes specialized capabilities: `;
      const apiDescriptions = apis.slice(0, 3).map(api => `${api.name} (${this.getAPICapability(api)})`).join(', ');
      rationale += apiDescriptions;
      if (apis.length > 3) {
        rationale += `, and ${apis.length - 3} additional service${apis.length > 4 ? 's' : ''} for enhanced functionality`;
      }
      rationale += '.';
    }
    
    rationale += ` Together, ${apis.length === 1 ? 'it forms' : 'they form'} a ${apis.length === 1 ? 'focused' : apis.length <= 3 ? 'powerful' : 'comprehensive'} ecosystem that not only solves your immediate problem but also ` +
                `provides opportunities for ${apis.length === 1 ? 'specialized' : 'enhanced'} functionality and user experience.`;
    
    return rationale;
  }

  /**
   * Get a capability description for an API
   */
  private getAPICapability(api: APIMetadata): string {
    const capabilityMap: { [key: string]: string } = {
      weather: 'real-time weather data and forecasting',
      music: 'music streaming and audio content management',
      maps: 'location services and navigation capabilities',
      finance: 'financial data and transaction processing',
      news: 'current news and media content',
      social: 'social networking and community features',
      food: 'recipe and nutrition information',
      sports: 'sports data and statistics',
      entertainment: 'entertainment content and media',
      productivity: 'task management and organization tools',
      communication: 'messaging and communication services',
      data: 'data analytics and visualization',
      gaming: 'gaming content and player statistics',
      animals: 'animal-related content and information',
      quotes: 'inspirational content and quotes',
      utilities: 'utility functions and tools',
      education: 'educational content and learning resources',
      environment: 'environmental data and sustainability metrics',
      calendar: 'calendar and scheduling functionality',
      design: 'design tools and visual content'
    };

    return capabilityMap[api.category] || 'specialized data and functionality';
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate a hash from string for consistent randomization
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate app idea using Ollama AI for enhanced creativity and context understanding
   */
  private async generateWithOllama(apis: APIMetadata[], problemStatement: string): Promise<{
    appName: string;
    description: string;
    features: string[];
    rationale: string;
  }> {
    const prompt = this.buildOllamaPrompt(apis, problemStatement);
    
    try {
      const response = await ollamaClient.generate(prompt, {
        model: process.env.OLLAMA_MODEL || 'llama3',
        temperature: 0.8,
        max_tokens: 2000,
      });

      return this.parseOllamaResponse(response, apis, problemStatement);
    } catch (error) {
      logger.logWarning('Ollama generation failed, falling back to template-based generation', {
        error: error instanceof Error ? error.message : String(error),
        problemStatement: problemStatement.substring(0, 100)
      });
      
      // Fallback to template-based generation
      return {
        appName: this.generateAppNameFromProblem(apis, problemStatement),
        description: this.generateDescriptionFromProblem(apis, problemStatement),
        features: this.generateFeaturesFromProblem(apis, problemStatement),
        rationale: this.generateRationaleFromProblem(apis, problemStatement),
      };
    }
  }

  /**
   * Build a comprehensive prompt for Ollama (supports 1-6 APIs)
   */
  private buildOllamaPrompt(apis: APIMetadata[], problemStatement: string): string {
    const apiDescriptions = apis.map(api => 
      `- ${api.name} (${api.category}): ${api.description}`
    ).join('\n');

    const apiCountContext = apis.length === 1 
      ? 'a focused single-API solution'
      : apis.length === 2 
      ? 'a strategic two-API combination'
      : apis.length <= 3
      ? 'a balanced multi-API integration'
      : 'a comprehensive enterprise-grade solution';

    const featureCount = Math.min(3 + apis.length, 8);

    return `You are an expert software architect and product designer. A user wants to build an application and has described their needs. Based on their problem statement and the ${apis.length} selected API${apis.length > 1 ? 's' : ''}, create ${apiCountContext}.

USER PROBLEM STATEMENT:
"${problemStatement}"

SELECTED API${apis.length > 1 ? 'S' : ''} (${apis.length} total):
${apiDescriptions}

Please generate a detailed app concept with the following structure:

APP_NAME: [Create a catchy, memorable name that reflects the app's purpose and the ${apis.length === 1 ? 'focused nature' : 'integrated approach'}]

DESCRIPTION: [Write a compelling 2-3 sentence description that explains what the app does, how it solves the user's problem, and what makes it unique. ${apis.length === 1 ? 'Focus on the specialized capabilities of the single API.' : `Focus on how the ${apis.length} APIs work together synergistically.`}]

FEATURES: [List ${featureCount} specific features that directly address the user's needs. Each feature should:
- Solve a specific aspect of the problem
- Leverage ${apis.length === 1 ? 'the selected API' : 'one or more of the selected APIs'}
- Provide clear user value
- Be technically feasible
${apis.length > 1 ? '- Show how multiple APIs enhance each other when applicable' : '- Demonstrate deep integration with the single API'}]

RATIONALE: [Explain in 2-3 sentences why ${apis.length === 1 ? 'this specific API is perfect' : 'these specific APIs work well together'} for this problem, ${apis.length === 1 ? 'what specialized value it provides' : 'how they complement each other'}, and what unique value ${apis.length === 1 ? 'this focused approach' : 'their combination'} creates.]

Make the response creative, technically sound, and directly relevant to the user's stated problem. Focus on practical solutions that users would actually want to use.

Response format:
APP_NAME: [name]
DESCRIPTION: [description]
FEATURES:
- [feature 1]
- [feature 2]
- [feature 3]
${featureCount > 3 ? '- [feature 4]' : ''}
${featureCount > 4 ? '- [feature 5]' : ''}
${featureCount > 5 ? '- [feature 6]' : ''}
${featureCount > 6 ? '- [feature 7]' : ''}
${featureCount > 7 ? '- [feature 8]' : ''}
RATIONALE: [rationale]`;
  }

  /**
   * Parse Ollama response into structured data
   */
  private parseOllamaResponse(response: string, apis: APIMetadata[], problemStatement: string): {
    appName: string;
    description: string;
    features: string[];
    rationale: string;
  } {
    try {
      const lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      let appName = '';
      let description = '';
      let features: string[] = [];
      let rationale = '';
      
      let currentSection = '';
      
      for (const line of lines) {
        if (line.startsWith('APP_NAME:')) {
          appName = line.replace('APP_NAME:', '').trim();
          currentSection = 'name';
        } else if (line.startsWith('DESCRIPTION:')) {
          description = line.replace('DESCRIPTION:', '').trim();
          currentSection = 'description';
        } else if (line.startsWith('FEATURES:')) {
          currentSection = 'features';
        } else if (line.startsWith('RATIONALE:')) {
          rationale = line.replace('RATIONALE:', '').trim();
          currentSection = 'rationale';
        } else if (line.startsWith('-') && currentSection === 'features') {
          features.push(line.replace('-', '').trim());
        } else if (currentSection === 'description' && !line.startsWith('FEATURES:')) {
          description += ' ' + line;
        } else if (currentSection === 'rationale') {
          rationale += ' ' + line;
        }
      }
      
      // Validate and provide fallbacks
      if (!appName) {
        appName = this.generateAppNameFromProblem(apis, problemStatement);
      }
      
      if (!description) {
        description = this.generateDescriptionFromProblem(apis, problemStatement);
      }
      
      if (features.length === 0) {
        features = this.generateFeaturesFromProblem(apis, problemStatement);
      }
      
      if (!rationale) {
        rationale = this.generateRationaleFromProblem(apis, problemStatement);
      }
      
      return {
        appName: appName.replace(/['"]/g, ''), // Remove quotes
        description: description.trim(),
        features: features.slice(0, 7), // Limit to 7 features
        rationale: rationale.trim(),
      };
    } catch (error) {
      logger.logError(new Error('Failed to parse Ollama response'), {
        response: response.substring(0, 200),
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return template-based fallback
      return {
        appName: this.generateAppNameFromProblem(apis, problemStatement),
        description: this.generateDescriptionFromProblem(apis, problemStatement),
        features: this.generateFeaturesFromProblem(apis, problemStatement),
        rationale: this.generateRationaleFromProblem(apis, problemStatement),
      };
    }
  }

  /**
   * Generate an app name by combining API themes (supports 1-6 APIs)
   */
  generateAppName(apis: APIMetadata[]): string {
    // Extract key themes from API names and categories
    const themes = apis.map((api) => {
      // Extract the main word from API name (remove "API", "Service", etc.)
      const cleanName = api.name
        .replace(/\s*(API|Service|Platform)\s*/gi, '')
        .trim();
      return cleanName;
    });

    let patterns: string[];
    
    if (apis.length === 1) {
      patterns = [
        `${themes[0]} Pro`,
        `Smart ${themes[0]}`,
        `${themes[0]} Hub`,
        `The ${themes[0]} App`,
        `${themes[0]} Central`
      ];
    } else if (apis.length === 2) {
      patterns = [
        `${themes[0]} ${themes[1]}`,
        `${themes[0]}-Powered ${themes[1]}`,
        `Smart${themes[1]} with ${themes[0]}`,
        `${themes[0]} ${themes[1]} Connect`,
        `${themes[1]} ${themes[0]} Hub`,
        `The ${themes[0]} ${themes[1]} App`
      ];
    } else if (apis.length === 3) {
      patterns = [
        `${themes[0]} ${themes[1]} ${themes[2]}`,
        `${themes[0]}-Powered ${themes[1]}`,
        `${themes[2]} ${themes[0]} Hub`,
        `Smart${themes[1]} with ${themes[0]}`,
        `${themes[0]} ${themes[2]} Connect`,
        `${themes[1]}${themes[2]} Explorer`,
        `The ${themes[0]} ${themes[1]} App`,
        `${themes[2]}-Enhanced ${themes[0]}`
      ];
    } else {
      // For 4+ APIs, use more generic patterns
      patterns = [
        `${themes[0]} Central`,
        `Smart ${themes[0]} Hub`,
        `${themes[0]} Command Center`,
        `All-in-One ${themes[0]}`,
        `${themes[0]} Suite`,
        `The Ultimate ${themes[0]} App`,
        `${themes[0]} Ecosystem`,
        `${themes[0]} Workspace`
      ];
    }

    // Select a pattern based on API combination (deterministic but varied)
    const patternIndex = apis.length === 1 
      ? apis[0].id.charCodeAt(0) % patterns.length
      : (apis[0].id.charCodeAt(0) + apis[1].id.charCodeAt(0)) % patterns.length;
    return patterns[patternIndex];
  }

  /**
   * Generate a 2-4 sentence description of the app concept (supports 1-6 APIs)
   */
  generateDescription(apis: APIMetadata[]): string {
    // Sanitize text to remove periods and other punctuation that could create sentence boundaries
    const sanitizeText = (text: string): string => {
      return text.replace(/[.!?;]/g, '').trim() || 'API';
    };

    // Extract category-based action verbs
    const getActionVerb = (category: string): string => {
      const verbMap: Record<string, string> = {
        weather: 'tracks weather conditions',
        music: 'plays and discovers music',
        maps: 'provides location services',
        news: 'delivers news updates',
        finance: 'monitors financial data',
        sports: 'tracks sports events',
        food: 'discovers recipes and restaurants',
        travel: 'plans travel itineraries',
        social: 'connects people',
        entertainment: 'provides entertainment content',
        productivity: 'enhances productivity',
        health: 'monitors health metrics',
        education: 'facilitates learning',
        gaming: 'provides gaming experiences',
      };
      return verbMap[category.toLowerCase()] || `integrates ${sanitizeText(category)} data`;
    };

    let sentences: string[] = [];
    
    if (apis.length === 1) {
      const api = apis[0];
      const cleanName = sanitizeText(api.name);
      const action = getActionVerb(api.category);
      
      sentences = [
        `This focused application harnesses the power of ${cleanName} to deliver specialized ${api.category} functionality.`,
        `The app ${action} using ${cleanName}, providing users with a streamlined and efficient experience.`,
        `By concentrating on a single, powerful API, the application offers deep integration and optimized performance.`,
        `Users benefit from the full capabilities of ${cleanName} through an intuitive and purpose-built interface.`
      ];
    } else if (apis.length === 2) {
      const [api1, api2] = apis;
      const cleanName1 = sanitizeText(api1.name);
      const cleanName2 = sanitizeText(api2.name);
      const action1 = getActionVerb(api1.category);
      const action2 = getActionVerb(api2.category);
      
      sentences = [
        `This strategic application combines ${cleanName1} and ${cleanName2} to create a powerful dual-service experience.`,
        `The app ${action1} using ${cleanName1} while ${action2} through ${cleanName2}.`,
        `Users can seamlessly switch between ${api1.category} and ${api2.category} features in a unified interface.`,
        `By pairing these complementary services, the application creates new possibilities for integrated workflows.`
      ];
    } else if (apis.length === 3) {
      const [api1, api2, api3] = apis;
      const cleanName1 = sanitizeText(api1.name);
      const cleanName2 = sanitizeText(api2.name);
      const cleanName3 = sanitizeText(api3.name);
      const action1 = getActionVerb(api1.category);
      const action2 = getActionVerb(api2.category);
      const action3 = getActionVerb(api3.category);
      
      sentences = [
        `This innovative application combines the power of ${cleanName1}, ${cleanName2}, and ${cleanName3} to create a unique user experience.`,
        `The app ${action1} using ${cleanName1}, ${action2} through ${cleanName2}, and ${action3} via ${cleanName3}.`,
        `Users can seamlessly interact with all three services in a unified interface, creating workflows that weren't possible before.`,
        `By leveraging these APIs together, the application opens up new possibilities for ${sanitizeText(api1.category)}, ${sanitizeText(api2.category)}, and ${sanitizeText(api3.category)} integration.`
      ];
    } else {
      // For 4+ APIs
      const apiNames = apis.slice(0, 3).map(api => sanitizeText(api.name)).join(', ');
      const categories = [...new Set(apis.map(api => api.category))];
      
      sentences = [
        `This comprehensive application integrates ${apis.length} powerful services including ${apiNames} and ${apis.length - 3} additional API${apis.length > 4 ? 's' : ''}.`,
        `The app provides a unified dashboard for managing ${categories.slice(0, 3).join(', ')}${categories.length > 3 ? ' and more' : ''} functionality.`,
        `Users can access enterprise-grade capabilities through a single, intuitive interface that connects all services seamlessly.`,
        `By combining multiple specialized APIs, the application creates a comprehensive ecosystem for complex workflows and advanced use cases.`
      ];
    }

    // Return 2-4 sentences (vary based on API combination)
    const sentenceCount = Math.min(2 + (apis.length > 3 ? 2 : (apis[0].id.length % 3)), sentences.length);
    return sentences.slice(0, sentenceCount).join(' ');
  }

  /**
   * Generate 3-7 key features that leverage all selected APIs (supports 1-6 APIs)
   */
  generateFeatures(apis: APIMetadata[]): string[] {
    let features: string[] = [];

    if (apis.length === 1) {
      const api = apis[0];
      features = [
        `Comprehensive ${api.category} functionality powered by ${api.name}`,
        `Real-time data synchronization with ${api.name} services`,
        `Optimized user interface designed specifically for ${api.category} workflows`,
        `Advanced ${api.category} analytics and insights`,
        `Seamless integration with ${api.name} ecosystem`
      ];
    } else if (apis.length === 2) {
      const [api1, api2] = apis;
      features = [
        `Real-time ${api1.category} data integration powered by ${api1.name}`,
        `Interactive ${api2.category} features using ${api2.name} endpoints`,
        `Cross-platform synchronization between ${api1.name} and ${api2.name}`,
        `Unified dashboard displaying ${api1.category} and ${api2.category} information`,
        `Smart workflows connecting ${api1.name} and ${api2.name} data`,
        `Dual-service notifications and alerts`
      ];
    } else if (apis.length === 3) {
      const [api1, api2, api3] = apis;
      features = [
        `Real-time ${api1.category} data integration powered by ${api1.name}`,
        `Interactive ${api2.category} features using ${api2.name} endpoints`,
        `Advanced ${api3.category} capabilities through ${api3.name} integration`,
        `Cross-platform synchronization combining ${api1.name} and ${api2.name} data`,
        `Smart recommendations based on ${api2.name} and ${api3.name} insights`,
        `Unified dashboard displaying ${api1.category}, ${api2.category}, and ${api3.category} information`,
        `Automated workflows connecting ${api1.name}, ${api2.name}, and ${api3.name}`
      ];
    } else {
      // For 4+ APIs
      const categories = [...new Set(apis.map(api => api.category))];
      
      features = [
        `Comprehensive multi-service integration across ${apis.length} specialized APIs`,
        `Enterprise-grade dashboard with ${categories.join(', ')} functionality`,
        `Advanced data synchronization between all connected services`,
        `Intelligent workflow automation leveraging multiple API capabilities`,
        `Real-time notifications and alerts from all integrated services`,
        `Customizable interface adapting to ${apis.length}-service complexity`,
        `Cross-service analytics and reporting capabilities`,
        `Unified search across all connected ${categories.join(', ')} services`
      ];
    }

    // Return appropriate number of features based on API count
    const featureCount = Math.min(3 + apis.length, features.length);
    return features.slice(0, featureCount);
  }

  /**
   * Generate rationale explaining why the selected APIs work well together (supports 1-6 APIs)
   */
  generateRationale(apis: APIMetadata[]): string {
    if (apis.length === 1) {
      const api = apis[0];
      return `${api.name} was selected for its comprehensive ${api.category} capabilities and robust API design. ` +
             `By focusing on a single, powerful service, the application can provide deep integration and specialized functionality ` +
             `that delivers maximum value for ${api.category}-focused use cases. This focused approach ensures optimal performance ` +
             `and user experience while maintaining simplicity and reliability.`;
    }

    const [api1, api2] = apis;
    let synergies: string[] = [];

    if (apis.length === 2) {
      synergies = [
        `The combination of ${api1.name} and ${api2.name} creates a natural workflow where ${api1.category} data enhances ${api2.category} functionality.`,
        `These two APIs complement each other perfectly, as users who need ${api1.category} services often benefit from ${api2.category} capabilities.`,
        `The synergy between ${api1.category} and ${api2.category} creates opportunities for innovative features that wouldn't be possible with either API alone.`
      ];
    } else if (apis.length === 3) {
      const api3 = apis[2];
      synergies = [
        `The combination of ${api1.name} and ${api2.name} creates a natural workflow where ${api1.category} data enhances ${api2.category} functionality.`,
        `Adding ${api3.name} to the mix provides ${api3.category} context that makes both ${api1.category} and ${api2.category} features more valuable.`,
        `These three APIs complement each other because users who need ${api1.category} services often benefit from ${api2.category} and ${api3.category} capabilities.`,
        `The synergy between ${api1.category}, ${api2.category}, and ${api3.category} creates opportunities for innovative features that wouldn't be possible with any single API.`
      ];
    } else {
      // For 4+ APIs
      const categories = [...new Set(apis.map(api => api.category))];
      synergies = [
        `This comprehensive selection of ${apis.length} APIs creates a powerful ecosystem where each service enhances the others.`,
        `The diverse range of capabilities spanning ${categories.join(', ')} provides users with enterprise-grade functionality in a single application.`,
        `By integrating multiple specialized services, the application can handle complex workflows and advanced use cases that require diverse data sources.`,
        `The synergy between these ${apis.length} APIs creates opportunities for innovative cross-service features and comprehensive automation.`
      ];
    }

    // Combine 2-3 synergy statements based on API count
    const statementCount = Math.min(2 + (apis.length > 3 ? 1 : apis[1]?.id.length % 2 || 0), synergies.length);
    return synergies.slice(0, statementCount).join(' ');
  }
}

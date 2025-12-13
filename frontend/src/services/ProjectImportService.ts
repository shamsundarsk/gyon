/**
 * Project Import Service
 * Converts mashup data into editor-compatible project structure
 */

import { MashupResponse, FileStructure } from '../types';
import { CodeFile } from '../components/CodeEditor';

export interface ImportedProject {
  name: string;
  description: string;
  files: CodeFile[];
  apiSpecs: APISpecification[];
}

export interface APISpecification {
  name: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
  authType: string;
  documentation: string;
}

export interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  parameters?: APIParameter[];
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export class ProjectImportService {
  /**
   * Import a mashup project into the code editor
   */
  async importMashupProject(mashupData: MashupResponse): Promise<ImportedProject> {
    try {
      // Fetch the generated project files from the download URL
      const projectFiles = await this.fetchProjectFiles(mashupData.downloadUrl);
      
      // Convert to editor-compatible format
      const editorFiles = this.convertToEditorFiles(projectFiles, mashupData);
      
      // Extract API specifications
      const apiSpecs = this.extractAPISpecifications(mashupData);
      
      return {
        name: mashupData.idea.appName,
        description: mashupData.idea.description,
        files: editorFiles,
        apiSpecs,
      };
    } catch (error) {
      console.error('Failed to import mashup project:', error);
      throw new Error('Failed to import project. Please try again.');
    }
  }

  /**
   * Fetch project files from the backend
   */
  private async fetchProjectFiles(_downloadUrl: string): Promise<Map<string, string>> {
    // For now, we'll create a mock structure based on the code preview
    // In a real implementation, this would fetch the actual generated files
    const files = new Map<string, string>();
    
    // We'll use the code preview data and expand it into a full project structure
    return files;
  }

  /**
   * Convert project files to editor-compatible format
   */
  private convertToEditorFiles(_projectFiles: Map<string, string>, mashupData: MashupResponse): CodeFile[] {
    const editorFiles: CodeFile[] = [];
    
    // Always generate essential project files regardless of structure
    this.generateEssentialFiles(editorFiles, mashupData);
    
    // Create files from the code preview structure if available
    if (mashupData.codePreview.structure) {
      this.processFileStructure(
        mashupData.codePreview.structure,
        '',
        editorFiles,
        mashupData
      );
    }
    
    return editorFiles;
  }

  /**
   * Generate essential project files that should always exist
   */
  private generateEssentialFiles(editorFiles: CodeFile[], mashupData: MashupResponse): void {
    // Backend files
    editorFiles.push({
      id: 'backend_server_js',
      name: 'server.js',
      content: this.generateServerFile(mashupData),
      language: 'javascript',
      path: 'backend/server.js',
    });

    editorFiles.push({
      id: 'backend_routes_js',
      name: 'mashup.routes.js',
      content: this.generateRoutesFile(mashupData),
      language: 'javascript',
      path: 'backend/routes/mashup.routes.js',
    });

    // Generate service files for each API
    mashupData.idea.apis.forEach((api) => {
      const serviceName = this.sanitizeFileName(api.name);
      editorFiles.push({
        id: `backend_service_${serviceName}`,
        name: `${serviceName}.service.js`,
        content: this.generateServiceFile(`services/${serviceName}.service.js`, mashupData),
        language: 'javascript',
        path: `backend/services/${serviceName}.service.js`,
      });
    });

    editorFiles.push({
      id: 'backend_package_json',
      name: 'package.json',
      content: this.generateBackendPackageJson(mashupData),
      language: 'json',
      path: 'backend/package.json',
    });

    // Frontend files
    editorFiles.push({
      id: 'frontend_app_jsx',
      name: 'App.jsx',
      content: this.generateAppFile(mashupData),
      language: 'javascript',
      path: 'frontend/src/App.jsx',
    });

    // Generate component files for each API
    mashupData.idea.apis.forEach((api) => {
      const componentName = this.toPascalCase(api.name);
      editorFiles.push({
        id: `frontend_component_${componentName}`,
        name: `${componentName}.jsx`,
        content: this.generateComponentFile(`components/${componentName}.jsx`, mashupData),
        language: 'javascript',
        path: `frontend/src/components/${componentName}.jsx`,
      });
    });

    editorFiles.push({
      id: 'frontend_package_json',
      name: 'package.json',
      content: this.generateFrontendPackageJson(mashupData),
      language: 'json',
      path: 'frontend/package.json',
    });

    // Configuration files
    editorFiles.push({
      id: 'env_example',
      name: '.env.example',
      content: this.generateEnvExample(mashupData),
      language: 'plaintext',
      path: '.env.example',
    });

    editorFiles.push({
      id: 'readme_md',
      name: 'README.md',
      content: this.generateReadme(mashupData),
      language: 'markdown',
      path: 'README.md',
    });

    editorFiles.push({
      id: 'gitignore',
      name: '.gitignore',
      content: this.generateGitignore(),
      language: 'plaintext',
      path: '.gitignore',
    });
  }

  /**
   * Recursively process file structure and create editor files
   */
  private processFileStructure(
    structure: FileStructure,
    currentPath: string,
    editorFiles: CodeFile[],
    mashupData: MashupResponse
  ): void {
    const fullPath = currentPath ? `${currentPath}/${structure.name}` : structure.name;
    
    if (structure.type === 'file') {
      // Check if this file already exists in essential files
      const existingFile = editorFiles.find(f => f.path === fullPath);
      if (!existingFile) {
        const content = this.generateFileContent(fullPath, mashupData);
        const language = this.getLanguageFromPath(fullPath);
        
        editorFiles.push({
          id: this.generateFileId(fullPath),
          name: structure.name,
          content,
          language,
          path: fullPath,
        });
      }
    } else if (structure.children) {
      // Process directory children
      structure.children.forEach(child => {
        this.processFileStructure(child, fullPath, editorFiles, mashupData);
      });
    }
  }

  /**
   * Generate file content based on the file path and mashup data
   */
  private generateFileContent(filePath: string, mashupData: MashupResponse): string {
    // Normalize path for consistent matching
    const normalizedPath = filePath.toLowerCase();
    
    // Backend files
    if (normalizedPath.includes('backend') || normalizedPath.includes('server')) {
      if (normalizedPath.endsWith('server.js')) {
        return this.generateServerFile(mashupData);
      } else if (normalizedPath.includes('routes')) {
        return this.generateRoutesFile(mashupData);
      } else if (normalizedPath.includes('services')) {
        return this.generateServiceFile(filePath, mashupData);
      } else if (normalizedPath.endsWith('package.json')) {
        return this.generateBackendPackageJson(mashupData);
      }
    }
    
    // Frontend files
    if (normalizedPath.includes('frontend') || normalizedPath.includes('client') || normalizedPath.includes('src')) {
      if (normalizedPath.endsWith('app.jsx') || normalizedPath.endsWith('app.js')) {
        return this.generateAppFile(mashupData);
      } else if (normalizedPath.includes('components')) {
        return this.generateComponentFile(filePath, mashupData);
      } else if (normalizedPath.endsWith('package.json')) {
        return this.generateFrontendPackageJson(mashupData);
      }
    }
    
    // Check for App.jsx anywhere in the path (not just in frontend folder)
    if (normalizedPath.endsWith('app.jsx') || normalizedPath.endsWith('app.js')) {
      return this.generateAppFile(mashupData);
    }
    
    // Configuration files (check exact names)
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';
    if (fileName === '.env.example') {
      return this.generateEnvExample(mashupData);
    } else if (fileName === 'readme.md') {
      return this.generateReadme(mashupData);
    } else if (fileName === '.gitignore') {
      return this.generateGitignore();
    } else if (fileName === 'package.json') {
      // Default package.json if not caught above
      return this.generateBackendPackageJson(mashupData);
    }
    
    // Generate appropriate content based on file extension
    const extension = fileName.split('.').pop() || '';
    switch (extension) {
      case 'js':
      case 'jsx':
        return `// ${filePath}\n// Generated from ${mashupData.idea.appName}\n\n// TODO: Implement this file\nconsole.log('${filePath} loaded');\n`;
      case 'json':
        return JSON.stringify({ name: mashupData.idea.appName, version: "1.0.0" }, null, 2);
      case 'md':
        return `# ${mashupData.idea.appName}\n\n${mashupData.idea.description}\n\n## TODO\n\nImplement this file.\n`;
      default:
        return `// ${filePath}\n// Generated from ${mashupData.idea.appName}\n\n// TODO: Implement this file\n`;
    }
  }

  /**
   * Generate server.js content
   */
  private generateServerFile(mashupData: MashupResponse): string {
    // Ensure we always have at least one API to avoid empty imports
    const apis = mashupData.idea.apis && mashupData.idea.apis.length > 0 
      ? mashupData.idea.apis 
      : [{ name: 'Default', id: 'default', description: 'Default API', category: 'general', baseUrl: 'http://localhost', sampleEndpoint: '/api', authType: 'none' as const, corsCompatible: true, documentationUrl: 'http://localhost' }];
    
    const apiImports = apis.map(api => 
      `const ${this.toCamelCase(api.name)}Service = require('./services/${this.sanitizeFileName(api.name)}.service');`
    ).join('\n');

    const appName = mashupData.idea.appName || 'Mashup App';

    return `const express = require('express');
const cors = require('cors');
require('dotenv').config();

${apiImports}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', require('./routes/mashup.routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`🚀 ${appName} server running on port \${PORT}\`);
});

module.exports = app;
`;
  }

  /**
   * Generate routes file content
   */
  private generateRoutesFile(mashupData: MashupResponse): string {
    // Ensure we always have at least one API
    const apis = mashupData.idea.apis && mashupData.idea.apis.length > 0 
      ? mashupData.idea.apis 
      : [{ name: 'Default', id: 'default', description: 'Default API', category: 'general', baseUrl: 'http://localhost', sampleEndpoint: '/api', authType: 'none' as const, corsCompatible: true, documentationUrl: 'http://localhost' }];
    
    const routeHandlers = apis.map(api => {
      const serviceName = this.toCamelCase(api.name);
      const routePath = this.sanitizeFileName(api.name);
      return `
// ${api.name} routes
router.get('/${routePath}', async (req, res) => {
  try {
    const data = await ${serviceName}Service.getData(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});`;
    }).join('\n');

    return `const express = require('express');
const router = express.Router();

${apis.map(api => 
  `const ${this.toCamelCase(api.name)}Service = require('../services/${this.sanitizeFileName(api.name)}.service');`
).join('\n')}

${routeHandlers}

module.exports = router;
`;
  }

  /**
   * Generate service file content
   */
  private generateServiceFile(filePath: string, mashupData: MashupResponse): string {
    const fileName = filePath.split('/').pop()?.replace('.service.js', '') || '';
    const api = mashupData.idea.apis.find(a => this.sanitizeFileName(a.name) === fileName);
    
    if (!api) {
      return `// Service file for ${fileName}\n\n// TODO: Implement service methods\n`;
    }

    // Sanitize API description for use in comments
    const sanitizedDescription = this.sanitizeForComment(api.description);

    return `const axios = require('axios');

/**
 * ${api.name} Service
 * ${sanitizedDescription}
 */
class ${this.toPascalCase(api.name)}Service {
  constructor() {
    this.baseUrl = '${api.baseUrl}';
    this.apiKey = process.env.${api.name.toUpperCase()}_API_KEY;
  }

  /**
   * Get data from ${api.name}
   */
  async getData(params = {}) {
    try {
      const response = await axios.get(\`\${this.baseUrl}${api.sampleEndpoint}\`, {
        params,
        headers: this.getHeaders(),
      });
      
      return response.data;
    } catch (error) {
      console.error(\`${api.name} API Error:\`, error.message);
      throw new Error(\`Failed to fetch data from ${api.name}\`);
    }
  }

  /**
   * Get request headers
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey && '${api.authType}' === 'apikey') {
      headers['Authorization'] = \`Bearer \${this.apiKey}\`;
    }

    return headers;
  }
}

module.exports = new ${this.toPascalCase(api.name)}Service();
`;
  }

  /**
   * Generate App.jsx content
   */
  private generateAppFile(mashupData: MashupResponse): string {
    const components = mashupData.idea.apis.map(api => this.toPascalCase(api.name));
    const sanitizedAppName = this.sanitizeForJSX(mashupData.idea.appName);
    const sanitizedDescription = this.sanitizeForJSX(mashupData.idea.description);
    
    return `import React, { useState, useEffect } from 'react';
import './App.css';
${components.map(comp => `import ${comp} from './components/${comp}';`).join('\n')}

function App() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // TODO: Implement data fetching logic
      setData({});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading ${sanitizedAppName}...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>${sanitizedAppName}</h1>
        <p>${sanitizedDescription}</p>
      </header>
      
      <main className="App-main">
        ${components.map(comp => `<${comp} data={data.${comp.toLowerCase()}} />`).join('\n        ')}
      </main>
    </div>
  );
}

export default App;
`;
  }

  /**
   * Generate component file content
   */
  private generateComponentFile(filePath: string, mashupData: MashupResponse): string {
    const componentName = filePath.split('/').pop()?.replace('.jsx', '') || '';
    const api = mashupData.idea.apis.find(a => this.toPascalCase(a.name) === componentName);
    
    if (!api) {
      return `import React from 'react';\n\nconst ${componentName} = ({ data }) => {\n  return (\n    <div>\n      <h2>${componentName}</h2>\n      {/* TODO: Implement component */}\n    </div>\n  );\n};\n\nexport default ${componentName};\n`;
    }

    return `import React, { useState, useEffect } from 'react';

/**
 * ${componentName} Component
 * Displays data from ${api.name}
 */
const ${componentName} = ({ data }) => {
  const [localData, setLocalData] = useState(data || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // TODO: Implement refresh logic
      console.log('Refreshing ${api.name} data...');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="${componentName.toLowerCase()}-component">
      <div className="component-header">
        <h2>${api.name} Data</h2>
        <button onClick={handleRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="component-content">
        {localData && localData.length > 0 ? (
          <div className="data-display">
            {/* TODO: Implement data display logic */}
            <pre>{JSON.stringify(localData, null, 2)}</pre>
          </div>
        ) : (
          <div className="no-data">
            <p>No data available from ${api.name}</p>
            <p className="api-info">
              <strong>API:</strong> {api.baseUrl}
              <br />
              <strong>Category:</strong> ${api.category}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ${componentName};
`;
  }

  /**
   * Generate package.json for backend
   */
  private generateBackendPackageJson(mashupData: MashupResponse): string {
    return JSON.stringify({
      name: `${this.sanitizeFileName(mashupData.idea.appName)}-backend`,
      version: "1.0.0",
      description: mashupData.idea.description,
      main: "src/server.js",
      scripts: {
        start: "node src/server.js",
        dev: "nodemon src/server.js",
        test: "jest"
      },
      dependencies: {
        express: "^4.18.2",
        cors: "^2.8.5",
        axios: "^1.6.0",
        dotenv: "^16.3.1"
      },
      devDependencies: {
        nodemon: "^3.0.1",
        jest: "^29.7.0"
      }
    }, null, 2);
  }

  /**
   * Generate package.json for frontend
   */
  private generateFrontendPackageJson(mashupData: MashupResponse): string {
    return JSON.stringify({
      name: `${this.sanitizeFileName(mashupData.idea.appName)}-frontend`,
      version: "1.0.0",
      description: mashupData.idea.description,
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        axios: "^1.6.0"
      },
      scripts: {
        start: "react-scripts start",
        build: "react-scripts build",
        test: "react-scripts test",
        eject: "react-scripts eject"
      },
      devDependencies: {
        "react-scripts": "^5.0.1"
      }
    }, null, 2);
  }

  /**
   * Generate .env.example file
   */
  private generateEnvExample(mashupData: MashupResponse): string {
    const envVars = mashupData.idea.apis
      .filter(api => api.authType !== 'none')
      .map(api => `${api.name.toUpperCase()}_API_KEY=your_${api.name.toLowerCase()}_api_key_here`)
      .join('\n');

    return `# Environment Variables for ${mashupData.idea.appName}
PORT=3001

# API Keys
${envVars}

# Add other environment variables as needed
`;
  }

  /**
   * Generate README.md content
   */
  private generateReadme(mashupData: MashupResponse): string {
    const apiList = mashupData.idea.apis.map(api => 
      `- **${api.name}**: ${api.description} ([Documentation](${api.documentationUrl}))`
    ).join('\n');

    return `# ${mashupData.idea.appName}

${mashupData.idea.description}

## Features

${mashupData.idea.features.map(feature => `- ${feature}`).join('\n')}

## APIs Used

${apiList}

## Getting Started

### Backend Setup

1. Navigate to the backend directory
2. Install dependencies: \`npm install\`
3. Copy \`.env.example\` to \`.env\` and fill in your API keys
4. Start the server: \`npm run dev\`

### Frontend Setup

1. Navigate to the frontend directory
2. Install dependencies: \`npm install\`
3. Start the development server: \`npm start\`

## API Endpoints

- \`GET /health\` - Health check
${mashupData.idea.apis.map(api => `- \`GET /api/${api.name.toLowerCase()}\` - ${api.description}`).join('\n')}

## Development

This project was generated using Gyon. You can modify the code to suit your needs.

## License

MIT
`;
  }

  /**
   * Generate .gitignore content
   */
  private generateGitignore(): string {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
build/
dist/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs
*.log
`;
  }

  /**
   * Extract API specifications for better code completion
   */
  private extractAPISpecifications(mashupData: MashupResponse): APISpecification[] {
    return mashupData.idea.apis.map(api => ({
      name: api.name,
      baseUrl: api.baseUrl,
      authType: api.authType,
      documentation: api.documentationUrl,
      endpoints: [
        {
          path: api.sampleEndpoint,
          method: 'GET',
          description: `Sample endpoint for ${api.name}`,
          parameters: []
        }
      ]
    }));
  }

  /**
   * Utility methods
   */
  private generateFileId(path: string): string {
    return path.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private getLanguageFromPath(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'json': 'json',
      'md': 'markdown',
      'css': 'css',
      'html': 'html',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
    };
    return languageMap[extension || ''] || 'plaintext';
  }

  private sanitizeFileName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }

  private toCamelCase(str: string): string {
    return str.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase()).replace(/^[A-Z]/, c => c.toLowerCase());
  }

  private toPascalCase(str: string): string {
    const camelCase = this.toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  private sanitizeForComment(text: string): string {
    // Remove or escape characters that could break comments or code
    return text
      .replace(/\{/g, '(')  // Replace { with (
      .replace(/\}/g, ')')  // Replace } with )
      .replace(/\*/g, '')   // Remove * to avoid breaking /* */ comments
      .replace(/\/\*/g, '') // Remove /* 
      .replace(/\*\//g, '') // Remove */
      .trim();
  }

  private sanitizeForJSX(text: string): string {
    // Remove or escape characters that could break JSX
    return text
      .replace(/\{/g, '(')  // Replace { with (
      .replace(/\}/g, ')')  // Replace } with )
      .replace(/</g, '&lt;')  // Replace < with HTML entity
      .replace(/>/g, '&gt;')  // Replace > with HTML entity
      .replace(/"/g, '&quot;') // Replace " with HTML entity
      .replace(/'/g, '&#39;')  // Replace ' with HTML entity
      .trim();
  }
}

export const projectImportService = new ProjectImportService();
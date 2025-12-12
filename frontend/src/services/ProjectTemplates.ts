import { FileNode } from '../components/FileExplorer';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  files: FileNode[];
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export class ProjectTemplatesService {
  private static instance: ProjectTemplatesService;

  private constructor() {}

  static getInstance(): ProjectTemplatesService {
    if (!ProjectTemplatesService.instance) {
      ProjectTemplatesService.instance = new ProjectTemplatesService();
    }
    return ProjectTemplatesService.instance;
  }

  getTemplates(): ProjectTemplate[] {
    return [
      this.getVanillaJSTemplate(),
      this.getReactTemplate(),
      this.getNodeExpressTemplate(),
      this.getVueTemplate(),
      this.getTypeScriptTemplate(),
      this.getPythonFlaskTemplate(),
      this.getHTMLCSSTemplate(),
      this.getAPIClientTemplate()
    ];
  }

  getTemplate(id: string): ProjectTemplate | null {
    return this.getTemplates().find(template => template.id === id) || null;
  }

  getTemplatesByCategory(category: string): ProjectTemplate[] {
    return this.getTemplates().filter(template => template.category === category);
  }

  getCategories(): string[] {
    const categories = this.getTemplates().map(template => template.category);
    return [...new Set(categories)];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  private getVanillaJSTemplate(): ProjectTemplate {
    return {
      id: 'vanilla-js',
      name: 'Vanilla JavaScript',
      description: 'Simple HTML, CSS, and JavaScript project',
      category: 'Frontend',
      icon: '🟨',
      files: [
        {
          id: this.generateId(),
          name: 'index.html',
          type: 'file',
          path: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vanilla JS Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <h1>Hello, World!</h1>
        <button id="clickBtn">Click me!</button>
        <p id="output"></p>
    </div>
    <script src="script.js"></script>
</body>
</html>`
        },
        {
          id: this.generateId(),
          name: 'style.css',
          type: 'file',
          path: 'style.css',
          content: `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

#app {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
    color: #333;
    text-align: center;
}

button {
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

button:hover {
    background: #0056b3;
}

#output {
    margin-top: 20px;
    padding: 10px;
    background: #e9ecef;
    border-radius: 4px;
}`
        },
        {
          id: this.generateId(),
          name: 'script.js',
          type: 'file',
          path: 'script.js',
          content: `// Vanilla JavaScript Project
document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('clickBtn');
    const output = document.getElementById('output');
    let clickCount = 0;

    button.addEventListener('click', function() {
        clickCount++;
        output.textContent = \`Button clicked \${clickCount} time\${clickCount === 1 ? '' : 's'}!\`;
    });

    console.log('Vanilla JS project loaded successfully!');
});`
        }
      ]
    };
  }

  private getReactTemplate(): ProjectTemplate {
    return {
      id: 'react',
      name: 'React App',
      description: 'Modern React application with hooks',
      category: 'Frontend',
      icon: '⚛️',
      files: [
        {
          id: this.generateId(),
          name: 'src',
          type: 'folder',
          path: 'src',
          children: [
            {
              id: this.generateId(),
              name: 'App.jsx',
              type: 'file',
              path: 'src/App.jsx',
              content: `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>React App</h1>
        <div className="counter">
          <p>Count: {count}</p>
          <button onClick={() => setCount(count + 1)}>
            Increment
          </button>
          <button onClick={() => setCount(count - 1)}>
            Decrement
          </button>
          <button onClick={() => setCount(0)}>
            Reset
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;`
            },
            {
              id: this.generateId(),
              name: 'App.css',
              type: 'file',
              path: 'src/App.css',
              content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.counter {
  margin: 20px 0;
}

.counter p {
  font-size: 24px;
  margin-bottom: 20px;
}

.counter button {
  margin: 0 10px;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #61dafb;
  color: #282c34;
  transition: background-color 0.3s;
}

.counter button:hover {
  background: #21a9c7;
}`
            },
            {
              id: this.generateId(),
              name: 'index.js',
              type: 'file',
              path: 'src/index.js',
              content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
            }
          ]
        },
        {
          id: this.generateId(),
          name: 'public',
          type: 'folder',
          path: 'public',
          children: [
            {
              id: this.generateId(),
              name: 'index.html',
              type: 'file',
              path: 'public/index.html',
              content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
</body>
</html>`
            }
          ]
        },
        {
          id: this.generateId(),
          name: 'package.json',
          type: 'file',
          path: 'package.json',
          content: JSON.stringify({
            name: 'react-app',
            version: '1.0.0',
            description: 'A React application',
            main: 'src/index.js',
            scripts: {
              start: 'react-scripts start',
              build: 'react-scripts build',
              test: 'react-scripts test',
              eject: 'react-scripts eject'
            },
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0',
              'react-scripts': '^5.0.1'
            },
            browserslist: {
              production: ['>0.2%', 'not dead', 'not op_mini all'],
              development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
            }
          }, null, 2)
        }
      ],
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-scripts': '^5.0.1'
      },
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test'
      }
    };
  }
  private getNodeExpressTemplate(): ProjectTemplate {
    return {
      id: 'node-express',
      name: 'Node.js + Express',
      description: 'Backend API server with Express.js',
      category: 'Backend',
      icon: '🟢',
      files: [
        {
          id: this.generateId(),
          name: 'src',
          type: 'folder',
          path: 'src',
          children: [
            {
              id: this.generateId(),
              name: 'app.js',
              type: 'file',
              path: 'src/app.js',
              content: `const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Express API!',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]);
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      error: 'Name and email are required'
    });
  }
  
  const newUser = {
    id: Date.now(),
    name,
    email
  };
  
  res.status(201).json(newUser);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;`
            }
          ]
        },
        {
          id: this.generateId(),
          name: 'package.json',
          type: 'file',
          path: 'package.json',
          content: JSON.stringify({
            name: 'express-api',
            version: '1.0.0',
            description: 'Express.js API server',
            main: 'src/app.js',
            scripts: {
              start: 'node src/app.js',
              dev: 'nodemon src/app.js',
              test: 'jest'
            },
            dependencies: {
              express: '^4.18.2',
              cors: '^2.8.5',
              morgan: '^1.10.0'
            },
            devDependencies: {
              nodemon: '^2.0.22',
              jest: '^29.5.0'
            }
          }, null, 2)
        },
        {
          id: this.generateId(),
          name: 'README.md',
          type: 'file',
          path: 'README.md',
          content: `# Express API Server

A simple Express.js API server with CORS and logging middleware.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Start the production server:
   \`\`\`bash
   npm start
   \`\`\`

## API Endpoints

- \`GET /\` - Welcome message and API info
- \`GET /health\` - Health check endpoint
- \`GET /api/users\` - Get all users
- \`POST /api/users\` - Create a new user

## Environment Variables

- \`PORT\` - Server port (default: 3000)

## Features

- CORS enabled
- Request logging with Morgan
- JSON body parsing
- Error handling middleware
- 404 handler`
        }
      ],
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        morgan: '^1.10.0'
      },
      scripts: {
        start: 'node src/app.js',
        dev: 'nodemon src/app.js',
        test: 'jest'
      }
    };
  }

  private getVueTemplate(): ProjectTemplate {
    return {
      id: 'vue',
      name: 'Vue.js App',
      description: 'Vue.js application with composition API',
      category: 'Frontend',
      icon: '💚',
      files: [
        {
          id: this.generateId(),
          name: 'src',
          type: 'folder',
          path: 'src',
          children: [
            {
              id: this.generateId(),
              name: 'App.vue',
              type: 'file',
              path: 'src/App.vue',
              content: `<template>
  <div id="app">
    <header class="app-header">
      <h1>Vue.js App</h1>
      <div class="counter">
        <p>Count: {{ count }}</p>
        <button @click="increment">Increment</button>
        <button @click="decrement">Decrement</button>
        <button @click="reset">Reset</button>
      </div>
    </header>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'App',
  setup() {
    const count = ref(0)

    const increment = () => {
      count.value++
    }

    const decrement = () => {
      count.value--
    }

    const reset = () => {
      count.value = 0
    }

    return {
      count,
      increment,
      decrement,
      reset
    }
  }
}
</script>

<style>
#app {
  text-align: center;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

.app-header {
  background-color: #2c3e50;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.counter {
  margin: 20px 0;
}

.counter p {
  font-size: 24px;
  margin-bottom: 20px;
}

.counter button {
  margin: 0 10px;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #42b883;
  color: white;
  transition: background-color 0.3s;
}

.counter button:hover {
  background: #369870;
}
</style>`
            },
            {
              id: this.generateId(),
              name: 'main.js',
              type: 'file',
              path: 'src/main.js',
              content: `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`
            }
          ]
        },
        {
          id: this.generateId(),
          name: 'public',
          type: 'folder',
          path: 'public',
          children: [
            {
              id: this.generateId(),
              name: 'index.html',
              type: 'file',
              path: 'public/index.html',
              content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vue App</title>
</head>
<body>
    <noscript>
        <strong>We're sorry but this app doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
    </noscript>
    <div id="app"></div>
</body>
</html>`
            }
          ]
        },
        {
          id: this.generateId(),
          name: 'package.json',
          type: 'file',
          path: 'package.json',
          content: JSON.stringify({
            name: 'vue-app',
            version: '1.0.0',
            description: 'A Vue.js application',
            main: 'src/main.js',
            scripts: {
              serve: 'vue-cli-service serve',
              build: 'vue-cli-service build',
              lint: 'vue-cli-service lint'
            },
            dependencies: {
              vue: '^3.3.0'
            },
            devDependencies: {
              '@vue/cli-service': '^5.0.8'
            }
          }, null, 2)
        }
      ],
      dependencies: {
        vue: '^3.3.0'
      },
      scripts: {
        serve: 'vue-cli-service serve',
        build: 'vue-cli-service build'
      }
    };
  }
  private getTypeScriptTemplate(): ProjectTemplate {
    return {
      id: 'typescript',
      name: 'TypeScript Project',
      description: 'TypeScript project with modern tooling',
      category: 'Frontend',
      icon: '🔷',
      files: [
        {
          id: this.generateId(),
          name: 'src',
          type: 'folder',
          path: 'src',
          children: [
            {
              id: this.generateId(),
              name: 'index.ts',
              type: 'file',
              path: 'src/index.ts',
              content: `interface User {
  id: number;
  name: string;
  email: string;
}

class UserManager {
  private users: User[] = [];

  addUser(name: string, email: string): User {
    const user: User = {
      id: this.users.length + 1,
      name,
      email
    };
    this.users.push(user);
    return user;
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }
}

// Example usage
const userManager = new UserManager();
userManager.addUser('John Doe', 'john@example.com');
userManager.addUser('Jane Smith', 'jane@example.com');

console.log('All users:', userManager.getUsers());
console.log('User 1:', userManager.getUserById(1));`
            }
          ]
        },
        {
          id: this.generateId(),
          name: 'package.json',
          type: 'file',
          path: 'package.json',
          content: JSON.stringify({
            name: 'typescript-project',
            version: '1.0.0',
            description: 'A TypeScript project',
            main: 'dist/index.js',
            scripts: {
              build: 'tsc',
              start: 'node dist/index.js',
              dev: 'ts-node src/index.ts',
              watch: 'tsc --watch'
            },
            devDependencies: {
              typescript: '^5.0.0',
              'ts-node': '^10.9.0',
              '@types/node': '^18.0.0'
            }
          }, null, 2)
        },
        {
          id: this.generateId(),
          name: 'tsconfig.json',
          type: 'file',
          path: 'tsconfig.json',
          content: JSON.stringify({
            compilerOptions: {
              target: 'ES2020',
              module: 'commonjs',
              outDir: './dist',
              rootDir: './src',
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              forceConsistentCasingInFileNames: true
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist']
          }, null, 2)
        }
      ]
    };
  }
  private getPythonFlaskTemplate(): ProjectTemplate {
    return {
      id: 'python-flask',
      name: 'Python Flask API',
      description: 'Flask REST API with Python',
      category: 'Backend',
      icon: '🐍',
      files: [
        {
          id: this.generateId(),
          name: 'app.py',
          type: 'file',
          path: 'app.py',
          content: `from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Sample data
users = [
    {'id': 1, 'name': 'John Doe', 'email': 'john@example.com'},
    {'id': 2, 'name': 'Jane Smith', 'email': 'jane@example.com'}
]

@app.route('/')
def home():
    return jsonify({
        'message': 'Welcome to Flask API!',
        'version': '1.0.0',
        'endpoints': {
            'health': '/health',
            'users': '/api/users'
        }
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'OK',
        'message': 'Flask API is running'
    })

@app.route('/api/users', methods=['GET'])
def get_users():
    return jsonify(users)

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    
    if not data or 'name' not in data or 'email' not in data:
        return jsonify({'error': 'Name and email are required'}), 400
    
    new_user = {
        'id': len(users) + 1,
        'name': data['name'],
        'email': data['email']
    }
    
    users.append(new_user)
    return jsonify(new_user), 201

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = next((u for u in users if u['id'] == user_id), None)
    if user:
        return jsonify(user)
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)`
        },
        {
          id: this.generateId(),
          name: 'requirements.txt',
          type: 'file',
          path: 'requirements.txt',
          content: `Flask==2.3.2
Flask-CORS==4.0.0
python-dotenv==1.0.0`
        }
      ]
    };
  }

  private getHTMLCSSTemplate(): ProjectTemplate {
    return {
      id: 'html-css',
      name: 'HTML/CSS Website',
      description: 'Static website with HTML and CSS',
      category: 'Frontend',
      icon: '🌐',
      files: [
        {
          id: this.generateId(),
          name: 'index.html',
          type: 'file',
          path: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <nav>
            <h1>My Website</h1>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section id="home" class="hero">
            <h2>Welcome to My Website</h2>
            <p>This is a beautiful static website built with HTML and CSS.</p>
            <button class="cta-button">Get Started</button>
        </section>

        <section id="about" class="content-section">
            <h2>About Us</h2>
            <p>We create amazing web experiences with clean, modern design.</p>
        </section>

        <section id="contact" class="content-section">
            <h2>Contact</h2>
            <p>Get in touch with us for your next project.</p>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 My Website. All rights reserved.</p>
    </footer>
</body>
</html>`
        }
      ]
    };
  }
  private getAPIClientTemplate(): ProjectTemplate {
    return {
      id: 'api-client',
      name: 'API Client',
      description: 'JavaScript client for consuming REST APIs',
      category: 'Utility',
      icon: '🔌',
      files: [
        {
          id: this.generateId(),
          name: 'src',
          type: 'folder',
          path: 'src',
          children: [
            {
              id: this.generateId(),
              name: 'api-client.js',
              type: 'file',
              path: 'src/api-client.js',
              content: `class APIClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    this.timeout = options.timeout || 10000;
  }

  async request(endpoint, options = {}) {
    const url = \`\${this.baseURL}\${endpoint}\`;
    const config = {
      method: options.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? \`\${endpoint}?\${queryString}\` : endpoint;
    return this.request(url);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

// Example usage
const client = new APIClient('https://jsonplaceholder.typicode.com');

// Get all posts
client.get('/posts')
  .then(posts => console.log('Posts:', posts))
  .catch(error => console.error('Error:', error));

// Create a new post
client.post('/posts', {
  title: 'My New Post',
  body: 'This is the content of my post',
  userId: 1
})
  .then(post => console.log('Created post:', post))
  .catch(error => console.error('Error:', error));

export default APIClient;`
            }
          ]
        }
      ]
    };
  }
}

export default ProjectTemplatesService;
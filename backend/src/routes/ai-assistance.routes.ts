/**
 * AI Code Assistance Routes
 * API endpoints for AI-powered code assistance features
 */

import { Router, Request, Response } from 'express';
import { aiCodeAssistanceService, CodeContext } from '../services/AICodeAssistanceService';

const router = Router();

/**
 * POST /api/ai-assistance/completions
 * Get code completions for the given context
 */
router.post('/completions', async (req: Request, res: Response): Promise<void> => {
  try {
    // Basic validation
    const { content, language, position } = req.body;
    if (!content || !language || !position) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: content, language, position',
      });
      return;
    }

    const context: CodeContext = {
      content,
      language,
      position,
      filename: req.body.filename,
    };

    const completions = await aiCodeAssistanceService.getCodeCompletions(context);

    res.json({
      success: true,
      data: {
        completions,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Code completion error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get code completions',
    });
  }
});

/**
 * POST /api/ai-assistance/explain
 * Explain the given code
 */
router.post('/explain', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language } = req.body;
    if (!code || !language) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: code, language',
      });
      return;
    }

    const explanation = await aiCodeAssistanceService.explainCode(code, language);

    res.json({
      success: true,
      data: {
        explanation,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Code explanation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to explain code',
    });
  }
});

/**
 * POST /api/ai-assistance/generate
 * Generate code from natural language description
 */
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, language, context } = req.body;
    if (!description || !language) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: description, language',
      });
      return;
    }

    const generatedCode = await aiCodeAssistanceService.generateCode(description, language, context);

    res.json({
      success: true,
      data: {
        code: generatedCode,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate code',
    });
  }
});

/**
 * POST /api/ai-assistance/refactor
 * Get refactoring suggestions for code
 */
router.post('/refactor', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language } = req.body;
    if (!code || !language) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: code, language',
      });
      return;
    }

    const suggestions = await aiCodeAssistanceService.getRefactoringSuggestions(code, language);

    res.json({
      success: true,
      data: {
        suggestions,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Refactoring suggestions error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get refactoring suggestions',
    });
  }
});

/**
 * POST /api/ai-assistance/generate-from-comments
 * Generate code from comments/description
 */
router.post('/generate-from-comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { comments, language, context } = req.body;
    if (!comments || !language) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: comments, language',
      });
      return;
    }

    const generatedCode = await aiCodeAssistanceService.generateCodeFromComments(comments, language, context);

    res.json({
      success: true,
      data: {
        code: generatedCode,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Code generation from comments error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate code from comments',
    });
  }
});

/**
 * POST /api/ai-assistance/fix-error
 * Get error fix suggestions
 */
router.post('/fix-error', async (req: Request, res: Response): Promise<void> => {
  try {
    const { errorMessage, code, language } = req.body;
    if (!errorMessage || !code || !language) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: errorMessage, code, language',
      });
      return;
    }

    const fixes = await aiCodeAssistanceService.suggestErrorFixes(errorMessage, code, language);

    res.json({
      success: true,
      data: {
        fixes,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fix suggestions error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get error fix suggestions',
    });
  }
});

/**
 * POST /api/ai-assistance/generate-docs
 * Generate documentation for code
 */
router.post('/generate-docs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language } = req.body;
    if (!code || !language) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: code, language',
      });
      return;
    }

    const documentation = await aiCodeAssistanceService.generateDocumentation(code, language);

    res.json({
      success: true,
      data: {
        documentation,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Documentation generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate documentation',
    });
  }
});

/**
 * GET /api/ai-assistance/status
 * Check AI assistance availability
 */
router.get('/status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const isAvailable = await aiCodeAssistanceService.isAvailable();

    res.json({
      success: true,
      data: {
        available: isAvailable,
        service: 'ollama',
        model: process.env.OLLAMA_MODEL || 'codellama',
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('AI assistance status check error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check AI assistance status',
    });
  }
});

export default router;
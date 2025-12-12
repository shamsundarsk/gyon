/**
 * Project Sharing Routes
 * API endpoints for project sharing and collaboration features
 */

import { Router, Request, Response } from 'express';
import { projectSharingService } from '../services/ProjectSharingService';

const router = Router();

/**
 * POST /api/projects/share
 * Share a project and get a shareable URL
 */
router.post('/share', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, files, isPublic, tags } = req.body;
    
    if (!name || !files || !Array.isArray(files)) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, files',
      });
      return;
    }

    const sharedProject = await projectSharingService.shareProject({
      name,
      description: description || '',
      files,
      isPublic: isPublic || false,
      tags: tags || [],
    });

    res.json({
      success: true,
      data: {
        project: sharedProject,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Project sharing error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share project',
    });
  }
});

/**
 * GET /api/projects/load/:projectId
 * Load a shared project by ID
 */
router.get('/load/:projectId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      res.status(400).json({
        success: false,
        error: 'Project ID is required',
      });
      return;
    }

    const project = await projectSharingService.loadSharedProject(projectId);

    res.json({
      success: true,
      data: {
        project,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Project loading error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load project',
    });
  }
});

/**
 * POST /api/projects/load-by-url
 * Load a shared project by share URL
 */
router.post('/load-by-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareUrl } = req.body;
    
    if (!shareUrl) {
      res.status(400).json({
        success: false,
        error: 'Share URL is required',
      });
      return;
    }

    const project = await projectSharingService.loadSharedProjectByUrl(shareUrl);

    res.json({
      success: true,
      data: {
        project,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Project loading by URL error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load project by URL',
    });
  }
});

/**
 * GET /api/projects/gallery
 * Get project gallery/templates
 */
router.get('/gallery', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, tags, search, sortBy } = req.query;
    
    const filters = {
      category: category as string,
      tags: tags ? (tags as string).split(',') : undefined,
      search: search as string,
      sortBy: sortBy as 'downloads' | 'rating' | 'recent',
    };

    const templates = await projectSharingService.getProjectGallery(filters);

    res.json({
      success: true,
      data: {
        templates,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Project gallery error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load project gallery',
    });
  }
});

/**
 * PUT /api/projects/:projectId
 * Update a shared project
 */
router.put('/:projectId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const updates = req.body;
    
    if (!projectId) {
      res.status(400).json({
        success: false,
        error: 'Project ID is required',
      });
      return;
    }

    const updatedProject = await projectSharingService.updateSharedProject(projectId, updates);

    res.json({
      success: true,
      data: {
        project: updatedProject,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Project update error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    });
  }
});

/**
 * DELETE /api/projects/:projectId
 * Delete a shared project
 */
router.delete('/:projectId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      res.status(400).json({
        success: false,
        error: 'Project ID is required',
      });
      return;
    }

    await projectSharingService.deleteSharedProject(projectId);

    res.json({
      success: true,
      data: {
        message: 'Project deleted successfully',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Project deletion error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    });
  }
});

/**
 * POST /api/collaboration/start
 * Start a collaboration session
 */
router.post('/collaboration/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      res.status(400).json({
        success: false,
        error: 'Project ID is required',
      });
      return;
    }

    const session = await projectSharingService.startCollaborationSession(projectId);

    res.json({
      success: true,
      data: {
        session,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Collaboration start error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start collaboration session',
    });
  }
});

/**
 * POST /api/collaboration/join
 * Join a collaboration session
 */
router.post('/collaboration/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, participantName } = req.body;
    
    if (!sessionId || !participantName) {
      res.status(400).json({
        success: false,
        error: 'Session ID and participant name are required',
      });
      return;
    }

    const session = await projectSharingService.joinCollaborationSession(sessionId, participantName);

    res.json({
      success: true,
      data: {
        session,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Collaboration join error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to join collaboration session',
    });
  }
});

export default router;
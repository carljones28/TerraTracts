import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage as dbStorage } from "./storage";
import { insertUserSchema, insertLandPropertySchema, insertFavoriteSchema, insertVerificationAttemptSchema, insertVisualPinSchema, insertLandTractSchema } from "@shared/schema";
import { z } from "zod";
import { addMinutes, isPast } from "date-fns";
import crypto from "crypto";
import { setupAuth, requireRole } from "./auth";
// Temporarily disabled scraper service to fix startup issues
// import { handleScrapeRequest, handleListScrapers, startScraperService } from "./scraper_proxy";
import { processPropertyWithAI } from "./ai-extraction";
import { setupAgentRoutes } from "./agent-routes";
import { setupTeamsRoutes } from "./teams-routes";
import { setupContactRoutes } from "./contact-routes";
import { handleClimateRiskRequest } from "./climate-risk-api";
import { setupPerformanceOptimizations } from "./performance-optimizations";
import { getStateAbbreviation } from "../shared/state-mapping";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up performance optimizations
  await setupPerformanceOptimizations();
  
  // Set up authentication
  setupAuth(app);
  
  // Set up agent routes
  setupAgentRoutes(app);
  
  // Set up teams routes
  setupTeamsRoutes(app);
  
  // Set up contact routes
  setupContactRoutes(app);
  
  // Configure multer for file uploads
  // Create storage configuration
  const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      // Create a unique filename with original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'property-' + uniqueSuffix + ext);
    }
  });

  // Filter function to accept only images
  const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
  
  // Filter function to accept only videos
  const videoFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
  
  // Filter function to accept common document file types
  const documentFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
      'application/pdf', // PDF
      'application/msword', // DOC
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.ms-excel', // XLS
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'text/plain', // TXT
      'application/rtf', // RTF
      'application/zip', // ZIP
      'application/x-zip-compressed', // Another ZIP MIME type
      'image/jpeg', // JPG, JPEG
      'image/png', // PNG
      'image/gif', // GIF
      'image/tiff' // TIFF
    ];
    
    console.log("Document upload file:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      allowed: allowedMimeTypes.includes(file.mimetype)
    });
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Reject with an error instead of silently failing
      cb(new Error(`File type ${file.mimetype} not allowed. Accepted types: ${allowedMimeTypes.join(', ')}`));
    }
  };

  // Setup the upload middleware for images
  const imageUpload = multer({ 
    storage: uploadStorage, // uploadStorage is the multer disk storage config
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });
  
  // Setup the upload middleware for videos
  const videoUpload = multer({ 
    storage: uploadStorage,
    fileFilter: videoFileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB limit for videos
    }
  });
  
  // Setup the upload middleware for documents
  const documentUpload = multer({ 
    storage: uploadStorage,
    fileFilter: documentFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit for documents
    }
  });
  
  // Add route for uploading property images
  app.post("/api/upload/property-image", imageUpload.single('image'), (req: Request, res: Response) => {
    try {
      console.log("Received image upload request:", {
        authenticated: req.isAuthenticated(),
        contentType: req.headers['content-type'],
        hasFile: !!req.file
      });
      
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to upload images" });
      }
      
      if (!req.file) {
        console.error("No file in upload request");
        return res.status(400).json({ message: "No image file uploaded" });
      }
      
      // Verify upload directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o777 });
        console.log("Created uploads directory on demand");
      }
      
      // Verify the file was saved properly
      if (!fs.existsSync(req.file.path)) {
        console.error(`Uploaded file not found at path: ${req.file.path}`);
        return res.status(500).json({ message: "Failed to save uploaded file" });
      }
      
      // Make sure the file is readable
      fs.accessSync(req.file.path, fs.constants.R_OK);
      
      // Generate the URL path for the uploaded file (no trailing slash in baseUrl)
      const baseUrl = req.protocol + '://' + req.get('host');
      const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
      
      console.log("Image uploaded successfully:", {
        originalName: req.file.originalname,
        savedAs: req.file.filename,
        fullPath: req.file.path,
        size: req.file.size,
        imageUrl: imageUrl
      });
      
      // Return the file path that can be stored in the property's images array
      res.status(201).json({ 
        message: "Image uploaded successfully",
        imageUrl: imageUrl
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ 
        message: "Failed to upload image",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Add route for uploading property videos
  app.post("/api/upload/property-video", videoUpload.single('video'), (req: Request, res: Response) => {
    try {
      console.log("Received video upload request:", {
        authenticated: req.isAuthenticated(),
        contentType: req.headers['content-type'],
        hasFile: !!req.file
      });
      
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to upload videos" });
      }
      
      if (!req.file) {
        console.error("No file in upload request");
        return res.status(400).json({ message: "No video file uploaded" });
      }
      
      // Verify upload directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o777 });
        console.log("Created uploads directory on demand");
      }
      
      // Verify the file was saved properly
      if (!fs.existsSync(req.file.path)) {
        console.error(`Uploaded file not found at path: ${req.file.path}`);
        return res.status(500).json({ message: "Failed to save uploaded file" });
      }
      
      // Make sure the file is readable
      fs.accessSync(req.file.path, fs.constants.R_OK);
      
      // IMPORTANT: Return a proper API streaming URL for reliable playback,
      // not a direct file path which doesn't handle range requests properly
      const videoUrl = `/api/videos/${req.file.filename}`;
      
      console.log("Video uploaded successfully:", {
        originalName: req.file.originalname,
        savedAs: req.file.filename,
        fullPath: req.file.path,
        size: req.file.size,
        videoUrl: videoUrl
      });
      
      // Return the API endpoint URL directly - this removes the client-side transformation
      // which was causing inconsistency issues
      res.status(201).json({ 
        message: "Video uploaded successfully",
        videoUrl: videoUrl
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ 
        message: "Failed to upload video",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Add route for uploading property documents
  app.post("/api/upload/property-document", documentUpload.single('document'), (req: Request, res: Response) => {
    try {
      console.log("Received document upload request:", {
        authenticated: req.isAuthenticated(),
        contentType: req.headers['content-type'],
        hasFile: !!req.file
      });
      
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to upload documents" });
      }
      
      if (!req.file) {
        console.error("No file in upload request");
        return res.status(400).json({ message: "No document file uploaded" });
      }
      
      // Verify upload directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o777 });
        console.log("Created uploads directory on demand");
      }
      
      // Create documents subdirectory if needed
      const docsDir = path.join(uploadsDir, 'documents');
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true, mode: 0o777 });
        console.log("Created documents subdirectory on demand");
      }
      
      // Verify the file was saved properly
      if (!fs.existsSync(req.file.path)) {
        console.error(`Uploaded file not found at path: ${req.file.path}`);
        return res.status(500).json({ message: "Failed to save uploaded file" });
      }
      
      // Make sure the file is readable
      fs.accessSync(req.file.path, fs.constants.R_OK);
      
      // Generate the URL path for the uploaded file - use relative URL
      const documentUrl = `/uploads/${req.file.filename}`;
      
      // Get document type from mime type
      const documentType = req.file.mimetype;
      
      console.log("Document uploaded successfully:", {
        originalName: req.file.originalname,
        savedAs: req.file.filename,
        fullPath: req.file.path,
        size: req.file.size,
        documentUrl: documentUrl,
        documentType: documentType
      });
      
      // Return the document information
      res.status(201).json({ 
        message: "Document uploaded successfully",
        document: {
          name: req.file.originalname,
          url: documentUrl,
          type: documentType
        }
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ 
        message: "Failed to upload document",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Enhanced endpoint for video streaming with range requests support 
  // and comprehensive error handling and diagnostics
  app.get("/api/videos/:filename", (req: Request, res: Response) => {
    console.log(`🎥 STREAM API - File request received: ${req.params.filename}`);
    const filename = req.params.filename;
    
    // Log request details for debugging
    console.log(`🎥 VIDEO API - 📝 Request received for: ${filename}`);
    console.log(`🎥 VIDEO API - 📝 Request headers:`, req.headers);
    
    // First check if filename contains any path traversal attempts
    if (filename.includes('../') || filename.includes('..\\')) {
      console.error(`🎥 VIDEO API - ⚠️ Security warning: Path traversal attempt in ${filename}`);
      return res.status(403).json({ 
        message: "Invalid filename",
        error: "SECURITY_VIOLATION" 
      });
    }
    
    // Standard path using uploads directory
    let videoPath = path.join(process.cwd(), 'uploads', filename);
    console.log(`🎥 VIDEO API - 🔍 Looking for file at primary path: ${videoPath}`);
    
    // Comprehensive search for the video file
    let fileExists = fs.existsSync(videoPath);
    
    // If not found in primary location, try alternative locations
    if (!fileExists) {
      console.log(`🎥 VIDEO API - 🔍 Primary path not found, trying alternatives`);
      
      // Try various possible locations where videos might be stored
      const alternativePaths = [
        path.join(process.cwd(), 'uploads', 'videos', filename),    // /uploads/videos/ subdirectory
        path.join(process.cwd(), 'uploads', 'property', filename),  // /uploads/property/ subdirectory
        path.join(process.cwd(), 'public', 'uploads', filename),    // /public/uploads/ directory
        path.join(process.cwd(), 'public', 'videos', filename),     // /public/videos/ directory
        path.join(process.cwd(), filename),                         // project root directory
        path.join(process.cwd(), 'videos', filename)                // /videos/ directory in project root
      ];
      
      // Try each alternative path
      for (const altPath of alternativePaths) {
        console.log(`🎥 VIDEO API - 🔍 Checking alternative path: ${altPath}`);
        
        if (fs.existsSync(altPath)) {
          console.log(`🎥 VIDEO API - ✅ Found video at alternative path: ${altPath}`);
          videoPath = altPath;
          fileExists = true;
          break;
        }
      }
      
      // If still not found, check if there are any similarly named files
      if (!fileExists) {
        console.log(`🎥 VIDEO API - 🔍 Searching for similar filenames in uploads directory`);
        
        try {
          // Check for similarly named files in uploads directory (for debugging)
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            console.log(`🎥 VIDEO API - 📋 Files in uploads directory:`, files);
            
            // Check if there's a file with similar name (e.g., by property ID or timestamp part)
            const filenameBase = filename.split('-')[0]; // Get the first part of hyphenated name
            const similar = files.filter(f => f.includes(filenameBase) && f.endsWith('.mp4'));
            
            if (similar.length > 0) {
              console.log(`🎥 VIDEO API - 🔍 Found similar files:`, similar);
              
              // Use the first matching file
              const matchingFile = similar[0];
              videoPath = path.join(uploadsDir, matchingFile);
              console.log(`🎥 VIDEO API - ✅ Using similar file: ${videoPath}`);
              fileExists = true;
            }
          }
        } catch (err) {
          console.error(`🎥 VIDEO API - ❌ Error checking uploads directory:`, err);
        }
      }
      
      // Final check if the file was found anywhere
      if (!fileExists) {
        console.error(`🎥 VIDEO API - ❌ Video not found in any location: ${filename}`);
        return res.status(404).json({ 
          message: "Video not found",
          error: "FILE_NOT_FOUND",
          filename: filename,
          requestedPath: videoPath,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log(`🎥 VIDEO API - ✅ Found video file: ${videoPath}`);
    
    // Get file extension and determine content type for response
    const contentType = getContentTypeFromFilename(filename);
    console.log(`🎥 VIDEO API - Serving with content type: ${contentType}`);
    
    // Get file size for range requests
    const fileSize = fs.statSync(videoPath).size;
    console.log(`🎥 VIDEO API - Video file size: ${fileSize} bytes`);
    const range = req.headers.range;
    
    // Handle range requests for video streaming
    if (range) {
      // Parse the range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      // Validate range values
      if (isNaN(start) || isNaN(end) || start < 0 || end < 0 || start > end || end >= fileSize) {
        console.error(`Invalid range request: ${range} (fileSize: ${fileSize})`);
        res.status(416).send('Range Not Satisfiable');
        return;
      }
      
      const chunkSize = (end - start) + 1;
      
      console.log(`Serving video range request: ${range} for file ${filename}`);
      console.log(`Sending bytes ${start} to ${end} (${chunkSize} bytes)`);
      
      try {
        const headers = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cache-Control': 'max-age=3600', // Allow caching for better performance
          'ETag': `"${path.basename(videoPath)}-${fileSize}"` // Add an ETag for conditional requests
        };
        
        // Create read stream for the specified range
        const fileStream = fs.createReadStream(videoPath, { start, end });
        
        // Handle stream errors
        fileStream.on('error', (error) => {
          console.error(`Error streaming video file (range): ${error.message}`);
          if (!res.headersSent) {
            res.status(500).json({ message: "Error streaming video" });
          }
        });
        
        // Handle stream close
        fileStream.on('close', () => {
          console.log(`Video stream closed: ${filename} range ${start}-${end}`);
        });
        
        res.writeHead(206, headers);
        fileStream.pipe(res);
      } catch (error) {
        console.error(`Exception when streaming range: ${String(error)}`);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error setting up video stream" });
        }
      }
    } else {
      // If no range request, serve the whole file
      console.log(`Serving full video file: ${filename}`);
      
      try {
        const headers = {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'max-age=3600', // Allow caching for better performance
          'ETag': `"${path.basename(videoPath)}-${fileSize}"` // Add an ETag for conditional requests
        };
        
        res.writeHead(200, headers);
        
        const fileStream = fs.createReadStream(videoPath);
        
        // Handle stream errors
        fileStream.on('error', (error) => {
          console.error(`Error streaming full video file: ${error.message}`);
          if (!res.headersSent) {
            res.status(500).json({ message: "Error streaming video" });
          }
        });
        
        // Handle stream close
        fileStream.on('close', () => {
          console.log(`Video stream closed: ${filename} (full file)`);
        });
        
        fileStream.pipe(res);
      } catch (error) {
        console.error(`Exception when streaming full file: ${String(error)}`);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error setting up video stream" });
        }
      }
    }
  });
  
  // Helper function to get content type from filename
  function getContentTypeFromFilename(filename: string): string {
    const ext = path.extname(filename).substring(1).toLowerCase();
    switch (ext) {
      case 'webm': return 'video/webm';
      case 'ogg': return 'video/ogg';
      case 'mov': return 'video/quicktime';
      case 'mp4': return 'video/mp4';
      default: return 'video/mp4'; // Default to mp4
    }
  }

  // Add route for getting Mapbox API key
  app.get("/api/config", (_req: Request, res: Response) => {
    res.json({
      mapboxApiKey: process.env.MAPBOX_API_KEY || ''
    });
  });
  
  // Add route for getting user's location based on IP
  app.get("/api/user/location", async (req: Request, res: Response) => {
    try {
      // Get client IP address (X-Forwarded-For for proxied requests)
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
                       req.socket.remoteAddress || 
                       '127.0.0.1';
                       
      console.log(`Getting location for client IP: ${clientIp}`);
      
      // Import the geolocation service
      const { getLocationFromIP } = await import('./services/geolocation-service');
      
      // Get the user's location based on their IP address
      const location = await getLocationFromIP(clientIp);
      
      // Return the location
      res.json(location);
    } catch (error) {
      console.error("Error getting user location from IP:", error);
      // Fallback to Dallas, TX if there's an error
      res.json({
        city: 'Dallas',
        state: 'TX',
        country: 'US',
        latitude: 32.7767,
        longitude: -96.7970
      });
    }
  });
  // User routes
  app.post("/api/users/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await dbStorage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const user = await dbStorage.createUser(userData);
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await dbStorage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Quick Profile Role Switching Shortcut
  app.post("/api/users/switch-role", async (req: Request, res: Response) => {
    try {
      // Must be authenticated to switch roles
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required to switch roles' });
      }
      
      const newRole = req.body.role;
      
      // Validate the role
      if (!['buyer', 'seller', 'agent'].includes(newRole)) {
        return res.status(400).json({ 
          message: 'Invalid role. Must be one of: buyer, seller, agent'
        });
      }
      
      // Get current user
      const userId = req.user.id;
      let updateData: any = { role: newRole };
      
      // If switching to agent role, also set isAgent flag
      if (newRole === 'agent') {
        updateData.isAgent = true;
      } else {
        // For non-agent roles, set isAgent to false
        updateData.isAgent = false;
      }
      
      // Update the user role
      const updatedUser = await dbStorage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Log the role switch
      console.log(`User ${userId} switched role to: ${newRole}`);
      
      // Don't return the password
      const { password, ...safeUser } = updatedUser;
      
      return res.status(200).json({ 
        message: `Role successfully changed to ${newRole}`,
        user: safeUser
      });
    } catch (error) {
      console.error('Error switching user role:', error);
      return res.status(500).json({ message: 'Server error switching user role' });
    }
  });

  // Land property routes
  app.get("/api/properties", async (req: Request, res: Response) => {
    try {
      const state = req.query.state as string | undefined;
      
      let properties;
      if (state) {
        // If a state is specified, filter by state
        console.log(`Filtering properties by state: ${state}`);
        properties = await dbStorage.getPropertiesByState(state);
        console.log(`Found ${properties.length} properties for state: ${state}`);
      } else {
        // Otherwise return all properties
        console.log('Getting all properties (no state filter)');
        properties = await dbStorage.getAllProperties();
      }
      
      // Fix the video URL field mapping for each property
      properties = properties.map(property => {
        if (!property.videoUrl && (property as any).video_url) {
          console.log(`🎥 API LIST - Fixing video_url to videoUrl mapping for property ${property.id}`);
          property.videoUrl = (property as any).video_url;
        }
        
        // Add default images if missing
        if (!property.images || property.images.length === 0) {
          property.images = [
            `https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&q=80`,
            `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&q=80`,
            `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&q=80`
          ];
        }
        
        return property;
      });
      
      return res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  
  // Add route for getting properties owned by the authenticated user (my-properties)
  app.get("/api/properties/my-properties", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view your properties" });
      }
      
      // Get the authenticated user's properties
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      let properties = await dbStorage.getPropertiesByOwner(userId);
      
      // Fix the video URL field mapping for each property
      properties = properties.map(property => {
        if (!property.videoUrl && (property as any).video_url) {
          console.log(`🎥 MY PROPERTIES - Fixing video_url to videoUrl mapping for property ${property.id}`);
          property.videoUrl = (property as any).video_url;
        }
        return property;
      });
      
      return res.json(properties);
    } catch (error) {
      console.error("Error fetching user's properties:", error);
      res.status(500).json({ message: "Failed to fetch your properties" });
    }
  });
  
  // Add route for getting inquiries related to a user's properties
  app.get("/api/inquiries", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view inquiries" });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      // Get inquiries where user is the recipient
      const inquiries = await dbStorage.getInquiriesByUser(userId, false);
      
      // Get property details for each inquiry
      const enrichedInquiries = await Promise.all(
        inquiries.map(async (inquiry) => {
          const property = await dbStorage.getProperty(inquiry.propertyId);
          
          return {
            ...inquiry,
            property: property || undefined
          };
        })
      );
      
      return res.json(enrichedInquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });
  
  // Add route for submitting an inquiry
  app.post("/api/inquiries", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to submit an inquiry" });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      const { propertyId, message, toUserId } = req.body;
      
      if (!propertyId || !message || !toUserId) {
        return res.status(400).json({ message: "Property ID, message, and recipient user ID are required" });
      }
      
      // Make sure the property exists
      const property = await dbStorage.getProperty(parseInt(propertyId));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Create the inquiry
      const inquiry = await dbStorage.createInquiry({
        propertyId: parseInt(propertyId),
        fromUserId: userId,
        toUserId: parseInt(toUserId),
        subject: req.body.subject || 'Property Inquiry',
        message,
        status: 'pending'
      });
      
      return res.status(201).json(inquiry);
    } catch (error) {
      console.error("Error creating inquiry:", error);
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });
  
  // Add route for updating an inquiry's status
  app.patch("/api/inquiries/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to update an inquiry" });
      }
      
      const inquiryId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Ensure the status is valid
      if (!['pending', 'responded', 'completed', 'declined'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be one of: pending, responded, completed, declined" });
      }
      
      // Make sure the inquiry exists
      const inquiry = await dbStorage.getInquiry(inquiryId);
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      // Make sure the user is authorized to update this inquiry (either the sender or recipient)
      const userId = req.user?.id;
      if (inquiry.fromUserId !== userId && inquiry.toUserId !== userId) {
        return res.status(403).json({ message: "You are not authorized to update this inquiry" });
      }
      
      // Update the inquiry status
      const success = await dbStorage.updateInquiryStatus(inquiryId, status);
      if (!success) {
        return res.status(500).json({ message: "Failed to update inquiry status" });
      }
      
      // Get the updated inquiry
      const updatedInquiry = await dbStorage.getInquiry(inquiryId);
      return res.json(updatedInquiry);
    } catch (error) {
      console.error("Error updating inquiry:", error);
      res.status(500).json({ message: "Failed to update inquiry" });
    }
  });

  app.get("/api/properties/featured", async (_req: Request, res: Response) => {
    try {
      // Set cache headers for 5 minutes
      res.set({
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'ETag': `"featured-${Date.now()}"`,
        'Vary': 'Accept-Encoding'
      });
      
      let properties = await dbStorage.getFeaturedProperties();
      
      // Fix the video URL field mapping and optimize images for each property
      properties = properties.map(property => {
        if (!property.videoUrl && (property as any).video_url) {
          console.log(`🎥 FEATURED - Fixing video_url to videoUrl mapping for property ${property.id}`);
          property.videoUrl = (property as any).video_url;
        }
        
        // Optimize images for faster loading
        if (property.images && Array.isArray(property.images)) {
          property.images = property.images.filter(img => img && typeof img === 'string');
        }
        
        // Add default images if missing
        if (!property.images || property.images.length === 0) {
          property.images = [
            `https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&q=80`,
            `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&q=80`,
            `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&q=80`
          ];
        }
        
        return property;
      });
      
      res.json(properties);
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      res.status(500).json({ message: "Failed to fetch featured properties" });
    }
  });

  app.get("/api/properties/type/:type", async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      let properties = await dbStorage.getPropertiesByType(type);
      
      // Fix the video URL field mapping for each property
      properties = properties.map(property => {
        if (!property.videoUrl && (property as any).video_url) {
          console.log(`🎥 TYPE - Fixing video_url to videoUrl mapping for property ${property.id}`);
          property.videoUrl = (property as any).video_url;
        }
        
        // Add default images if missing
        if (!property.images || property.images.length === 0) {
          property.images = [
            `https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&q=80`,
            `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&q=80`,
            `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&q=80`
          ];
        }
        
        return property;
      });
      
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties by type" });
    }
  });

  app.get("/api/properties/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || "";
      let properties = await dbStorage.searchProperties(query);
      
      // Fix the video URL field mapping for each property
      properties = properties.map(property => {
        if (!property.videoUrl && (property as any).video_url) {
          console.log(`🎥 SEARCH - Fixing video_url to videoUrl mapping for property ${property.id}`);
          property.videoUrl = (property as any).video_url;
        }
        
        // Add default images if missing
        if (!property.images || property.images.length === 0) {
          property.images = [
            `https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&q=80`,
            `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&q=80`,
            `https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&q=80`
          ];
        }
        
        return property;
      });
      
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to search properties" });
    }
  });

  // Add geospatial routes for properties near a point
  app.get("/api/properties/near", async (req: Request, res: Response) => {
    try {
      const { longitude, latitude, radius } = req.query;
      
      // Validate params
      if (!longitude || !latitude || !radius) {
        return res.status(400).json({ message: "longitude, latitude, and radius parameters are required" });
      }
      
      const lon = parseFloat(longitude as string);
      const lat = parseFloat(latitude as string);
      const radiusMiles = parseFloat(radius as string);
      
      if (isNaN(lon) || isNaN(lat) || isNaN(radiusMiles)) {
        return res.status(400).json({ message: "Invalid parameters. Longitude, latitude, and radius must be numbers" });
      }
      
      // Get properties within radius
      const properties = await dbStorage.getPropertiesWithinRadius(lon, lat, radiusMiles);
      res.json(properties);
    } catch (error) {
      console.error("Error finding properties within radius:", error);
      res.status(500).json({ message: "Failed to find properties within radius" });
    }
  });
  
  // Add route for trending properties in a location
  app.get("/api/properties/trending/location/:location", async (req: Request, res: Response) => {
    try {
      const location = req.params.location;
      const limit = parseInt(req.query.limit as string || "8");
      const useIPLocation = req.query.useIp === 'true';
      
      console.log(`Getting trending properties for location: ${location}, useIPLocation: ${useIPLocation}`);
      
      // Parse location string to extract city, state, etc.
      const locationTerms = location.split(',').map(term => term.trim().toLowerCase());

      // US state name → abbreviation map for better matching
      const usStateMap: Record<string, string> = {
        alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',
        connecticut:'CT',delaware:'DE',florida:'FL',georgia:'GA',hawaii:'HI',idaho:'ID',
        illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',kentucky:'KY',louisiana:'LA',
        maine:'ME',maryland:'MD',massachusetts:'MA',michigan:'MI',minnesota:'MN',
        mississippi:'MS',missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV',
        'new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY',
        'north carolina':'NC','north dakota':'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',
        pennsylvania:'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD',
        tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA',
        'west virginia':'WV',wisconsin:'WI',wyoming:'WY'
      };

      // Detect if this is a US-based search
      const allUsAbbrevs = Object.values(usStateMap);
      const isUsSearch = locationTerms.some(term =>
        usStateMap[term] !== undefined || allUsAbbrevs.includes(term.toUpperCase())
      );

      // US bounding box: lat 18-72, lon -180 to -50
      const isUsProperty = (p: any) => {
        const lat = parseFloat(p.latitude);
        const lon = parseFloat(p.longitude);
        return !isNaN(lat) && !isNaN(lon) && lat >= 18 && lat <= 72 && lon >= -180 && lon <= -50;
      };

      // Get IP address from request (X-Forwarded-For for proxied requests)
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
                       req.socket.remoteAddress || 
                       '127.0.0.1';
                       
      console.log(`Client IP address: ${clientIp}`);
      
      // Get all properties
      const allProperties = await dbStorage.getAllProperties();

      // Gate the entire candidate pool by geography upfront — US searches never see international listings
      const properties = isUsSearch
        ? allProperties.filter(isUsProperty)
        : allProperties;

      // Build expanded search terms: also add the state abbreviation so "texas" matches "TX"
      const expandedTerms = locationTerms.flatMap(term => {
        const abbrev = usStateMap[term];
        return abbrev ? [term, abbrev.toLowerCase()] : [term];
      });

      let filteredProperties;
      
      // Step 1: Exact city match (location field contains the city name)
      const cityTerm = locationTerms[0]; // e.g. "garland"
      filteredProperties = properties.filter(property => {
        const propertyLocation = property.location.toLowerCase();
        return propertyLocation.includes(cityTerm);
      });
        
      // Step 2: If no city match, try state-level match
      if (filteredProperties.length === 0) {
        console.log(`No exact city match for "${location}", trying state/region`);
        
        if (locationTerms.length > 1) {
          const stateTerm = locationTerms[locationTerms.length - 1];
          const stateAbbrev = (usStateMap[stateTerm] || stateTerm).toLowerCase();
          filteredProperties = properties.filter(property => {
            const propState = property.state?.toLowerCase() || '';
            const propLocation = property.location.toLowerCase();
            return propState === stateAbbrev ||
                   propState === stateTerm ||
                   propLocation.includes(stateAbbrev) ||
                   propLocation.includes(stateTerm);
          });
          console.log(`Found ${filteredProperties.length} properties in state/region: ${stateTerm}`);
        }
        
        // Step 3: Fallback — featured or random, still within the already-gated pool
        if (filteredProperties.length === 0) {
          console.log('No location matches, returning featured or random from candidate pool');
          const featuredCandidates = properties.filter(p => p.featured);
          filteredProperties = featuredCandidates.length > 0
            ? featuredCandidates
            : [...properties].sort(() => 0.5 - Math.random());
        }
      }
      
      // Sort by relevance and recency
      filteredProperties = filteredProperties
        .sort((a, b) => {
          // Featured properties first
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          
          // Then by creation date if available
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          
          return 0;
        })
        .slice(0, limit);
      
      res.json(filteredProperties);
    } catch (error) {
      console.error("Error finding trending properties:", error);
      res.status(500).json({ message: "Failed to find trending properties" });
    }
  });
  
  // Add route for properties in a bounding box (for map viewport)
  app.get("/api/properties/bbox", async (req: Request, res: Response) => {
    try {
      console.log("Bounding box query params:", req.query); // Debug received parameters
      
      const { minLng, minLat, maxLng, maxLat } = req.query;
      
      // Validate params
      if (!minLng || !minLat || !maxLng || !maxLat) {
        console.log("Missing parameters:", { minLng, minLat, maxLng, maxLat });
        return res.status(400).json({ message: "minLng, minLat, maxLng, and maxLat parameters are required" });
      }
      
      const minLong = parseFloat(minLng as string);
      const minLatitude = parseFloat(minLat as string);
      const maxLong = parseFloat(maxLng as string);
      const maxLatitude = parseFloat(maxLat as string);
      
      if (isNaN(minLong) || isNaN(minLatitude) || isNaN(maxLong) || isNaN(maxLatitude)) {
        console.log("Invalid number parameters:", { minLong, minLatitude, maxLong, maxLatitude });
        return res.status(400).json({ message: "Invalid parameters. Coordinates must be numbers" });
      }
      
      // Get properties within bounding box
      const properties = await dbStorage.getPropertiesByBoundingBox(minLong, minLatitude, maxLong, maxLatitude);
      console.log(`Found ${properties.length} properties in bounding box`);
      res.json(properties);
    } catch (error) {
      console.error("Error finding properties in bounding box:", error);
      res.status(500).json({ message: "Failed to find properties in bounding box" });
    }
  });

  app.get("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🎥 API - Getting property with ID: ${id}`);
      const property = await dbStorage.getProperty(id);
      
      if (!property) {
        console.log(`🎥 API - Property not found with ID: ${id}`);
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Enhanced dual-format handling for video URLs
      // This ensures both camelCase and snake_case formats are available
      const videoUrl = property.videoUrl;
      const video_url = (property as any).video_url;
      
      // Synchronize the formats in both directions
      if (!videoUrl && video_url) {
        console.log(`🎥 API - Found video_url but no videoUrl, mapping snake_case to camelCase`);
        property.videoUrl = video_url;
      } else if (videoUrl && !video_url) {
        console.log(`🎥 API - Found videoUrl but no video_url, mapping camelCase to snake_case`);
        (property as any).video_url = videoUrl;
      } else if (videoUrl && video_url && videoUrl !== video_url) {
        // If both exist but are different, prioritize videoUrl (camelCase)
        console.log(`🎥 API - Found both formats but they differ, synchronizing to videoUrl value`);
        (property as any).video_url = videoUrl;
      }
      
      // Process document URLs - ensure they're relative paths
      console.log('📄 API - Documents check before processing:', {
        hasDocuments: !!property.documents,
        documentsType: typeof property.documents,
        isArray: Array.isArray(property.documents),
        documentsValue: property.documents,
        documentsStringified: JSON.stringify(property.documents)
      });

      if (property.documents && typeof property.documents === 'object') {
        if (!Array.isArray(property.documents)) {
          // If documents is an object but not an array, convert it to an array
          console.log('📄 API - Converting documents object to array');
          property.documents = Object.values(property.documents);
        }
        
        console.log('📄 API - Processing documents in property/:id endpoint:', property.documents);
        
        // Clean up document objects and ensure they're an array of properly structured objects
        property.documents = property.documents.map((doc, idx) => {
          // Handle case where it might be a string or malformed object
          if (typeof doc === 'string') {
            // It's just a URL string, create a full document object
            console.log(`📄 API - Converting string URL to document object: ${doc}`);
            return {
              url: doc,
              name: `Document ${idx + 1}`,
              type: 'application/octet-stream'
            };
          }
          
          if (!doc || typeof doc !== 'object') {
            console.log(`📄 API - Invalid document format, creating placeholder: ${doc}`);
            return {
              url: '',
              name: `Document ${idx + 1} (Invalid format)`,
              type: 'unknown'
            };
          }
          
          // Process URL to ensure it's relative
          let url = doc.url || '';
          if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
            try {
              // Extract the path part of the URL (after the domain)
              const urlObj = new URL(url);
              url = urlObj.pathname;
              console.log(`📄 API - Converting document URL from ${doc.url} to ${url}`);
            } catch (error) {
              console.error(`📄 API - Error converting document URL: ${url}`, error);
            }
          }
          
          // Return a clean document object with all required fields
          return {
            url,
            name: doc.name || `Document ${idx + 1}`,
            type: doc.type || 'application/octet-stream'
          };
        });
        
        console.log('📄 API - Final processed documents:', property.documents);
      } else if (property.documents === null || property.documents === undefined) {
        // Initialize as empty array if undefined or null
        console.log('📄 API - No documents found, initializing empty array');
        property.documents = [];
      } else if (typeof property.documents === 'string') {
        // Try to parse if it's a string
        console.log('📄 API - Documents is a string, attempting to parse:', property.documents);
        try {
          const parsed = JSON.parse(property.documents);
          if (Array.isArray(parsed)) {
            property.documents = parsed;
          } else if (parsed && typeof parsed === 'object') {
            property.documents = Object.values(parsed);
          } else {
            property.documents = [];
          }
          console.log('📄 API - Parsed documents from string:', property.documents);
        } catch (error) {
          console.error('📄 API - Failed to parse documents string:', error);
          property.documents = [];
        }
      }
      
      // Log video URL information
      console.log(`🎥 API - Property ${id} video data:`, {
        videoUrl: property.videoUrl,
        video_url: (property as any).video_url,
        videoMapped: property.videoUrl !== null && property.videoUrl === (property as any).video_url
      });
      
      res.json(property);
    } catch (error) {
      console.error(`🎥 API - Error fetching property ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });
  
  // Update a property
  app.put("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      console.log(`🔄 Property update request for ID ${req.params.id} from user:`, 
        req.isAuthenticated() ? req.user.id : 'unauthenticated',
        `Body keys: ${Object.keys(req.body).join(', ')}`);
      
      if (!req.isAuthenticated()) {
        console.log("❌ Update rejected: User not authenticated");
        return res.status(401).json({ message: "You must be logged in to update a property listing" });
      }

      const propertyId = parseInt(req.params.id);
      console.log(`📋 Getting property ${propertyId} details for update`);
      const property = await dbStorage.getProperty(propertyId);
      
      if (!property) {
        console.log(`❌ Property ${propertyId} not found for update`);
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Check if the user is the owner or if they have agent role
      const isOwner = property.ownerId === req.user.id;
      const isAgent = req.user.role === 'agent';
      
      console.log(`🔍 Checking permissions - User: ${req.user.id}, Owner: ${property.ownerId}, isOwner: ${isOwner}, isAgent: ${isAgent}`);
      
      if (!isOwner && !isAgent) {
        console.log(`❌ Permission denied for user ${req.user.id} to edit property ${propertyId}`);
        return res.status(403).json({ message: "You do not have permission to edit this property" });
      }
      
      // Process properties that might need special handling
      console.log(`🔄 Beginning property update preprocessing for ID ${propertyId}`);
      
      // Handle video URL updates - support both camelCase and snake_case formats
      // First, get the video URL from either format, prioritizing camelCase
      let sourceVideoUrl = null;
      let videoUrlSource = '';
      
      if (req.body.videoUrl) {
        sourceVideoUrl = req.body.videoUrl;
        videoUrlSource = 'videoUrl (camelCase)';
      } else if (req.body.video_url) {
        sourceVideoUrl = req.body.video_url;
        videoUrlSource = 'video_url (snake_case)';
      }
      
      if (sourceVideoUrl) {
        console.log(`🎥 UPDATE - Processing video URL from ${videoUrlSource}: ${sourceVideoUrl}`);
        
        // Process the video URL to the consistent format
        let finalVideoUrl = sourceVideoUrl;
        
        // If video URL already has the correct API path format, leave it
        if (sourceVideoUrl.startsWith('/api/videos/')) {
          console.log(`🎥 UPDATE - Video URL already has correct API path format: ${sourceVideoUrl}`);
        }
        // If video URL has /uploads/ format, convert it to the API streaming endpoint
        else if (sourceVideoUrl.includes('/uploads/')) {
          const videoFilename = sourceVideoUrl.split('/uploads/')[1];
          if (videoFilename) {
            // Use relative URL path which is more reliable across environments
            finalVideoUrl = `/api/videos/${videoFilename}`;
            console.log(`🎥 UPDATE - Transformed video URL to API endpoint: ${finalVideoUrl}`);
          } else {
            console.warn(`⚠️ UPDATE - Could not extract filename from uploads path: ${sourceVideoUrl}`);
            // Attempt to extract filename as a fallback
            const parts = sourceVideoUrl.split('/');
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.length > 0) {
              finalVideoUrl = `/api/videos/${lastPart}`;
              console.log(`🎥 UPDATE - Used fallback method for filename extraction: ${finalVideoUrl}`);
            } else {
              console.error(`❌ UPDATE - Could not extract filename at all: ${sourceVideoUrl}`);
              // Don't null it out in update - keep original
              console.log(`🎥 UPDATE - Keeping original video URL due to extraction failure`);
            }
          }
        }
        // For other URL formats (external videos), leave them as is
        
        // IMPORTANT: Only store the processed URL in camelCase format
        // This prevents "column 'video_url' specified more than once" error
        // The storage layer will handle the proper database field mapping
        req.body.videoUrl = finalVideoUrl;
        
        // IMPORTANT: Always delete the snake_case version to avoid duplicate column error
        if ('video_url' in req.body) {
          delete req.body.video_url;
        }
        
        console.log(`🎥 UPDATE - Final video URL stored in camelCase format only:`, {
          videoUrl: req.body.videoUrl
        });
      } else {
        console.log(`🎥 UPDATE - No video URL provided in update`);
      }
      
      // Check if images are being updated
      const { images = [] } = req.body;
      console.log(`🖼️ Processing ${images.length} images for property update`);
      
      // Process images if they're being updated
      if (images && Array.isArray(images)) {
        // Ensure image URLs are absolute (add protocol and host if they're relative)
        req.body.images = images.map(img => {
          if (img && typeof img === 'string' && img.startsWith('/uploads/')) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            return `${baseUrl}${img}`;
          }
          return img;
        });
        console.log(`🖼️ Processed image URLs to ensure they're absolute`);
      }
      
      // Build a merged data object that combines new data with existing data
      const mergedData = {
        ...property,
        ...req.body,
        
        // Make sure we preserve the owner ID
        ownerId: property.ownerId,
        
        // Make sure these are strings
        latitude: req.body.latitude ? String(req.body.latitude) : property.latitude,
        longitude: req.body.longitude ? String(req.body.longitude) : property.longitude,
        
        // Make sure these arrays are preserved
        utilities: Array.isArray(req.body.utilities) ? req.body.utilities : property.utilities,
        amenities: Array.isArray(req.body.amenities) ? req.body.amenities : property.amenities,
        features: Array.isArray(req.body.features) ? req.body.features : property.features,
        images: Array.isArray(req.body.images) ? req.body.images : property.images,
      };
      
      // Validate the property data
      console.log(`✅ Validating property update data`);
      const validatedData = insertLandPropertySchema.partial().parse(mergedData);
      
      // Process coordinates if latitude and longitude are provided
      if (validatedData.latitude !== undefined && validatedData.longitude !== undefined) {
        try {
          // Parse coordinates to ensure they are valid numbers with proper validation and cleaning
          let latitude = 0;
          let longitude = 0;
          
          // Handle latitude - ensure it's a clean, valid number
          if (typeof validatedData.latitude === 'string') {
            // Trim whitespace and remove any non-numeric chars except for decimal point and negative sign
            const cleanLatStr = validatedData.latitude.trim().replace(/[^\d.-]/g, '');
            latitude = parseFloat(cleanLatStr);
          } else if (typeof validatedData.latitude === 'number') {
            latitude = validatedData.latitude;
          }
          
          // Handle longitude - ensure it's a clean, valid number
          if (typeof validatedData.longitude === 'string') {
            // Trim whitespace and remove any non-numeric chars except for decimal point and negative sign
            const cleanLngStr = validatedData.longitude.trim().replace(/[^\d.-]/g, '');
            longitude = parseFloat(cleanLngStr);
          } else if (typeof validatedData.longitude === 'number') {
            longitude = validatedData.longitude;
          }
          
          // Skip if either coordinate is NaN or out of valid range
          if (!isNaN(latitude) && !isNaN(longitude) &&
              isFinite(latitude) && isFinite(longitude) &&
              latitude >= -90 && latitude <= 90 &&
              longitude >= -180 && longitude <= 180) {
            
            console.log(`📍 Updating property with coordinates: [${longitude}, ${latitude}]`);
            
            // Set explicit coordinates object using our cleaned values
            // This overrides any raw coordinate value to ensure proper formatting
            validatedData.coordinates = { 
              x: longitude, 
              y: latitude 
            };
            
            console.log(`📍 Set explicit coordinate object:`, validatedData.coordinates);
          } else {
            console.warn(`⚠️ Invalid coordinate values detected: latitude=${latitude}, longitude=${longitude}`);
            // Don't set coordinates if they're invalid
            delete validatedData.coordinates;
          }
        } catch (coordError) {
          console.warn('⚠️ Error processing coordinates:', coordError);
          // Remove coordinates to avoid errors
          delete validatedData.coordinates;
        }
      } else {
        // If we don't have both lat/long values, ensure we're not sending partial coordinates
        delete validatedData.coordinates;
      }
      
      // Update the property
      console.log(`💾 Executing property update in database for ID ${propertyId}`);
      const updatedProperty = await dbStorage.updateProperty(propertyId, validatedData);
      
      if (!updatedProperty) {
        console.log(`❌ Database update failed for property ${propertyId}`);
        return res.status(500).json({ message: "Failed to update property" });
      }
      
      console.log(`✅ Successfully updated property ${propertyId}`);
      res.json(updatedProperty);
    } catch (error) {
      console.error("❌ Error updating property:", error);
      
      if (error instanceof z.ZodError) {
        console.log("❌ Validation error:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ 
          message: "Invalid property data", 
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      res.status(500).json({ 
        message: "Failed to update property", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/properties", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to create a property listing" });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }

      // Extract images from the request body
      const { images = [] } = req.body;
      
      // Look for video URL in both camelCase and snake_case formats
      // Prioritize videoUrl (camelCase) if both are present
      let sourceVideoUrl = null;
      let videoUrlSource = '';
      
      if (req.body.videoUrl) {
        sourceVideoUrl = req.body.videoUrl;
        videoUrlSource = 'videoUrl (camelCase)';
      } else if (req.body.video_url) {
        sourceVideoUrl = req.body.video_url;
        videoUrlSource = 'video_url (snake_case)';
      }
      
      console.log("🎥 PROPERTY CREATE - Received property data:", {
        images: images.length > 0 ? `${images.length} images` : 'No images',
        sourceVideoUrl,
        videoUrlSource: videoUrlSource || 'Not provided'
      });

      // Add the current user as the owner and ensure numeric fields are properly formatted
      const propertyData = {
        ...req.body,
        ownerId: userId,
        // Ensure numeric fields have valid values (convert empty strings to 0)
        price: req.body.price === '' ? 0 : req.body.price,
        acreage: req.body.acreage === '' ? 0 : req.body.acreage,
        latitude: req.body.latitude === '' ? null : req.body.latitude,
        longitude: req.body.longitude === '' ? null : req.body.longitude
      };
      
      // Process the video URL if it exists
      let finalVideoUrl = null;
      
      if (sourceVideoUrl) {
        console.log("🎥 PROPERTY CREATE - Processing video URL:", sourceVideoUrl);
        
        // If video URL has /uploads/ format, convert it to /api/videos/ format
        if (sourceVideoUrl.includes('/uploads/')) {
          const videoFilename = sourceVideoUrl.split('/uploads/')[1];
          if (videoFilename) {
            finalVideoUrl = `/api/videos/${videoFilename}`;
            console.log("🎥 PROPERTY CREATE - Transformed video URL (uploads->api):", finalVideoUrl);
          } else {
            console.warn("⚠️ PROPERTY CREATE - Could not extract filename from uploads path:", sourceVideoUrl);
            // Attempt to extract filename as a fallback
            const parts = sourceVideoUrl.split('/');
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.length > 0) {
              finalVideoUrl = `/api/videos/${lastPart}`;
              console.log("🎥 PROPERTY CREATE - Used fallback method for filename extraction:", finalVideoUrl);
            } else {
              console.error("❌ PROPERTY CREATE - Could not extract filename at all:", sourceVideoUrl);
              finalVideoUrl = null;
            }
          }
        } else if (sourceVideoUrl.startsWith('/api/videos/')) {
          // Already in correct format, use as is
          console.log("🎥 PROPERTY CREATE - Video URL already in correct format:", sourceVideoUrl);
          finalVideoUrl = sourceVideoUrl;
        } else {
          // For external videos, use as is
          finalVideoUrl = sourceVideoUrl;
          console.log("🎥 PROPERTY CREATE - Using external video URL as is:", sourceVideoUrl);
        }
        
        // We'll now ONLY store the video URL in the videoUrl property,
        // and let the storage layer handle it properly. 
        // This prevents the "column 'video_url' specified more than once" error.
        propertyData.videoUrl = finalVideoUrl;   // Store in camelCase for processing
        
        // IMPORTANT: Always delete the snake_case version to avoid duplicate column error
        if ('video_url' in propertyData) {
          delete propertyData.video_url;
        }
        
        console.log("🎥 PROPERTY CREATE - Final video URL stored:", {
          videoUrl: propertyData.videoUrl
        });
      } else {
        console.log("🎥 PROPERTY CREATE - No video URL provided for this property");
        // We'll set only videoUrl property to null, and let the storage layer
        // handle the snake_case version properly
        propertyData.videoUrl = null;
        
        // Remove the snake_case property entirely to avoid duplicate column error
        // as we're focusing on using only the camelCase version upstream
        if ('video_url' in propertyData) {
          delete propertyData.video_url;
        }
      }
      
      // Double check the video URL was processed correctly
      console.log("🎥 PROPERTY CREATE - Final video URL:", {
        videoUrl: propertyData.videoUrl || 'Not set'
      });
      
      // If there are no images or empty image values, add default placeholder images
      if (!images || images.length === 0 || (typeof images === 'string' && !images.trim())) {
        // Generate default set of images based on property type
        const propertyType = propertyData.propertyType || 'land';
        const state = propertyData.state || 'texas';
        
        console.log("No images provided, using default land images");
        propertyData.images = [
          `https://images.unsplash.com/photo-129999?property=400&state=${state}`,
          `https://images.unsplash.com/photo-529227?property=636&state=${state}`,
          `https://images.unsplash.com/photo-8637?property=978&state=${state}`
        ];
      } else {
        // Ensure image URLs are absolute (add protocol and host if they're relative)
        if (Array.isArray(images)) {
          propertyData.images = images.map(img => {
            if (img.startsWith('/uploads/')) {
              const baseUrl = `${req.protocol}://${req.get('host')}`;
              return `${baseUrl}${img}`;
            }
            return img;
          });
          console.log("Processed image URLs:", propertyData.images);
        }
      }
      
      console.log("Final property data before validation:", {
        ...propertyData,
        videoUrl: propertyData.videoUrl || 'None'
      });
      
      // Validate the property data
      const validatedData = insertLandPropertySchema.parse(propertyData);
      
      // Create the property
      const property = await dbStorage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  // Land tract routes for property boundaries
  app.get("/api/properties/:propertyId/tracts", async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      const tracts = await dbStorage.getTractsByProperty(propertyId);
      res.json(tracts);
    } catch (error) {
      console.error("Error fetching tracts:", error);
      res.status(500).json({ message: "Failed to fetch tracts" });
    }
  });

  app.get("/api/tracts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tract ID" });
      }
      
      const tract = await dbStorage.getTract(id);
      if (!tract) {
        return res.status(404).json({ message: "Tract not found" });
      }
      res.json(tract);
    } catch (error) {
      console.error("Error fetching tract:", error);
      res.status(500).json({ message: "Failed to fetch tract" });
    }
  });

  app.post("/api/properties/:propertyId/tracts", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to create tracts" });
      }
      
      const propertyId = parseInt(req.params.propertyId);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      // Verify user has access to this property
      const property = await dbStorage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const isOwner = property.ownerId === req.user!.id;
      const isAgent = req.user!.role === 'agent';
      if (!isOwner && !isAgent) {
        return res.status(403).json({ message: "You do not have permission to create tracts for this property" });
      }
      
      const tractData = {
        ...req.body,
        propertyId
      };
      
      // Validate tract data
      const validatedData = insertLandTractSchema.parse(tractData);
      
      const tract = await dbStorage.createTract(validatedData);
      res.status(201).json(tract);
    } catch (error) {
      console.error("Error creating tract:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tract data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tract" });
    }
  });

  app.put("/api/tracts/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to update tracts" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tract ID" });
      }
      
      const tract = await dbStorage.getTract(id);
      if (!tract) {
        return res.status(404).json({ message: "Tract not found" });
      }
      
      // Verify user has access to the property
      const property = await dbStorage.getProperty(tract.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const isOwner = property.ownerId === req.user!.id;
      const isAgent = req.user!.role === 'agent';
      if (!isOwner && !isAgent) {
        return res.status(403).json({ message: "You do not have permission to update this tract" });
      }
      
      // Validate update data (partial validation)
      const updateSchema = insertLandTractSchema.partial().omit({ propertyId: true });
      const validatedData = updateSchema.parse(req.body);
      
      const updatedTract = await dbStorage.updateTract(id, validatedData);
      if (!updatedTract) {
        return res.status(500).json({ message: "Failed to update tract" });
      }
      res.json(updatedTract);
    } catch (error) {
      console.error("Error updating tract:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tract data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update tract" });
    }
  });

  app.delete("/api/tracts/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to delete tracts" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tract ID" });
      }
      
      const tract = await dbStorage.getTract(id);
      if (!tract) {
        return res.status(404).json({ message: "Tract not found" });
      }
      
      // Verify user has access to the property
      const property = await dbStorage.getProperty(tract.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const isOwner = property.ownerId === req.user!.id;
      const isAgent = req.user!.role === 'agent';
      if (!isOwner && !isAgent) {
        return res.status(403).json({ message: "You do not have permission to delete this tract" });
      }
      
      const success = await dbStorage.deleteTract(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete tract" });
      }
      res.json({ message: "Tract deleted successfully" });
    } catch (error) {
      console.error("Error deleting tract:", error);
      res.status(500).json({ message: "Failed to delete tract" });
    }
  });

  // Get child tracts (for split tracts)
  app.get("/api/tracts/:id/children", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tract ID" });
      }
      
      const children = await dbStorage.getChildTracts(id);
      res.json(children);
    } catch (error) {
      console.error("Error fetching child tracts:", error);
      res.status(500).json({ message: "Failed to fetch child tracts" });
    }
  });

  // Favorites routes
  app.get("/api/users/:userId/favorites", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const favorites = await dbStorage.getFavoritesByUser(userId);
      
      // Get the actual property details for each favorite
      const favoriteProperties = await Promise.all(
        favorites.map(async (favorite) => {
          const property = await dbStorage.getProperty(favorite.propertyId);
          return { favoriteId: favorite.id, ...property };
        })
      );
      
      res.json(favoriteProperties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // GET endpoint for current user's favorites
  app.get("/api/favorites", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user!.id;
      const favorites = await dbStorage.getFavoritesByUser(userId);
      
      // Get the actual property details for each favorite
      const favoriteProperties = await Promise.all(
        favorites.map(async (favorite) => {
          const property = await dbStorage.getProperty(favorite.propertyId);
          return { 
            ...favorite,
            property: property 
          };
        })
      );
      
      res.json(favoriteProperties);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log("POST /api/favorites - Request body:", req.body);
      console.log("POST /api/favorites - User:", req.user);
      
      // Add the user ID to the request body
      const favoriteData = insertFavoriteSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      console.log("POST /api/favorites - Parsed favorite data:", favoriteData);
      
      // Check if favorite already exists
      const existingFavorite = await dbStorage.getFavorite(
        favoriteData.userId,
        favoriteData.propertyId
      );
      
      if (existingFavorite) {
        return res.status(400).json({ message: "Property is already in favorites" });
      }
      
      const favorite = await dbStorage.createFavorite(favoriteData);
      console.log("POST /api/favorites - Created favorite:", favorite);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("POST /api/favorites - Error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid favorite data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await dbStorage.removeFavorite(id);
      
      if (!result) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });
  
  // Saved Searches routes
  app.get("/api/searches", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user!.id;
      const searches = await dbStorage.getSavedSearchesByUser(userId);
      
      res.json(searches);
    } catch (error) {
      console.error("Error fetching saved searches:", error);
      res.status(500).json({ message: "Failed to fetch saved searches" });
    }
  });
  
  // Create a new saved search
  app.post("/api/searches", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user!.id;
      const { name, criteria, notifyEmail, notifyFrequency } = req.body;
      
      if (!name || !criteria) {
        return res.status(400).json({ message: "Name and search criteria are required" });
      }
      
      const savedSearch = await dbStorage.createSavedSearch({
        userId,
        name,
        criteria,
        notifyEmail: notifyEmail || false,
        notifyFrequency: notifyFrequency || 'weekly'
      });
      
      res.status(201).json(savedSearch);
    } catch (error) {
      console.error("Error creating saved search:", error);
      res.status(500).json({ message: "Failed to create saved search" });
    }
  });
  
  // Update an existing saved search
  app.put("/api/searches/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user!.id;
      const searchId = parseInt(req.params.id);
      
      // First check if the search exists and belongs to this user
      const existingSearch = await dbStorage.getSavedSearch(searchId);
      
      if (!existingSearch) {
        return res.status(404).json({ message: "Saved search not found" });
      }
      
      if (existingSearch.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this saved search" });
      }
      
      // Update the search
      const updatedSearch = await dbStorage.updateSavedSearch(searchId, req.body);
      
      res.json(updatedSearch);
    } catch (error) {
      console.error("Error updating saved search:", error);
      res.status(500).json({ message: "Failed to update saved search" });
    }
  });
  
  // Delete a saved search
  app.delete("/api/searches/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user!.id;
      const searchId = parseInt(req.params.id);
      
      // First check if the search exists and belongs to this user
      const existingSearch = await dbStorage.getSavedSearch(searchId);
      
      if (!existingSearch) {
        return res.status(404).json({ message: "Saved search not found" });
      }
      
      if (existingSearch.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this saved search" });
      }
      
      // Delete the search
      const result = await dbStorage.removeSavedSearch(searchId);
      
      if (result) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete saved search" });
      }
    } catch (error) {
      console.error("Error deleting saved search:", error);
      res.status(500).json({ message: "Failed to delete saved search" });
    }
  });

  /************************************************************************
   * Property Boundary Routes
   ************************************************************************/
  
  // PUT /api/properties/:id/boundary - Update a property's boundary
  app.put("/api/properties/:id/boundary", async (req: Request, res: Response) => {
    try {
      console.log(`🗺️ Property boundary update request for ID ${req.params.id} from user:`, 
        req.isAuthenticated() ? req.user.id : 'unauthenticated');
      
      if (!req.isAuthenticated()) {
        console.log("❌ Boundary update rejected: User not authenticated");
        return res.status(401).json({ message: "You must be logged in to update a property boundary" });
      }

      const propertyId = parseInt(req.params.id);
      console.log(`📋 Getting property ${propertyId} details for boundary update`);
      const property = await dbStorage.getProperty(propertyId);
      
      if (!property) {
        console.log(`❌ Property ${propertyId} not found for boundary update`);
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Check if the user is the owner or if they have agent role
      const isOwner = property.ownerId === req.user.id;
      const isAgent = req.user.role === 'agent';
      
      console.log(`🔍 Checking boundary update permissions - User: ${req.user.id}, Owner: ${property.ownerId}, isOwner: ${isOwner}, isAgent: ${isAgent}`);
      
      if (!isOwner && !isAgent) {
        console.log(`❌ Permission denied for user ${req.user.id} to edit property ${propertyId} boundary`);
        return res.status(403).json({ message: "You do not have permission to edit this property's boundary" });
      }
      
      // Validate the boundary data
      if (!req.body.boundary) {
        console.log(`❌ No boundary data provided for property ${propertyId}`);
        return res.status(400).json({ message: "Boundary data is required" });
      }
      
      console.log(`🗺️ Updating boundary for property ${propertyId}`);
      
      // Update only the boundary field
      const updatedProperty = await dbStorage.updateProperty(
        propertyId,
        { boundary: req.body.boundary }
      );
      
      if (!updatedProperty) {
        console.log(`❌ Failed to update boundary for property ${propertyId}`);
        return res.status(500).json({ message: "Failed to update property boundary" });
      }
      
      console.log(`✅ Successfully updated boundary for property ${propertyId}`);
      res.status(200).json({ 
        success: true, 
        message: "Property boundary updated", 
        property: {
          id: updatedProperty.id,
          boundary: updatedProperty.boundary
        }
      });
    } catch (error) {
      console.error("Error updating property boundary:", error);
      res.status(500).json({ message: "Failed to update property boundary" });
    }
  });

  // Visual Pins API (Smart Bookmarking feature)
  app.get("/api/visualpins/:favoriteId", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const favoriteId = parseInt(req.params.favoriteId);
      if (isNaN(favoriteId)) {
        return res.status(400).json({ message: 'Invalid favorite ID' });
      }
      
      const pins = await dbStorage.getVisualPinsByFavorite(favoriteId);
      return res.status(200).json(pins);
    } catch (error) {
      console.error('Error fetching visual pins:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post("/api/visualpins", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { favoriteId, imageIndex, xPosition, yPosition, pinColor, label, note } = req.body;
      
      // Basic validation
      if (!favoriteId || imageIndex === undefined || xPosition === undefined || yPosition === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Create the visual pin with proper schema validation
      const pinData = insertVisualPinSchema.parse({
        favoriteId,
        imageIndex,
        xPosition,
        yPosition,
        pinColor: pinColor || null,
        label: label || null,
        note: note || null
      });
      
      const pin = await dbStorage.createVisualPin(pinData);
      return res.status(201).json(pin);
    } catch (error) {
      console.error('Error creating visual pin:', error);
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid visual pin data',
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.patch("/api/visualpins/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const { xPosition, yPosition, pinColor, label, note } = req.body;
      
      // Update only the provided fields
      const updateData: any = {};
      if (xPosition !== undefined) updateData.xPosition = xPosition;
      if (yPosition !== undefined) updateData.yPosition = yPosition;
      if (pinColor !== undefined) updateData.pinColor = pinColor;
      if (label !== undefined) updateData.label = label;
      if (note !== undefined) updateData.note = note;
      
      const updatedPin = await dbStorage.updateVisualPin(id, updateData);
      if (!updatedPin) {
        return res.status(404).json({ message: 'Visual pin not found' });
      }
      
      return res.status(200).json(updatedPin);
    } catch (error) {
      console.error('Error updating visual pin:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete("/api/visualpins/:id", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await dbStorage.removeVisualPin(id);
      if (!success) {
        return res.status(404).json({ message: 'Visual pin not found' });
      }
      
      return res.status(200).json({ message: 'Visual pin removed successfully' });
    } catch (error) {
      console.error('Error removing visual pin:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  // AI Search route with OpenAI integration - SmartMatch™ Technology
  app.post("/api/ai/search", async (req: Request, res: Response) => {
    try {
      const { query, latitude, longitude } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }
      
      // Store search coordinates for "nearest properties" fallback
      const searchCoordinates = (typeof latitude === 'number' && typeof longitude === 'number') 
        ? { lat: latitude, lng: longitude } 
        : null;
      
      // Get all properties to perform more advanced filtering
      const allProperties = await dbStorage.getAllProperties();
      
      let aiAnalysis = null;
      let criteria: any = {};
      
      // Try OpenAI first, then Claude, then fall back to basic search
      try {
        // Import dynamically to prevent circular dependency
        const { analyzePropertyQuery } = await import('./openai');
        
        // First, analyze the query using OpenAI to extract search criteria
        aiAnalysis = await analyzePropertyQuery(query);
        console.log('OpenAI analysis successful');
      } catch (openAiError) {
        console.error('OpenAI search failed, trying Claude fallback:', openAiError);
        
        // Fall back to Claude if OpenAI fails
        try {
          const { enhancedPropertyQueryAnalysis } = await import('./anthropic');
          const claudeAnalysis = await enhancedPropertyQueryAnalysis(query);
          
          // Format Claude's response to match the expected structure
          aiAnalysis = {
            properties: [],
            interpretation: claudeAnalysis
          };
          console.log('Claude fallback successful');
        } catch (claudeError) {
          console.error('Claude fallback also failed, using basic search:', claudeError);
          // Both AI providers failed - will use basic database search below
          aiAnalysis = null;
        }
      }
      
      // Log the AI interpretation for debugging
      if (aiAnalysis && aiAnalysis.interpretation) {
        console.log('SmartMatch™ interpretation:', JSON.stringify(aiAnalysis.interpretation, null, 2));
        criteria = aiAnalysis.interpretation.extractedCriteria || {};
      } else {
        console.log('No AI interpretation available - using basic search');
      }
      
      // Filter properties based on AI analysis OR basic search if AI failed
      let filteredProperties;
      
      // If both AI providers failed, use basic database search immediately
      if (!aiAnalysis || !criteria || Object.keys(criteria).length === 0) {
        console.log('Using basic database search (no AI criteria available)');
        filteredProperties = await dbStorage.searchProperties(query);
      } else {
        // AI analysis available - apply advanced filtering
        filteredProperties = [...allProperties];
        
        // Apply price range filter if available
        if (criteria.priceRange) {
        const priceText = criteria.priceRange.toLowerCase();
        // Extract numeric values from price range text
        const priceMatch = priceText.match(/(\d[\d,]*)/g);
        
        if (priceMatch && priceMatch.length > 0) {
          const maxPrice = parseInt(priceMatch[0].replace(/,/g, ''));
          
          if (!isNaN(maxPrice)) {
            filteredProperties = filteredProperties.filter(p => {
              // Convert price to number if it's a string
              const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
              return price <= maxPrice;
            });
          }
        }
        
        // Check for "under X" or "less than X" pricing
        if (priceText.includes('under') || priceText.includes('less than')) {
          const maxPrice = parseInt(priceText.match(/\d[\d,]*/)?.[0].replace(/,/g, '') || '0');
          if (!isNaN(maxPrice)) {
            filteredProperties = filteredProperties.filter(p => {
              // Convert price to number if it's a string
              const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
              return price <= maxPrice;
            });
          }
        }
      }
      
      // Apply location filter if available - ENHANCED with city+state priority
      if (criteria.location) {
        // Clean location string and split into terms, removing punctuation
        const locationTerms = criteria.location
          .toLowerCase()
          .replace(/[,;]/g, ' ')
          .replace(/\d{5}(-\d{4})?/g, '') // Remove zip codes
          .split(/\s+/)
          .filter((term: string) => term.length > 1 && !['united', 'states', 'usa', 'us'].includes(term));
        
        console.log(`Location filter - original: "${criteria.location}", cleaned terms:`, locationTerms);
        
        // Identify state terms (to separate city vs state)
        const stateNames = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 
          'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky',
          'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri',
          'montana', 'nebraska', 'nevada', 'new', 'hampshire', 'jersey', 'mexico', 'york', 'north', 'carolina', 
          'dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode', 'island', 'south', 'tennessee', 'texas',
          'utah', 'vermont', 'virginia', 'washington', 'west', 'wisconsin', 'wyoming'];
        
        const stateTerms = locationTerms.filter((term: string) => stateNames.includes(term));
        const cityTerms = locationTerms.filter((term: string) => !stateNames.includes(term));
        
        console.log(`Parsed: cityTerms=[${cityTerms.join(', ')}], stateTerms=[${stateTerms.join(', ')}]`);
        
        // Helper to check state match
        const matchesState = (property: any, terms: string[]): boolean => {
          if (!property.state || terms.length === 0) return false;
          const normalizedState = property.state.toLowerCase();
          
          return terms.some((term: string) => {
            const termCapitalized = term.charAt(0).toUpperCase() + term.slice(1);
            const termAsAbbr = getStateAbbreviation(termCapitalized).toLowerCase();
            return normalizedState === term || 
                   normalizedState === termAsAbbr ||
                   normalizedState.includes(term);
          });
        };
        
        // Helper to check city match (check location field for city name)
        const matchesCity = (property: any, terms: string[]): boolean => {
          if (!property.location || terms.length === 0) return false;
          const locationLower = property.location.toLowerCase();
          // Must match ALL city terms (for multi-word cities like "New York")
          return terms.every((term: string) => locationLower.includes(term));
        };
        
        // PRIORITY 1: Try city + state match first
        let cityStateMatches: any[] = [];
        if (cityTerms.length > 0 && stateTerms.length > 0) {
          cityStateMatches = filteredProperties.filter(p => 
            matchesCity(p, cityTerms) && matchesState(p, stateTerms)
          );
          console.log(`City+State matches: ${cityStateMatches.length}`);
        }
        
        // PRIORITY 2: If no city+state matches, try city only (in location field)
        let cityOnlyMatches: any[] = [];
        if (cityStateMatches.length === 0 && cityTerms.length > 0) {
          cityOnlyMatches = filteredProperties.filter(p => matchesCity(p, cityTerms));
          console.log(`City-only matches: ${cityOnlyMatches.length}`);
        }
        
        // PRIORITY 3: Fall back to state-only match
        let stateOnlyMatches: any[] = [];
        if (cityStateMatches.length === 0 && cityOnlyMatches.length === 0 && stateTerms.length > 0) {
          stateOnlyMatches = filteredProperties.filter(p => matchesState(p, stateTerms));
          console.log(`State-only matches: ${stateOnlyMatches.length}`);
        }
        
        // PRIORITY 4: If still no matches, try any term in location field
        let anyTermMatches: any[] = [];
        if (cityStateMatches.length === 0 && cityOnlyMatches.length === 0 && stateOnlyMatches.length === 0) {
          anyTermMatches = filteredProperties.filter(p => 
            locationTerms.some((term: string) => 
              p.location?.toLowerCase().includes(term) || 
              (p.state && p.state.toLowerCase().includes(term))
            )
          );
          console.log(`Any-term matches: ${anyTermMatches.length}`);
        }
        
        // Use the best available matches
        if (cityStateMatches.length > 0) {
          filteredProperties = cityStateMatches;
          console.log(`Using CITY+STATE filter: ${filteredProperties.length} properties`);
        } else if (cityOnlyMatches.length > 0) {
          filteredProperties = cityOnlyMatches;
          console.log(`Using CITY-only filter: ${filteredProperties.length} properties`);
        } else if (stateOnlyMatches.length > 0) {
          filteredProperties = stateOnlyMatches;
          console.log(`Using STATE-only filter: ${filteredProperties.length} properties`);
        } else if (anyTermMatches.length > 0) {
          filteredProperties = anyTermMatches;
          console.log(`Using ANY-TERM filter: ${filteredProperties.length} properties`);
        }
        
        console.log(`After enhanced location filter: ${filteredProperties.length} properties remaining`);
      }
      
      // Apply property type filter if available
      // Skip generic terms like "land" or "property" which match all properties
      if (criteria.propertyType) {
        const genericTerms = ['land', 'property', 'properties', 'parcel', 'parcels', 'lot', 'lots', 'acre', 'acres'];
        const specificTypes = ['residential', 'commercial', 'agricultural', 'recreational', 'industrial'];
        
        // Normalize: lowercase, trim, remove punctuation
        const propertyTypeLower = criteria.propertyType.toLowerCase().trim().replace(/[\/\-_,;.]/g, ' ');
        
        // Check if this is a generic-only query (no specific types mentioned)
        const containsSpecificType = specificTypes.some(specific => propertyTypeLower.includes(specific));
        const containsGenericTerm = genericTerms.some(generic => propertyTypeLower.includes(generic));
        
        const isGenericOnly = containsGenericTerm && !containsSpecificType;
        
        // Only filter if it contains a specific type (not generic-only)
        if (!isGenericOnly) {
          const propertyTypes = propertyTypeLower.split(/\s+/).filter((t: string) => t.length > 0);
          const beforeFilter = filteredProperties.length;
          filteredProperties = filteredProperties.filter(p => 
            propertyTypes.some((type: string) => 
              p.propertyType?.toLowerCase().includes(type)
            )
          );
          console.log(`Property type filter "${criteria.propertyType}": ${beforeFilter} → ${filteredProperties.length} properties`);
        } else {
          console.log(`Skipping generic property type filter: "${criteria.propertyType}"`);
        }
      }
      
      // Apply size filter if available
      if (criteria.size) {
        const sizeText = criteria.size.toLowerCase();
        // Extract numeric values from size text
        const sizeMatch = sizeText.match(/(\d[\d,]*)/g);
        
        if (sizeMatch && sizeMatch.length > 0) {
          const targetSize = parseInt(sizeMatch[0].replace(/,/g, ''));
          
          if (!isNaN(targetSize)) {
            // Handle "more than X acres" or "larger than X acres"
            if (sizeText.includes('more than') || sizeText.includes('larger')) {
              filteredProperties = filteredProperties.filter(p => {
                // Convert acreage to number if it's a string
                const acreage = typeof p.acreage === 'string' ? parseFloat(p.acreage) : p.acreage;
                return acreage >= targetSize;
              });
            }
            // Handle "less than X acres" or "smaller than X acres"
            else if (sizeText.includes('less than') || sizeText.includes('smaller')) {
              filteredProperties = filteredProperties.filter(p => {
                // Convert acreage to number if it's a string
                const acreage = typeof p.acreage === 'string' ? parseFloat(p.acreage) : p.acreage;
                return acreage <= targetSize;
              });
            }
            // Default: find properties close to the specified size
            else {
              const tolerance = targetSize * 0.3; // 30% tolerance
              filteredProperties = filteredProperties.filter(p => {
                // Convert acreage to number if it's a string
                const acreage = typeof p.acreage === 'string' ? parseFloat(p.acreage) : p.acreage;
                return acreage >= (targetSize - tolerance) && acreage <= (targetSize + tolerance);
              });
            }
          }
        }
      }
      
      // Apply features filter if available
      if (criteria.features && criteria.features.length > 0) {
        filteredProperties = filteredProperties.filter(p => 
          criteria.features.some((feature: string) => {
            // Check the available features in the property schema
            if (feature.toLowerCase().includes('water') && p.isWaterfront) return true;
            if (feature.toLowerCase().includes('mountain') && p.isMountainView) return true;
            // Check utilities
            if (p.utilities && Array.isArray(p.utilities)) {
              return p.utilities.some((util: string) => 
                util.toLowerCase().includes(feature.toLowerCase())
              );
            }
            // Check amenities
            if (p.amenities && Array.isArray(p.amenities)) {
              return p.amenities.some((amenity: string) => 
                amenity.toLowerCase().includes(feature.toLowerCase())
              );
            }
            return false;
          })
        );
      }
        
        // Fallback to basic search if no properties found with advanced filtering
        // EXCEPT when we have specific location criteria - use "nearest properties" fallback instead
        if (filteredProperties.length === 0 && !criteria.location) {
          console.log('Advanced filtering returned no results - falling back to basic search');
          filteredProperties = await dbStorage.searchProperties(query);
        } else if (filteredProperties.length === 0 && criteria.location) {
          // ZILLOW-STYLE FALLBACK: Return the 20 nearest properties when location has 0 results
          console.log(`No properties found for location "${criteria.location}" - finding 20 nearest properties`);
          
          if (searchCoordinates) {
            // Calculate distance from search coordinates to each property
            const propertiesWithDistance = allProperties
              .filter(p => {
                const coords = p.coordinates;
                return coords && Array.isArray(coords) && coords.length === 2 && 
                       typeof coords[0] === 'number' && typeof coords[1] === 'number';
              })
              .map(p => {
                const coords = p.coordinates as unknown as [number, number];
                const [propLat, propLng] = coords;
                // Haversine distance formula
                const R = 3959; // Earth's radius in miles
                const dLat = (propLat - searchCoordinates.lat) * Math.PI / 180;
                const dLng = (propLng - searchCoordinates.lng) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(searchCoordinates.lat * Math.PI / 180) * Math.cos(propLat * Math.PI / 180) *
                          Math.sin(dLng/2) * Math.sin(dLng/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c;
                return { property: p, distance };
              })
              .sort((a, b) => a.distance - b.distance)
              .slice(0, 20)
              .map(item => item.property);
            
            if (propertiesWithDistance.length > 0) {
              console.log(`Found ${propertiesWithDistance.length} nearest properties within range`);
              filteredProperties = propertiesWithDistance;
            }
          } else {
            console.log('No search coordinates provided - cannot calculate nearest properties');
          }
        }
      }
      
      // Combine the AI analysis with the filtered results
      const enhancedResults = {
        properties: filteredProperties,
        interpretation: aiAnalysis?.interpretation || {
          intent: "Finding properties matching your criteria",
          extractedCriteria: {},
          suggestedFilters: []
        }
      };
      
      res.json(enhancedResults);
    } catch (error) {
      console.error("Error in AI search:", error);
      res.status(500).json({ message: "Failed to perform AI search" });
    }
  });

  // Generate AI-powered risk analysis for a property
  app.get("/api/ai/property/:id/risk-analysis", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the property
      const property = await dbStorage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Import dynamically to prevent circular dependency
      const { generatePropertyRiskAnalysis } = await import('./openai');
      
      // Generate risk analysis using OpenAI
      const riskAnalysis = await generatePropertyRiskAnalysis(property);
      
      res.json(riskAnalysis);
    } catch (error) {
      console.error("Error generating risk analysis:", error);
      res.status(500).json({ message: "Failed to generate risk analysis" });
    }
  });
  
  // Generate AI-powered valuation insights for a property
  app.get("/api/ai/property/:id/valuation", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the property
      const property = await dbStorage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Import dynamically to prevent circular dependency
      const { generatePropertyValuationInsights } = await import('./openai');
      
      // Generate valuation insights using OpenAI
      const valuationInsights = await generatePropertyValuationInsights(property);
      
      res.json(valuationInsights);
    } catch (error) {
      console.error("Error generating valuation insights:", error);
      res.status(500).json({ message: "Failed to generate valuation insights" });
    }
  });

  // Generate AI-powered drone footage simulation for a property
  app.get("/api/ai/property/:id/drone-footage", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the property
      const property = await dbStorage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Import dynamically to prevent circular dependency
      const { generateDroneFootageSimulation } = await import('./openai');
      
      // Generate drone footage simulation using OpenAI
      const droneFootage = await generateDroneFootageSimulation(property);
      
      res.json(droneFootage);
    } catch (error) {
      console.error("Error generating drone footage simulation:", error);
      res.status(500).json({ message: "Failed to generate drone footage simulation" });
    }
  });

  // Generate AI-powered development concept for a property
  app.post("/api/ai/property/:id/development-concept", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { developmentType = 'cabin' } = req.body;
      
      // Get the property
      const property = await dbStorage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Import dynamically to prevent circular dependency
      const { generateDevelopmentConcept } = await import('./openai');
      
      // Generate development concept using OpenAI
      const developmentConcept = await generateDevelopmentConcept(property, developmentType);
      
      res.json(developmentConcept);
    } catch (error) {
      console.error("Error generating development concept:", error);
      res.status(500).json({ message: "Failed to generate development concept" });
    }
  });

  // Generate AI-powered mood board inspiration for a property
  app.post("/api/ai/property/:id/mood-board", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { styleType = 'modern' } = req.body;
      
      // Get the property
      const property = await dbStorage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Import dynamically to prevent circular dependency
      const { generatePropertyMoodBoardInspiration } = await import('./openai');
      
      // Generate mood board inspiration using OpenAI
      const moodBoardInspiration = await generatePropertyMoodBoardInspiration(property, styleType);
      
      res.json(moodBoardInspiration);
    } catch (error) {
      console.error("Error generating mood board inspiration:", error);
      res.status(500).json({ message: "Failed to generate mood board inspiration" });
    }
  });

  const httpServer = createServer(app);
  
  // Comment out WebSocket server for now (uncomment after fixing THREE.js issues)
  /* 
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connection_established',
      message: 'Connected to TerraNova Vision WebSocket Server'
    }));
    
    // Handle incoming messages from client
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'property_search':
            // Process real-time search with enhanced Claude AI
            try {
              const { enhancedPropertyQueryAnalysis } = await import('./anthropic');
              const aiAnalysis = await enhancedPropertyQueryAnalysis(data.query);
              
              // Send the results back to client
              ws.send(JSON.stringify({
                type: 'search_interpretation',
                data: aiAnalysis
              }));
            } catch (error) {
              console.error('Error in real-time search:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Error processing search query'
              }));
            }
            break;
            
          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type'
            }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
  */
  
  // Enhanced AI search with Claude
  app.post("/api/ai/enhanced-search", async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }
      
      // Import Claude search analysis
      const { enhancedPropertyQueryAnalysis } = await import('./anthropic');
      
      // Analyze the query using Claude to extract search criteria
      const claudeAnalysis = await enhancedPropertyQueryAnalysis(query);
      
      // Get all properties to perform more advanced filtering
      const allProperties = await dbStorage.getAllProperties();
      
      // Extract criteria from Claude analysis
      const criteria = claudeAnalysis.interpretation?.extractedCriteria || {};
      
      // Apply the same filtering logic as the existing AI search
      let filteredProperties = [...allProperties];
      
      // Apply price range filter if available
      if (criteria.priceRange) {
        // Use the same price filtering logic...
        const priceText = criteria.priceRange.toLowerCase();
        const priceMatch = priceText.match(/(\d[\d,]*)/g);
        
        if (priceMatch && priceMatch.length > 0) {
          const maxPrice = parseInt(priceMatch[0].replace(/,/g, ''));
          
          if (!isNaN(maxPrice)) {
            filteredProperties = filteredProperties.filter(p => {
              const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
              return price <= maxPrice;
            });
          }
        }
      }
      
      // Apply other filters (location, property type, size, features)
      // with the same logic as in the existing AI search...
      
      // Combine the Claude analysis with the filtered results
      const enhancedResults = {
        properties: filteredProperties,
        interpretation: claudeAnalysis.interpretation || {
          intent: "Finding properties matching your criteria",
          extractedCriteria: {},
          suggestedFilters: []
        }
      };
      
      res.json(enhancedResults);
    } catch (error) {
      console.error("Error in enhanced AI search:", error);
      res.status(500).json({ message: "Failed to perform enhanced AI search" });
    }
  });
  
  // Generate advanced property insights with Claude
  app.get("/api/ai/property/:id/advanced-insights", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the property
      const property = await dbStorage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Import Claude insights function
      const { generateAdvancedPropertyInsights } = await import('./anthropic');
      
      // Generate advanced insights using Claude
      const insights = await generateAdvancedPropertyInsights(property);
      
      res.json(insights);
    } catch (error) {
      console.error("Error generating advanced property insights:", error);
      res.status(500).json({ message: "Failed to generate advanced property insights" });
    }
  });
  
  // Standard recommendations endpoint (used by buyer dashboard)
  app.get("/api/recommendations", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        // Return public featured properties if not authenticated
        const allProperties = await dbStorage.getAllProperties();
        
        // Take just a few random properties as recommendations
        const publicRecommendations = allProperties
          .filter(property => property.featured === true)
          .slice(0, 5);
          
        console.log(`Returning ${publicRecommendations.length} public recommendations (user not authenticated)`);
        return res.json(publicRecommendations);
      }
      
      // Get user ID from session
      const userId = req.user?.id;
      console.log(`Fetching personalized recommendations for user ${userId}`);
      
      // Fetch user's favorite properties to exclude them from recommendations
      const favorites = await dbStorage.getFavoritesByUser(userId);
      const favoritePropertyIds = favorites.map((fav) => fav.propertyId);
      
      // Get properties that aren't already favorited
      const allProperties = await dbStorage.getAllProperties();
      
      // First try to get featured properties
      let recommendations = allProperties
        .filter(property => property.featured === true && !favoritePropertyIds.includes(property.id))
        .slice(0, 5);
      
      // If not enough featured properties, add non-featured ones
      if (recommendations.length < 5) {
        const additionalRecommendations = allProperties
          .filter(property => !property.featured && !favoritePropertyIds.includes(property.id))
          .slice(0, 5 - recommendations.length);
        
        recommendations = [...recommendations, ...additionalRecommendations];
      }
      
      console.log(`Returning ${recommendations.length} personalized recommendations for user ${userId}`);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch property recommendations", error: String(error) });
    }
  });
  
  // Generate personalized recommendations with Claude
  app.post("/api/ai/personalized-recommendations", async (req: Request, res: Response) => {
    try {
      const { userPreferences, searchHistory } = req.body;
      
      if (!userPreferences || !searchHistory) {
        return res.status(400).json({ message: "User preferences and search history are required" });
      }
      
      // Import Claude recommendations function
      const { generatePersonalizedRecommendations } = await import('./anthropic');
      
      // Generate personalized recommendations using Claude
      const recommendations = await generatePersonalizedRecommendations(userPreferences, searchHistory);
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating personalized recommendations:", error);
      res.status(500).json({ message: "Failed to generate personalized recommendations" });
    }
  });
  
  // Analyze property terrain from image using Claude Vision
  app.post("/api/ai/property/analyze-terrain", async (req: Request, res: Response) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ message: "Image data is required" });
      }
      
      // Import Claude terrain analysis function
      const { analyzePropertyTerrain } = await import('./anthropic');
      
      // Analyze terrain using Claude
      const analysis = await analyzePropertyTerrain(imageBase64);
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing property terrain:", error);
      res.status(500).json({ message: "Failed to analyze property terrain" });
    }
  });
  
  // Contact agent endpoint
  app.post('/api/contact-agent', async (req: Request, res: Response) => {
    try {
      const { agentId, propertyId, contactMethod, name, email, phone, message, contactTime, isPreApproved } = req.body;

      // Validate required fields
      if (!agentId || !name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (contactMethod === 'sms' && !phone) {
        return res.status(400).json({ error: 'Phone number is required for SMS contact' });
      }

      // Get agent information
      const agent = await dbStorage.getAgentProfile(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Get user information for the agent
      const agentUser = await dbStorage.getUser(agent.userId);
      if (!agentUser) {
        return res.status(404).json({ error: 'Agent user information not found' });
      }

      // Get property information if provided
      let property = null;
      if (propertyId) {
        try {
          property = await dbStorage.getProperty(propertyId);
        } catch (error) {
          console.log('Property not found for ID:', propertyId);
        }
      }

      // Initialize notification results
      let emailSent = false;
      let smsSent = false;
      let confirmationSent = false;
      let inquirerSmsSent = false;

      console.log(`Processing ${contactMethod} contact for agent ${agentId}`);
      console.log('Agent details:', { name: `${agentUser.firstName} ${agentUser.lastName}`, email: agentUser.email });

      // Always try email first (for both email and SMS methods)
      try {
        const twilioModule = await import('./twilio');
        emailSent = await twilioModule.sendContactEmail({
          agentEmail: agentUser.email || '',
          agentName: `${agentUser.firstName} ${agentUser.lastName}`,
          inquirerName: name,
          inquirerEmail: email,
          inquirerPhone: phone,
          message,
          propertyTitle: property?.title,
          propertyLocation: property?.location,
          contactMethod,
          contactTime,
          isPreApproved: isPreApproved || false
        });

        // Send confirmation email if agent email succeeded
        if (emailSent) {
          confirmationSent = await twilioModule.sendConfirmationEmail(
            email,
            name,
            `${agentUser.firstName} ${agentUser.lastName}`,
            agent.responseTime || 2
          );
        }

        console.log(`Email notification: ${emailSent ? 'sent' : 'failed'}`);
      } catch (error) {
        console.log('Email service unavailable, continuing with SMS if requested');
        emailSent = false;
      }

      // Handle SMS if requested
      if (contactMethod === 'sms') {
        try {
          const twilioModule = await import('./twilio');
          
          // Send SMS to agent if they have phone number (note: phone field not yet in schema)
          const agentPhone = null; // TODO: Add phone field to agent profile schema
          if (agentPhone) {
            smsSent = await twilioModule.sendAgentSMS({
              to: agentPhone,
              agentName: `${agentUser.firstName} ${agentUser.lastName}`,
              inquirerName: name,
              inquirerEmail: email,
              inquirerPhone: phone,
              message,
              propertyTitle: property?.title,
              isPreApproved: isPreApproved || false
            });
            console.log(`SMS to agent: ${smsSent ? 'sent' : 'failed'}`);
          }

          // Send confirmation SMS to inquirer if they provided phone
          if (phone) {
            inquirerSmsSent = await twilioModule.sendInquirerSMS(
              phone,
              name,
              `${agentUser.firstName} ${agentUser.lastName}`
            );
            console.log(`SMS to inquirer: ${inquirerSmsSent ? 'sent' : 'failed'}`);
          }
        } catch (error) {
          console.error('SMS service error:', error);
          smsSent = false;
          inquirerSmsSent = false;
        }
      }



      // Log the inquiry for tracking
      const inquiry = {
        propertyId: propertyId || null,
        fromUserId: null, // Anonymous contact
        toUserId: agent.userId,
        subject: `New ${propertyId ? 'Property' : 'General'} Inquiry from ${name}`,
        message: `
Contact Method: ${contactMethod}
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Best Contact Time: ${contactTime}
Pre-approved: ${isPreApproved ? 'Yes' : 'No'}
${property ? `Property: ${property.title} (${property.location})` : ''}

Message:
${message}
        `.trim(),
        status: 'sent',
        emailSent: emailSent,
        confirmationSent: confirmationSent,
        smsSent: contactMethod === 'sms' ? smsSent : false
      };

      console.log('New agent inquiry processed:', {
        agentId,
        propertyId,
        contactMethod,
        emailSent: emailSent,
        confirmationSent: confirmationSent,
        agentSmsSent: contactMethod === 'sms' ? smsSent : false,
        inquirerSmsSent: contactMethod === 'sms' ? inquirerSmsSent : false
      });

      // TODO: Store inquiry in database for tracking

      // Determine success based on what was accomplished
      const totalSuccess = emailSent || (contactMethod === 'sms' && smsSent);
      
      if (!totalSuccess) {
        // Complete failure - provide fallback contact info
        return res.status(500).json({
          error: 'Unable to deliver message at this time. Please contact the agent directly.',
          agentContact: {
            name: `${agentUser.firstName} ${agentUser.lastName}`,
            email: agentUser.email,
            responseTime: `${agent.responseTime || 2} hours`
          }
        });
      }

      // Build success message based on what worked
      let successMessage = '';
      const methods = [];
      
      if (emailSent) methods.push('email');
      if (smsSent) methods.push('SMS');
      
      if (methods.length > 0) {
        successMessage = `Message sent successfully via ${methods.join(' and ')}`;
      }

      return res.json({ 
        success: true, 
        message: successMessage,
        contactMethod,
        estimatedResponseTime: agent.responseTime || 2,
        delivery: {
          emailSent,
          smsSent,
          confirmationSent,
          inquirerSmsSent
        },
        agent: {
          name: `${agentUser.firstName} ${agentUser.lastName}`,
          brokerage: agent.brokerage
        }
      });

    } catch (error) {
      console.error('Contact agent error:', error);
      res.status(500).json({ 
        error: 'Unable to process request. Please try again or contact the agent directly.',
        suggestion: 'Please try again or contact support'
      });
    }
  });

  // Account verification endpoints
  app.post("/api/auth/verify/initiate", async (req: Request, res: Response) => {
    try {
      const { userId, method, destination } = req.body;
      
      if (!userId || !method || !destination) {
        return res.status(400).json({ message: "userId, method, and destination are required" });
      }
      
      // Check if user exists
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate 6-digit random code
      const code = crypto.randomInt(100000, 999999).toString();
      
      // Store verification attempt
      const verificationData = {
        userId,
        method,
        code,
        destination,
        expiresAt: addMinutes(new Date(), 15), // Code expires in 15 minutes
        isVerified: false,
        verifiedAt: null,
      };
      
      await dbStorage.createVerificationAttempt(verificationData);
      
      // Send the code via the appropriate method
      if (method === 'email') {
        // TODO: Implement email sending
        console.log(`VERIFICATION CODE for user ${userId}: ${code} (would be sent to email: ${destination})`);
      } else if (method === 'sms') {
        // TODO: Implement SMS sending
        console.log(`VERIFICATION CODE for user ${userId}: ${code} (would be sent to phone: ${destination})`);
      }
      
      res.status(200).json({ message: "Verification code sent" });
    } catch (error) {
      console.error("Error initiating verification:", error);
      res.status(500).json({ message: "Failed to initiate verification" });
    }
  });
  
  app.post("/api/auth/verify/otp", async (req: Request, res: Response) => {
    try {
      const { userId, code, method } = req.body;
      
      if (!userId || !code || !method) {
        return res.status(400).json({ message: "userId, code, and method are required" });
      }
      
      // Get the user
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Find the most recent verification attempt for this user and method
      const verificationAttempt = await dbStorage.getLatestVerificationAttempt(userId, method);
      
      if (!verificationAttempt) {
        return res.status(404).json({ message: "No verification attempt found" });
      }
      
      if (verificationAttempt.isVerified) {
        return res.status(400).json({ message: "This code has already been used" });
      }
      
      if (isPast(new Date(verificationAttempt.expiresAt))) {
        return res.status(400).json({ message: "Verification code has expired" });
      }
      
      if (verificationAttempt.code !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
      // Mark verification as successful
      await dbStorage.markVerificationSuccessful(verificationAttempt.id);
      
      // Update user's verification status
      if (method === 'email') {
        await dbStorage.updateUser(userId, { isEmailVerified: true });
      } else if (method === 'sms') {
        await dbStorage.updateUser(userId, { isPhoneVerified: true });
      }
      
      // If user is unverified, set them to active (commented out since status field doesn't exist yet)
      // if (user.status === 'unverified') {
      //   await dbStorage.updateUser(userId, { status: 'active' });
      // }
      
      // Return updated user data
      const updatedUser = await dbStorage.getUser(userId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error verifying code:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });
  
  app.post("/api/auth/verify/resend", async (req: Request, res: Response) => {
    try {
      const { userId, method } = req.body;
      
      if (!userId || !method) {
        return res.status(400).json({ message: "userId and method are required" });
      }
      
      // Check if user exists
      const user = await dbStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Find the most recent verification attempt
      const previousAttempt = await dbStorage.getLatestVerificationAttempt(userId, method);
      
      if (!previousAttempt) {
        return res.status(404).json({ message: "No previous verification attempt found" });
      }
      
      // Generate new 6-digit random code
      const code = crypto.randomInt(100000, 999999).toString();
      
      // Store new verification attempt
      const verificationData = {
        userId,
        method,
        code,
        destination: previousAttempt.destination,
        expiresAt: addMinutes(new Date(), 15), // Code expires in 15 minutes
        isVerified: false,
        verifiedAt: null,
      };
      
      await dbStorage.createVerificationAttempt(verificationData);
      
      // Send the code via the appropriate method
      if (method === 'email') {
        // TODO: Implement email sending
        console.log(`VERIFICATION CODE for user ${userId}: ${code} (would be sent to email: ${previousAttempt.destination})`);
      } else if (method === 'sms') {
        // TODO: Implement SMS sending
        console.log(`VERIFICATION CODE for user ${userId}: ${code} (would be sent to phone: ${previousAttempt.destination})`);
      }
      
      res.status(200).json({ message: "New verification code sent" });
    } catch (error) {
      console.error("Error resending verification code:", error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });
  
  // PostGIS test endpoints
  
  // Test endpoint for finding properties within a radius
  app.get("/api/postgis/properties/near", async (req: Request, res: Response) => {
    try {
      const { lat, lng, radius } = req.query;
      
      // Validate parameters
      if (!lat || !lng || !radius) {
        return res.status(400).json({ error: "Latitude, longitude, and radius are required" });
      }
      
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusMiles = parseFloat(radius as string);
      
      // Validate numeric values
      if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMiles)) {
        return res.status(400).json({ error: "Invalid latitude, longitude, or radius" });
      }
      
      // Call the storage method
      const properties = await dbStorage.getPropertiesWithinRadius(longitude, latitude, radiusMiles);
      
      res.json({
        center: { lat: latitude, lng: longitude },
        radiusMiles,
        count: properties.length,
        properties
      });
    } catch (error) {
      console.error('Error finding properties within radius:', error);
      res.status(500).json({ error: 'Failed to find properties within radius' });
    }
  });
  
  // Test endpoint for finding properties in a bounding box
  app.get("/api/postgis/properties/bbox", async (req: Request, res: Response) => {
    try {
      const { minLat, minLng, maxLat, maxLng } = req.query;
      
      // Validate parameters
      if (!minLat || !minLng || !maxLat || !maxLng) {
        return res.status(400).json({ error: "All bounding box coordinates are required" });
      }
      
      const minLatitude = parseFloat(minLat as string);
      const minLongitude = parseFloat(minLng as string);
      const maxLatitude = parseFloat(maxLat as string);
      const maxLongitude = parseFloat(maxLng as string);
      
      // Validate numeric values
      if (isNaN(minLatitude) || isNaN(minLongitude) || isNaN(maxLatitude) || isNaN(maxLongitude)) {
        return res.status(400).json({ error: "Invalid bounding box coordinates" });
      }
      
      // Call the storage method
      const properties = await dbStorage.getPropertiesByBoundingBox(minLongitude, minLatitude, maxLongitude, maxLatitude);
      
      res.json({
        boundingBox: {
          minLat: minLatitude,
          minLng: minLongitude,
          maxLat: maxLatitude,
          maxLng: maxLongitude
        },
        count: properties.length,
        properties
      });
    } catch (error) {
      console.error('Error finding properties in bounding box:', error);
      res.status(500).json({ error: 'Failed to find properties in bounding box' });
    }
  });
  
  // Test endpoint for getting property area
  app.get("/api/postgis/properties/:id/area", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate parameters
      if (!id) {
        return res.status(400).json({ error: "Property ID is required" });
      }
      
      const propertyId = parseInt(id);
      
      // Validate numeric value
      if (isNaN(propertyId)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }
      
      // Get the property
      const property = await dbStorage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      // Calculate the area
      const area = await dbStorage.getPropertyArea(propertyId);
      
      res.json({
        propertyId,
        title: property.title,
        acreage: property.acreage,
        calculatedArea: area,
        unit: "acres"
      });
    } catch (error) {
      console.error('Error calculating property area:', error);
      res.status(500).json({ error: 'Failed to calculate property area' });
    }
  });
  
  // Test endpoint for finding properties by feature
  app.get("/api/postgis/properties/feature/:feature", async (req: Request, res: Response) => {
    try {
      const { feature } = req.params;
      
      // Validate parameters
      if (!feature) {
        return res.status(400).json({ error: "Feature is required" });
      }
      
      // Call the storage method
      const properties = await dbStorage.getPropertiesByFeature(feature);
      
      res.json({
        feature,
        count: properties.length,
        properties
      });
    } catch (error) {
      console.error(`Error finding properties by feature '${req.params.feature}':`, error);
      res.status(500).json({ error: 'Failed to find properties by feature' });
    }
  });

  // Property scraper routes (temporarily disabled)
  app.get("/api/scrapers", async (req: Request, res: Response) => {
    // List all available scrapers - temporarily disabled
    res.json({ message: "Scraper service temporarily disabled", available: false });
  });

  app.post("/api/scrape", async (req: Request, res: Response) => {
    // Scrape a URL for property data - temporarily disabled
    res.status(503).json({ message: "Scraper service temporarily disabled" });
  });
  
  // AI-Powered Data Point Extraction
  app.post("/api/ai/extract-property-data", async (req: Request, res: Response) => {
    try {
      const propertyData = req.body;
      
      // Process property data through AI to extract and enhance fields
      const result = await processPropertyWithAI(propertyData);
      
      // Return the enhanced property data
      res.json(result);
    } catch (error: any) {
      console.error('Error in AI property data extraction:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to extract property data with AI',
        error: error?.message || 'Unknown error'
      });
    }
  });

  // Zillow Climate Risk API - Using authentic data sources
  app.get("/api/climate-risk", async (req: Request, res: Response) => {
    await handleClimateRiskRequest(req, res);
  });

  // Climate risk polygons endpoint for authentic boundary visualization
  app.get('/api/climate-risk-polygons', async (req: Request, res: Response) => {
    try {
      const { north, south, east, west, types } = req.query;
      
      if (!north || !south || !east || !west) {
        return res.status(400).json({ error: 'Bounds parameters required: north, south, east, west' });
      }
      
      const bounds = {
        north: parseFloat(north as string),
        south: parseFloat(south as string),
        east: parseFloat(east as string),
        west: parseFloat(west as string)
      };
      
      const activeTypes = types ? 
        (types as string).split(',').reduce((acc, type) => ({ ...acc, [type]: true }), {}) :
        { fire: true, flood: true, heat: true, wind: true };
      
      const { getClimateRiskPolygons } = await import('./authentic-climate-data.js');
      const features = getClimateRiskPolygons(bounds, activeTypes);
      
      res.json({
        type: 'FeatureCollection',
        features: features,
        bounds: bounds,
        activeTypes: activeTypes,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error in climate risk polygons endpoint:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Temporarily disabled scraper service to fix startup issues
  // try {
  //   console.log("Starting property scraper service...");
  //   await startScraperService();
  // } catch (error) {
  //   console.error("Failed to start property scraper service:", error);
  // }

  return httpServer;
}

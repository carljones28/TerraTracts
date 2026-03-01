/**
 * Python Scraper Service Manager
 * 
 * This module provides robust startup, monitoring, and error recovery for the Python scraper service.
 * It handles process management, error logging, and automatic recovery on failure.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Get the directory name (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SERVICE_PORT = 5001;
const SERVICE_URL = `http://0.0.0.0:${SERVICE_PORT}`;
const MAX_RESTART_ATTEMPTS = 5;
const STARTUP_TIMEOUT = 30000; // 30 seconds
const HEALTH_CHECK_INTERVAL = 60000; // 1 minute
const LOG_DIR = path.join(__dirname, 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create log streams
const accessLogStream = fs.createWriteStream(path.join(LOG_DIR, 'scraper-access.log'), { flags: 'a' });
const errorLogStream = fs.createWriteStream(path.join(LOG_DIR, 'scraper-error.log'), { flags: 'a' });

// Global state
let scraperProcess = null;
let isServiceRunning = false;
let restartCount = 0;
let healthCheckInterval = null;
let isShuttingDown = false;

/**
 * Logs a message to console and the appropriate log file
 */
function log(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  if (isError) {
    console.error(logMessage.trim());
    errorLogStream.write(logMessage);
  } else {
    console.log(logMessage.trim());
    accessLogStream.write(logMessage);
  }
}

/**
 * Launches the Python scraper service
 */
async function startScraperService() {
  if (isServiceRunning) {
    log('Scraper service is already running');
    return true;
  }
  
  if (isShuttingDown) {
    log('System is shutting down, not starting scraper service');
    return false;
  }
  
  log(`Starting scraper service (attempt ${restartCount + 1} of ${MAX_RESTART_ATTEMPTS})`);
  
  try {
    // Check if the service is already running on the port
    try {
      const response = await axios.get(`${SERVICE_URL}/health`, { timeout: 1000 });
      if (response.status === 200) {
        log('Scraper service is already running on another process');
        isServiceRunning = true;
        setupHealthCheck();
        return true;
      }
    } catch (err) {
      // Service is not running, continue with startup
    }
    
    // Python script path - relative to server directory
    const scriptPath = path.join(__dirname, 'scrapers', 'scraper_server.py');
    
    // Handle the case where the script doesn't exist
    if (!fs.existsSync(scriptPath)) {
      log(`Scraper script not found at ${scriptPath}`, true);
      return false;
    }
    
    // Launch the process
    scraperProcess = spawn('python3', [scriptPath, '--port', SERVICE_PORT.toString()], {
      detached: false,
      stdio: 'pipe'
    });
    
    // Handle process events
    scraperProcess.stdout.on('data', (data) => {
      const messages = data.toString().trim().split('\n');
      messages.forEach(msg => {
        // Check for server started message
        if (msg.includes('Scraper server running') || msg.includes('listening on port')) {
          isServiceRunning = true;
          restartCount = 0;
          setupHealthCheck();
        }
        log(`[PYTHON] ${msg}`);
      });
    });
    
    scraperProcess.stderr.on('data', (data) => {
      const messages = data.toString().trim().split('\n');
      messages.forEach(msg => {
        log(`[PYTHON ERROR] ${msg}`, true);
      });
    });
    
    scraperProcess.on('close', (code) => {
      log(`Python scraper service exited with code ${code}`, code !== 0);
      isServiceRunning = false;
      scraperProcess = null;
      
      // Attempt to restart if not shutting down
      if (!isShuttingDown) {
        restartCount++;
        if (restartCount <= MAX_RESTART_ATTEMPTS) {
          log(`Restarting scraper service (attempt ${restartCount})`);
          setTimeout(() => startScraperService(), 2000);
        } else {
          log('Maximum restart attempts reached, giving up', true);
        }
      }
    });
    
    // Wait for the service to start
    return await waitForService();
  } catch (error) {
    log(`Error starting scraper service: ${error.message}`, true);
    return false;
  }
}

/**
 * Waits for the service to become available
 */
async function waitForService() {
  log('Waiting for scraper service to become available...');
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < STARTUP_TIMEOUT) {
    try {
      const response = await axios.get(`${SERVICE_URL}/health`, { timeout: 2000 });
      if (response.status === 200) {
        log('Scraper service is now available');
        isServiceRunning = true;
        setupHealthCheck();
        return true;
      }
    } catch (err) {
      // Service is still starting up, wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  log('Timed out waiting for scraper service to start', true);
  return false;
}

/**
 * Sets up a regular health check to monitor the service
 */
function setupHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    try {
      const response = await axios.get(`${SERVICE_URL}/health`, { timeout: 2000 });
      if (response.status === 200) {
        log('Health check passed');
      } else {
        log('Health check returned unexpected status: ' + response.status, true);
        await restartService();
      }
    } catch (err) {
      log(`Health check failed: ${err.message}`, true);
      await restartService();
    }
  }, HEALTH_CHECK_INTERVAL);
}

/**
 * Restarts the service if it's not responding
 */
async function restartService() {
  log('Attempting to restart scraper service due to health check failure');
  
  if (scraperProcess) {
    try {
      // Try to terminate gracefully first
      scraperProcess.kill('SIGTERM');
      
      // Give it some time to shut down
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force kill if still running
      if (scraperProcess) {
        scraperProcess.kill('SIGKILL');
      }
    } catch (err) {
      log(`Error terminating scraper process: ${err.message}`, true);
    }
  }
  
  isServiceRunning = false;
  scraperProcess = null;
  
  // Restart the service
  await startScraperService();
}

/**
 * Stops the scraper service
 */
async function stopScraperService() {
  log('Stopping scraper service');
  
  isShuttingDown = true;
  
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
  
  if (scraperProcess) {
    try {
      // Try to terminate gracefully
      scraperProcess.kill('SIGTERM');
      
      // Give it some time to shut down
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force kill if still running
      if (scraperProcess) {
        scraperProcess.kill('SIGKILL');
        scraperProcess = null;
      }
    } catch (err) {
      log(`Error stopping scraper process: ${err.message}`, true);
    }
  }
  
  isServiceRunning = false;
  isShuttingDown = false;
  restartCount = 0;
  
  log('Scraper service stopped');
}

/**
 * Checks if the scraper service is currently running
 */
function isRunning() {
  return isServiceRunning;
}

/**
 * Handle process exit to ensure scraper is shutdown
 */
process.on('exit', () => {
  if (scraperProcess) {
    scraperProcess.kill('SIGKILL');
  }
});

// Export the service management functions
export {
  startScraperService,
  stopScraperService,
  isRunning,
  SERVICE_URL
};
/**
 * OCR Service for Resume Processing
 * Handles optical character recognition for scanned PDFs/images
 */

// OCR service using Tesseract.js for server-side OCR
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const performOCR = async (fileBuffer, filename) => {
  console.log(`Performing OCR on file: ${filename}`);
  
  try {
    // Create a temporary file for processing
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `temp_ocr_${Date.now()}_${filename}`);
    
    // Write the buffer to a temporary file
    fs.writeFileSync(tempPath, fileBuffer);
    
    // Try to convert PDF to image if needed
    let imagePath = tempPath;
    if (filename.toLowerCase().endsWith('.pdf')) {
      // For PDF files, we might need to convert to image first
      // This is a simplified approach - in production you might use pdftoppm or similar
      imagePath = tempPath.replace(/\.pdf$/, '.png');
      try {
        // Try to use ImageMagick if available
        await execAsync(`magick "${tempPath}" "${imagePath}"`);
      } catch (convertErr) {
        console.log('ImageMagick not available, using PDF directly for OCR');
        imagePath = tempPath; // Fall back to using PDF directly
      }
    }
    
    // Perform OCR using Tesseract
    const result = await Tesseract.recognize(
      imagePath,
      'eng',
      { logger: m => console.log(m) }
    );
    
    // Clean up temporary files
    try {
      fs.unlinkSync(tempPath);
      if (imagePath !== tempPath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (cleanupErr) {
      console.error('Error cleaning up temp files:', cleanupErr);
    }
    
    return result.data.text;
  } catch (error) {
    console.error('OCR processing error:', error);
    
    // Clean up any temp files on error
    try {
      const tempDir = os.tmpdir();
      const tempFiles = fs.readdirSync(tempDir).filter(f => f.includes('temp_ocr_'));
      tempFiles.forEach(file => {
        try {
          fs.unlinkSync(path.join(tempDir, file));
        } catch {} // Ignore cleanup errors
      });
    } catch {}
    
    // Return empty string if OCR fails
    return '';
  }
};

// Alternative OCR implementation using a cloud service (example with placeholder)
const performCloudOCR = async (fileBuffer, filename) => {
  // Example implementation for cloud-based OCR service
  // This is just a template - would need real API integration
  
  const FormData = require('form-data');
  const axios = require('axios');
  
  try {
    // This is a mock implementation - in reality you would:
    // 1. Upload the file to the OCR service
    // 2. Wait for processing
    // 3. Retrieve the results
    
    // For now, return empty result
    return '';
  } catch (error) {
    console.error('Cloud OCR processing error:', error);
    return ''; // Return empty string if cloud OCR fails
  }
};

// Detect if OCR is needed by checking if initial text extraction was successful
const needsOCR = async (rawText) => {
  // If the raw text is empty or very sparse, OCR might be needed
  const cleanText = rawText.replace(/\s+/g, ' ').trim();
  
  // Heuristic: if less than 20 characters or text is mostly special characters, OCR may be needed
  if (cleanText.length < 20) {
    return true;
  }
  
  // Check if text seems to be mostly non-readable (lots of special characters)
  const specialCharRatio = (cleanText.match(/[^a-zA-Z0-9\s]/g) || []).length / cleanText.length;
  if (specialCharRatio > 0.5 && cleanText.length < 100) {
    return true;
  }
  
  return false;
};

module.exports = {
  performOCR,
  performCloudOCR,
  needsOCR
};
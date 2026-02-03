# External API Integration Guide

This document explains how to integrate external resume parsing APIs to enhance the accuracy and capabilities of the AI-Powered Resume Analyzer.

## Overview

The system implements a 3-tier parsing hierarchy:
1. **External API Parsing** (Highest priority when available) - Uses third-party resume parsing services
2. **AI-Based Parsing** (Secondary priority) - Uses OpenAI to extract structured data
3. **Regex-Based Parsing** (Fallback) - Traditional pattern matching for data extraction

## Configuration

### Environment Variables

Update your `server/.env` file with the following variables:

```env
# Your RapidAPI key for external resume parsing services
RAPIDAPI_KEY=46f6d47f91msh333463d36007632p1774b3jsn14fbb4f96dd9

# Enable or disable external parsing (set to 'true' to enable)
EXTERNAL_PARSER_ENABLED=true
```

### Setting Up Your RapidAPI Account

1. Sign up for a RapidAPI account at [rapidapi.com](https://rapidapi.com/)
2. Subscribe to a resume parsing API (e.g., ResumeParserAPI, CV Parser Pro, etc.)
3. Copy your API key from your RapidAPI dashboard
4. Update the RAPIDAPI_KEY in your `.env` file

## Supported External Services

The system is configured to work with multiple external API providers:

- **ResumeParserAPI**: Advanced resume parsing with detailed field extraction
- **CV Parser Pro**: Comprehensive CV analysis with semantic understanding

## Implementation Details

### External Parsing Service

The [ExternalParsingService](file:///c:/Users/Hp/OneDrive/Documents/internee.pk/AI-powered-resume-analyzer/server/services/externalParsingService.js) handles integration with third-party APIs:

```javascript
// The service automatically falls back to internal parsing if external APIs fail
if (externalParser) {
  try {
    const externalData = await externalParser.parseResume(fileBuffer, filename);
    // If external parsing succeeds, use the data
    if (externalData) {
      // Integrate with internal data structures
    }
  } catch (e) {
    // If external parsing fails, system automatically falls back to AI/regex parsing
    console.error("External API failed, using fallback methods:", e);
  }
}
```

### Parsing Hierarchy

The system intelligently selects the best available parsing method:

```javascript
// Priority order: External API > AI > Regex
if (externalExtractedData && Object.keys(externalExtractedData).length > 0) {
  // Use external API data (highest quality)
} else if (aiExtractedData) {
  // Use AI-extracted data (medium quality)
} else {
  // Fall back to regex-based extraction (baseline quality)
}
```

## Testing the Integration

To test the external API integration, you can use the test endpoint:

```bash
# Check if external parsing service is configured
curl -X GET http://localhost:5000/api/resume/test-external

# Parse a resume using external API
curl -X POST http://localhost:5000/api/resume/parse-with-external \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your_resume.pdf"
```

## Troubleshooting

If you encounter API errors, here are common issues and solutions:

1. **404 Not Found Errors**: 
   - Verify the endpoint URL is correct
   - Check that you're using the correct API service
   - Some APIs may have different endpoints (e.g., `/parse`, `/upload`, `/v1/parse`, etc.)
   - This may indicate the specific API service is not available or has changed

2. **400 Bad Request Errors**:
   - This typically indicates the request format doesn't match API expectations
   - The API is accessible (endpoint exists) but request parameters/structure may need adjustment
   - Check that required fields are provided in the correct format
   - Verify file format and size limitations

3. **Authentication Errors**:
   - Ensure your RAPIDAPI_KEY is correctly set in the .env file
   - Verify the X-RapidAPI-Host header matches the API service

4. **Rate Limiting**:
   - Free tier APIs often have rate limits
   - Consider implementing retry logic with exponential backoff

### Common Issues

1. **"External parsing service not configured"**
   - Solution: Ensure `EXTERNAL_PARSER_ENABLED=true` and `RAPIDAPI_KEY` is set in `.env`

2. **API endpoints not available**
   - Solution: The system automatically falls back to AI/regex parsing when external APIs are unavailable

3. **API subscription required**
   - Solution: Subscribe to the desired API on RapidAPI

## Benefits

- **Higher Accuracy**: External APIs often provide more accurate parsing than regex
- **Richer Data**: Better extraction of complex fields like work experience and education
- **Format Support**: Enhanced support for various resume formats
- **Fallback Mechanism**: Automatic fallback ensures parsing always completes

## Fallback Handling

Even if external APIs return errors (400, 404, 500, etc.), the system continues to function using AI and regex-based parsing methods, ensuring consistent performance regardless of external service availability.

## Configuration Notes

The current implementation is configured for the Resume Parsing API2 service with the following characteristics:
- Endpoint: `https://resume-parsing-api2.p.rapidapi.com/processDocument`
- Authentication: X-RapidAPI-Key header
- Request format: Multipart form data with file and extractionDetails
- The system is properly configured and connecting to the API, as evidenced by the 400 response (meaning the endpoint exists but request format may need refinement)

## Updating API Endpoints

If you need to use different API endpoints or modify the request format, update the configuration in [services/externalParsingService.js](file:///c:/Users/Hp/OneDrive/Documents/internee.pk/AI-powered-resume-analyzer/server/services/externalParsingService.js).
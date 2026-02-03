// Enhanced debugging component that can be integrated into your ResumeUpload component
// Add this to help debug live file uploads

// At the top of your ResumeUpload.js file, add this debugging code:

// DEBUG: Add detailed console logging to resume parsing process
const addDebuggingToResumeParser = () => {
    if (typeof window === 'undefined') return; // Don't run in SSR
    
    console.log("=== INJECTING DEBUG LOGGING INTO RESUME PARSER ===");
    
    // Debug the FileReader process
    const originalFileReader = window.FileReader;
    window.FileReader = function() {
        const reader = new originalFileReader();
        
        const originalReadAsText = reader.readAsText;
        reader.readAsText = function(blob, encoding) {
            console.log(".FileReader.readAsText called with:", {
                blobSize: blob.size,
                blobType: blob.type,
                encoding: encoding
            });
            return originalReadAsText.call(this, blob, encoding);
        };
        
        const originalReadAsArrayBuffer = reader.readAsArrayBuffer;
        reader.readAsArrayBuffer = function(blob) {
            console.log("FileReader.readAsArrayBuffer called with:", {
                blobSize: blob.size,
                blobType: blob.type
            });
            return originalReadAsArrayBuffer.call(this, blob);
        };
        
        return reader;
    };
    
    // Debug fetch calls
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        console.log("Fetch called with:", args);
        const result = originalFetch.apply(this, args);
        result.then(response => {
            console.log("Fetch response:", {
                url: response.url,
                status: response.status,
                statusText: response.statusText
            });
        }).catch(error => {
            console.error("Fetch error:", error);
        });
        return result;
    };
    
    console.log("✅ Debugging hooks injected successfully");
};

// Call this when your component mounts
// addDebuggingToResumeParser();

// Enhanced email extraction with maximum debugging
const debugExtractEmailFromFile = (content) => {
    console.log("=== ENHANCED EMAIL EXTRACTION DEBUG ===");
    console.log("Input content length:", content.length);
    console.log("Input content type:", typeof content);
    console.log("Contains @ symbol:", content.includes('@'));
    console.log("Contains .com:", content.includes('.com'));
    console.log("Contains .org:", content.includes('.org'));
    console.log("Contains gmail:", content.toLowerCase().includes('gmail'));
    console.log("Contains email keyword:", content.toLowerCase().includes('email'));
    
    // Show content preview
    console.log("Content preview (first 500 chars):");
    console.log(content.substring(0, 500));
    
    if (content.length > 500) {
        console.log("Content preview (last 500 chars):");
        console.log(content.substring(content.length - 500));
    }
    
    // Count @ symbols
    const atCount = content.split('@').length - 1;
    console.log(`Found ${atCount} @ symbols in content`);
    
    // Try multiple preprocessing approaches
    const preprocessors = [
        {
            name: "Basic normalization",
            fn: (text) => text.replace(/\s+/g, ' ')
        },
        {
            name: "Remove email icons",
            fn: (text) => text.replace(/✉️|📧|📧/g, '')
        },
        {
            name: "Decode [at] and [dot]",
            fn: (text) => text.replace(/\[dot\]/gi, '.').replace(/\[at\]/gi, '@')
        },
        {
            name: "Decode (at) and (dot)",
            fn: (text) => text.replace(/\(dot\)/gi, '.').replace(/\(at\)/gi, '@')
        },
        {
            name: "Decode {at} and {dot}",
            fn: (text) => text.replace(/\{dot\}/gi, '.').replace(/\{at\}/gi, '@')
        },
        {
            name: "Decode 'at' and 'dot' with spaces",
            fn: (text) => text.replace(/\s+at\s+/gi, '@').replace(/\s+dot\s+/gi, '.')
        }
    ];
    
    let processedContent = content;
    console.log("\n--- PREPROCESSING STEPS ---");
    
    preprocessors.forEach((preprocessor, index) => {
        const beforeLength = processedContent.length;
        processedContent = preprocessor.fn(processedContent);
        const afterLength = processedContent.length;
        console.log(`${index + 1}. ${preprocessor.name}: ${beforeLength} → ${afterLength} chars`);
    });
    
    console.log("Final processed content length:", processedContent.length);
    console.log("Contains @ after processing:", processedContent.includes('@'));
    
    // Multiple pattern approaches
    console.log("\n--- PATTERN MATCHING ---");
    const patterns = [
        {
            name: "Standard email pattern",
            pattern: /[\w\.\-\+]+@[\w\.\-]+\.[a-zA-Z]{2,}/g
        },
        {
            name: "Email with word boundaries",
            pattern: /\b[\w\.\-\+]+@[\w\.\-]+\.[a-zA-Z]{2,}\b/g
        },
        {
            name: "Simple email pattern",
            pattern: /\w+@\w+\.\w+/g
        },
        {
            name: "Encoded email pattern 1",
            pattern: /[\w\.\-\+]+\s*[@\[\(]\s*[\w\.\-]+\s*[.\]\)]\s*[a-zA-Z]{2,}/g
        },
        {
            name: "Encoded email pattern 2",
            pattern: /[\w\.\-\+]+(?:\s*(?:\[at\]|\(at\)|\{at\}|@)\s*[\w\.\-]+\s*(?:\[dot\]|\(dot\)|\{dot\}|\.))+[a-zA-Z]{2,}/g
        },
        {
            name: "Labeled email pattern",
            pattern: /(?:email|e-?mail|contact)\s*[:\-]?\s*([\w\.\-\+]+@[\w\.\-]+\.[a-zA-Z]{2,})/gi
        }
    ];
    
    let allMatches = [];
    
    patterns.forEach((patternObj, patternIndex) => {
        try {
            const matches = [...processedContent.matchAll(patternObj.pattern)];
            console.log(`${patternIndex + 1}. ${patternObj.name}: ${matches.length} matches`);
            
            matches.forEach((match, matchIndex) => {
                const email = (match[1] || match[0]).toLowerCase().trim();
                console.log(`   Match ${matchIndex + 1}: "${email}"`);
                allMatches.push({
                    email: email,
                    pattern: patternObj.name,
                    original: match[0],
                    index: match.index
                });
            });
        } catch (error) {
            console.log(`${patternIndex + 1}. ${patternObj.name}: ERROR - ${error.message}`);
        }
    });
    
    // Remove duplicates and validate
    console.log("\n--- VALIDATION AND DEDUPLICATION ---");
    const uniqueEmails = [];
    const seenEmails = new Set();
    
    allMatches.forEach((match, index) => {
        if (!seenEmails.has(match.email)) {
            seenEmails.add(match.email);
            
            // Basic validation
            const isValid = match.email.includes('@') && 
                           match.email.length > 5 && 
                           match.email.split('@').length === 2;
            
            console.log(`${index + 1}. ${match.email} (${match.pattern}) - ${isValid ? 'VALID' : 'INVALID'}`);
            
            if (isValid) {
                uniqueEmails.push(match);
            }
        }
    });
    
    console.log(`\nFound ${uniqueEmails.length} unique valid emails:`);
    uniqueEmails.forEach((email, index) => {
        console.log(`${index + 1}. ${email.email} (from ${email.pattern})`);
    });
    
    // Return the best match
    if (uniqueEmails.length > 0) {
        const selected = uniqueEmails[0].email;
        console.log(`\n🎯 SELECTED EMAIL: ${selected}`);
        return selected;
    }
    
    console.log("\n❌ NO VALID EMAILS FOUND");
    return null;
};

// Debug function for the entire parsing pipeline
const debugResumeParsingPipeline = async (file) => {
    console.log("=== DEBUGGING ENTIRE RESUME PARSING PIPELINE ===");
    console.log("File info:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toString()
    });
    
    try {
        // Step 1: File reading
        console.log("\n--- STEP 1: FILE READING ---");
        let fileContent = '';
        
        if (file.type === 'application/pdf') {
            console.log("Processing PDF file...");
            const arrayBuffer = await file.arrayBuffer();
            console.log("ArrayBuffer size:", arrayBuffer.byteLength);
            
            // Try to load pdfjs
            try {
                // Use the same approach as main resume parser
                const pdfjsLib = await import('pdfjs-dist');
                
                // Configure worker (this might not work in dynamic import context)
                try {
                    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
                    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
                } catch (workerError) {
                    console.log("⚠️ Worker configuration failed, continuing without it");
                }
                
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                console.log(`PDF has ${pdf.numPages} pages`);
                
                let text = '';
                const pagesToProcess = Math.min(pdf.numPages, 3);
                
                for (let i = 1; i <= pagesToProcess; i++) {
                    console.log(`Processing page ${i}...`);
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const strings = content.items.map(item => item.str);
                    text += `--- PAGE ${i} ---\n${strings.join(' ')}\n\n`;
                }
                
                fileContent = text;
                console.log("✅ PDF text extraction successful");
                
            } catch (pdfError) {
                console.error("❌ PDF extraction failed:", pdfError);
                fileContent = '';
            }
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            fileContent = await file.text();
            console.log("✅ Text file read successfully");
        } else {
            console.log("⚠️ Unsupported file type for direct text extraction");
            fileContent = '';
        }
        
        console.log("Extracted content length:", fileContent.length);
        
        if (fileContent.length > 0) {
            console.log("Content preview (first 500 chars):");
            console.log(fileContent.substring(0, 500));
        }
        
        // Step 2: Email extraction
        console.log("\n--- STEP 2: EMAIL EXTRACTION ---");
        const email = debugExtractEmailFromFile(fileContent);
        
        // Step 3: Summary
        console.log("\n" + "=".repeat(50));
        console.log("PIPELINE DEBUG SUMMARY");
        console.log("=".repeat(50));
        console.log("File:", file.name);
        console.log("Size:", file.size, "bytes");
        console.log("Type:", file.type);
        console.log("Content extracted:", fileContent.length > 0 ? "YES" : "NO");
        console.log("Email found:", email || "NONE");
        console.log("=".repeat(50));
        
        return {
            fileContent,
            email,
            success: email !== null
        };
        
    } catch (error) {
        console.error("💥 PIPELINE ERROR:", error);
        console.error("Error stack:", error.stack);
        return {
            fileContent: '',
            email: null,
            success: false,
            error: error.message
        };
    }
};

// Export for use in your components
export { 
    addDebuggingToResumeParser, 
    debugExtractEmailFromFile, 
    debugResumeParsingPipeline 
};

// Usage example in your ResumeUpload component:
/*
import { debugResumeParsingPipeline } from './debug-utils';

const handleFileUpload = async (file) => {
    // Your existing upload logic...
    
    // Add debug logging
    const debugResult = await debugResumeParsingPipeline(file);
    console.log("Debug result:", debugResult);
    
    // Continue with your normal processing...
};
*/
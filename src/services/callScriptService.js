const fs = require('fs');
const path = require('path');

// File mapping system for call script IDs
const CALL_SCRIPT_FILE_MAP = {
  1: 'paytm.txt',
  2: 'script2.txt', 
  3: 'script3.txt',
};

// Function to read call script content from file
const readCallScriptContent = (scriptId) => {
  try {
    // Check if scriptId exists in mapping
    if (!CALL_SCRIPT_FILE_MAP[scriptId]) {
      throw new Error(`Call script with ID ${scriptId} not found`);
    }

    const fileName = CALL_SCRIPT_FILE_MAP[scriptId];
    const filePath = path.join(process.cwd(), 'assets', 'call-scripts', fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Call script file ${fileName} not found at path: ${filePath}`);
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read call script content: ${error.message}`);
  }
};

// Function to get all available call script IDs
const getAvailableCallScriptIds = () => {
  return Object.keys(CALL_SCRIPT_FILE_MAP);
};

// Function to validate if call script ID exists
const isValidCallScriptId = (scriptId) => {
  return CALL_SCRIPT_FILE_MAP.hasOwnProperty(scriptId);
};

module.exports = {
  readCallScriptContent,
  getAvailableCallScriptIds,
  isValidCallScriptId,
  CALL_SCRIPT_FILE_MAP
};

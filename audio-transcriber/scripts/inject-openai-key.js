#!/usr/bin/env node

/**
 * Build-time script to inject OpenAI API key from environment variable
 * into Angular environment files.
 */

const fs = require('fs');
const path = require('path');

const apiKey = process.env.NG_APP_OPENAI_API_KEY || '';
const envFiles = [
  path.join(__dirname, '../src/environments/environment.ts'),
  path.join(__dirname, '../src/environments/environment.prod.ts')
];

envFiles.forEach(envFile => {
  if (fs.existsSync(envFile)) {
    let envContent = fs.readFileSync(envFile, 'utf8');
    
    // Replace the placeholder with the actual API key
    // If no key is provided, leave the placeholder (will cause error at runtime)
    const replacement = apiKey || '{{OPENAI_API_KEY}}';
    // Replace the placeholder, handling both single and double quotes
    envContent = envContent.replace(/'{{OPENAI_API_KEY}}'/g, `'${replacement}'`);
    envContent = envContent.replace(/"{{OPENAI_API_KEY}}"/g, `"${replacement}"`);
    
    // Write back to file
    fs.writeFileSync(envFile, envContent, 'utf8');
    console.log(`✅ OpenAI API key injected into ${path.basename(envFile)}`);
  }
});


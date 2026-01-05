#!/usr/bin/env node
/**
 * Script pour valider et identifier les balises JSX non fermées
 */

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node validate-jsx.js <file-path>');
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Tags auto-fermants
const selfClosingTags = new Set([
  'input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 
  'embed', 'source', 'track', 'wbr', 'Image'
]);

// État de parsing
const stack = [];
const errors = [];

// Regex pour trouver les balises JSX
const tagRegex = /<(\/?)([\w\.]+)([^>]*?)(\/?)>/g;
const jsxCommentRegex = /\/\*.*?\*\//gs;
const stringRegex = /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g;

function isInString(line, pos) {
  // Vérifier si la position est dans une chaîne
  let inString = false;
  let stringChar = null;
  for (let i = 0; i < pos; i++) {
    const char = line[i];
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && line[i-1] !== '\\') {
      inString = false;
      stringChar = null;
    }
  }
  return inString;
}

// Analyser chaque ligne
lines.forEach((line, lineNum) => {
  const lineIndex = lineNum + 1;
  
  // Ignorer les commentaires
  const withoutComments = line.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/g, '');
  
  // Trouver toutes les balises
  let match;
  const tagMatches = [];
  
  // Remplacer temporairement les chaînes pour éviter de matcher dedans
  const stringPlaceholders = [];
  let placeholderIndex = 0;
  const lineWithoutStrings = line.replace(/["'`](?:\\.|[^"\\])*["'`]/g, (match) => {
    const placeholder = `__STRING_${placeholderIndex++}__`;
    stringPlaceholders.push(match);
    return placeholder;
  });
  
  const regex = /<(\/?)([\w\.]+)([^>]*?)(\/?)>/g;
  while ((match = regex.exec(lineWithoutStrings)) !== null) {
    const [fullMatch, closing, tagName, attributes, selfClosing] = match;
    const actualPos = match.index;
    
    tagMatches.push({
      fullMatch,
      closing: closing === '/',
      tagName: tagName.trim(),
      attributes,
      selfClosing: selfClosing === '/',
      pos: actualPos,
      line: lineIndex
    });
  }
  
  // Traiter les balises dans l'ordre
  tagMatches.forEach(({ closing, tagName, selfClosing, line: tagLine }) => {
    const tagLower = tagName.toLowerCase();
    
    if (selfClosing || selfClosingTags.has(tagLower)) {
      // Balise auto-fermante, on ignore
      return;
    }
    
    if (closing) {
      // Balise fermante
      if (stack.length === 0) {
        errors.push({
          type: 'unexpected-closing',
          tag: tagName,
          line: tagLine,
          message: `Balise fermante </${tagName}> sans balise ouvrante correspondante`
        });
      } else {
        const last = stack[stack.length - 1];
        if (last.tagName !== tagName && last.tagName.toLowerCase() !== tagName.toLowerCase()) {
          errors.push({
            type: 'mismatch',
            expected: last.tagName,
            found: tagName,
            line: tagLine,
            openedAt: last.line,
            message: `Balise </${tagName}> fermée mais <${last.tagName}> ouverte à la ligne ${last.line}`
          });
        } else {
          stack.pop();
        }
      }
    } else {
      // Balise ouvrante
      stack.push({
        tagName,
        line: tagLine
      });
    }
  });
});

// Vérifier les balises non fermées
stack.forEach(({ tagName, line }) => {
  errors.push({
    type: 'unclosed',
    tag: tagName,
    line,
    message: `Balise <${tagName}> ouverte à la ligne ${line} n'est pas fermée`
  });
});

// Afficher les résultats
if (errors.length > 0) {
  console.log(`\n❌ ${errors.length} erreur(s) trouvée(s):\n`);
  errors.slice(0, 50).forEach((error, idx) => {
    console.log(`${idx + 1}. Ligne ${error.line}: ${error.message}`);
    if (error.openedAt) {
      console.log(`   (Ouverte à la ligne ${error.openedAt})`);
    }
  });
  if (errors.length > 50) {
    console.log(`\n... et ${errors.length - 50} autres erreurs`);
  }
  process.exit(1);
} else {
  console.log('✅ Aucune erreur de balise JSX détectée');
  process.exit(0);
}





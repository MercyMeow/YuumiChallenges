#!/usr/bin/env node

/**
 * Script to create a new branch following the project's branching strategy
 * Usage: node scripts/create-branch.js <branch-type> <branch-name>
 * Example: node scripts/create-branch.js feature user-authentication
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Valid branch types
const validBranchTypes = ['feature', 'bugfix', 'hotfix', 'release'];

// Get branch type and name from command line arguments
const branchType = process.argv[2];
const branchName = process.argv[3];

// Validate branch type and name
if (!branchType || !validBranchTypes.includes(branchType)) {
  console.error(`Error: Invalid or missing branch type. Valid types are: ${validBranchTypes.join(', ')}`);
  console.log('Usage: node scripts/create-branch.js <branch-type> <branch-name>');
  process.exit(1);
}

if (!branchName) {
  console.error('Error: Missing branch name');
  console.log('Usage: node scripts/create-branch.js <branch-type> <branch-name>');
  process.exit(1);
}

// Format branch name (replace spaces with hyphens, lowercase)
const formattedBranchName = branchName.toLowerCase().replace(/\s+/g, '-');
const fullBranchName = `${branchType}/${formattedBranchName}`;

// Determine base branch based on branch type
let baseBranch;
switch (branchType) {
  case 'hotfix':
    baseBranch = 'main';
    break;
  case 'release':
    baseBranch = 'develop';
    break;
  default:
    baseBranch = 'develop';
}

// Check if branch already exists
try {
  const branches = execSync('git branch -a').toString();
  if (branches.includes(fullBranchName)) {
    console.error(`Error: Branch '${fullBranchName}' already exists`);
    process.exit(1);
  }
} catch (error) {
  console.error('Error checking existing branches:', error.message);
  process.exit(1);
}

// Confirm branch creation
rl.question(`Create branch '${fullBranchName}' from '${baseBranch}'? (y/n) `, (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    try {
      // Make sure we have the latest version of the base branch
      console.log(`Fetching latest changes from remote...`);
      execSync('git fetch', { stdio: 'inherit' });
      
      // Checkout the base branch
      console.log(`Checking out ${baseBranch}...`);
      execSync(`git checkout ${baseBranch}`, { stdio: 'inherit' });
      
      // Pull the latest changes
      console.log(`Pulling latest changes...`);
      execSync(`git pull origin ${baseBranch}`, { stdio: 'inherit' });
      
      // Create and checkout the new branch
      console.log(`Creating and checking out new branch: ${fullBranchName}...`);
      execSync(`git checkout -b ${fullBranchName}`, { stdio: 'inherit' });
      
      console.log(`\nBranch '${fullBranchName}' created successfully!`);
      console.log(`\nRemember to push your branch to remote when ready:`);
      console.log(`git push -u origin ${fullBranchName}`);
      
      // Provide guidance based on branch type
      switch (branchType) {
        case 'feature':
          console.log(`\nFeature Branch Guidelines:`);
          console.log(`- Develop your feature with regular commits`);
          console.log(`- When complete, create a pull request to merge into 'develop'`);
          break;
        case 'bugfix':
          console.log(`\nBugfix Branch Guidelines:`);
          console.log(`- Fix the bug with regular commits`);
          console.log(`- When complete, create a pull request to merge into 'develop'`);
          break;
        case 'hotfix':
          console.log(`\nHotfix Branch Guidelines:`);
          console.log(`- Fix the issue with regular commits`);
          console.log(`- When complete, create a pull request to merge into 'main'`);
          console.log(`- Also merge the hotfix into 'develop'`);
          break;
        case 'release':
          console.log(`\nRelease Branch Guidelines:`);
          console.log(`- Make final adjustments, version bumps, and documentation updates`);
          console.log(`- When ready, create a pull request to merge into 'main'`);
          console.log(`- After merging, tag the release in 'main'`);
          console.log(`- Also merge back into 'develop'`);
          break;
      }
    } catch (error) {
      console.error('Error creating branch:', error.message);
    }
  } else {
    console.log('Branch creation cancelled');
  }
  
  rl.close();
});

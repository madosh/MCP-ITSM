// Simple test script for MCP ITSM tools
const { spawn } = require('child_process');
const readline = require('readline');

// Start the index.js process
const proc = spawn('node', ['index.js']);

// Create readline interface for the process
const rl = readline.createInterface({
  input: proc.stdout,
  output: process.stdout,
  terminal: false
});

// Handle process output
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    console.log('Received response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.log('Received output:', line);
  }
});

// Handle process errors
proc.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

// Test functions
const testFunctions = [
  {
    type: 'function',
    name: 'create_ticket',
    arguments: {
      title: 'Test Ticket',
      description: 'This is a test ticket',
      priority: 'medium',
      system: 'jira'
    }
  },
  {
    type: 'function_call',
    id: '123',
    function_call: {
      name: 'create_ticket',
      arguments: {
        title: 'Test Ticket (function_call format)',
        description: 'This is a test ticket using function_call format',
        priority: 'high',
        system: 'servicenow'
      }
    }
  },
  {
    type: 'tool_call',
    id: '456',
    data: {
      name: 'create_ticket',
      parameters: {
        title: 'Test Ticket (tool_call format)',
        description: 'This is a test ticket using tool_call format',
        priority: 'low',
        system: 'zendesk'
      }
    }
  }
];

// Send test functions with delay
let index = 0;
const sendNextTest = () => {
  if (index < testFunctions.length) {
    const test = testFunctions[index++];
    console.log(`\nSending test ${index}:`, JSON.stringify(test, null, 2));
    proc.stdin.write(JSON.stringify(test) + '\n');
    setTimeout(sendNextTest, 1000);
  } else {
    console.log('\nAll tests sent. Press Ctrl+C to exit.');
  }
};

// Start testing after a short delay
console.log('Starting tests in 1 second...');
setTimeout(sendNextTest, 1000);

// Handle process exit
process.on('SIGINT', () => {
  console.log('Terminating test...');
  proc.kill();
  process.exit();
}); 
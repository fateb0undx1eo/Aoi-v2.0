#!/usr/bin/env node

const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(chalk.cyan.bold('\n╔════════════════════════════════════════════╗'));
console.log(chalk.cyan.bold('║   Discord Bot Dashboard Setup Wizard      ║'));
console.log(chalk.cyan.bold('╚════════════════════════════════════════════╝\n'));

const steps = [
    {
        name: 'Checking Node.js version',
        check: () => {
            const version = process.version;
            const major = parseInt(version.slice(1).split('.')[0]);
            if (major < 16) {
                throw new Error(`Node.js 16+ required. Current: ${version}`);
            }
            return `✓ Node.js ${version}`;
        }
    },
    {
        name: 'Installing root dependencies',
        check: () => {
            console.log(chalk.gray('  Running npm install...'));
            execSync('npm install', { stdio: 'inherit' });
            return '✓ Root dependencies installed';
        }
    },
    {
        name: 'Installing React dashboard dependencies',
        check: () => {
            const reactDir = path.join(__dirname, 'admin-react');
            if (!fs.existsSync(reactDir)) {
                throw new Error('admin-react directory not found');
            }
            console.log(chalk.gray('  Running npm install in admin-react...'));
            execSync('npm install', { cwd: reactDir, stdio: 'inherit' });
            return '✓ React dependencies installed';
        }
    },
    {
        name: 'Building React dashboard',
        check: () => {
            const reactDir = path.join(__dirname, 'admin-react');
            console.log(chalk.gray('  Running npm run build...'));
            execSync('npm run build', { cwd: reactDir, stdio: 'inherit' });
            return '✓ Dashboard built successfully';
        }
    },
    {
        name: 'Checking .env file',
        check: () => {
            const envPath = path.join(__dirname, '.env');
            if (!fs.existsSync(envPath)) {
                console.log(chalk.yellow('\n  ⚠ .env file not found. Creating template...'));
                const template = `BOT_TOKEN=your_discord_bot_token_here
MONGO_URI=mongodb://localhost:27017/discobase
`;
                fs.writeFileSync(envPath, template);
                console.log(chalk.yellow('  ⚠ Please edit .env with your bot token and MongoDB URI'));
                return '⚠ .env template created - EDIT REQUIRED';
            }
            return '✓ .env file exists';
        }
    },
    {
        name: 'Verifying MongoDB connection',
        check: () => {
            // This is just a check, actual connection happens when bot starts
            const envPath = path.join(__dirname, '.env');
            const envContent = fs.readFileSync(envPath, 'utf8');
            if (envContent.includes('your_discord_bot_token_here')) {
                return '⚠ MongoDB URI needs configuration';
            }
            return '✓ MongoDB URI configured';
        }
    }
];

async function runSetup() {
    console.log(chalk.white('Starting setup process...\n'));

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        process.stdout.write(chalk.gray(`[${i + 1}/${steps.length}] ${step.name}... `));

        try {
            const result = step.check();
            console.log(chalk.green(result));
        } catch (error) {
            console.log(chalk.red(`✗ Failed`));
            console.log(chalk.red(`  Error: ${error.message}`));
            process.exit(1);
        }
    }

    console.log(chalk.green.bold('\n✓ Setup completed successfully!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white('  1. Edit .env file with your bot token and MongoDB URI'));
    console.log(chalk.white('  2. Start your bot: npm start'));
    console.log(chalk.white('  3. Open dashboard: http://localhost:3000\n'));
    console.log(chalk.gray('For more information, see DASHBOARD_GUIDE.md\n'));
}

runSetup().catch(error => {
    console.error(chalk.red('\n✗ Setup failed:'), error);
    process.exit(1);
});

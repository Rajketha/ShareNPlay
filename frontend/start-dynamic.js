const { spawn, exec } = require('child_process');
const os = require('os');

// 1. Find the current local IP address
const networkInterfaces = os.networkInterfaces();
let currentIp = 'localhost';

for (const interfaceName in networkInterfaces) {
    const networkInterface = networkInterfaces[interfaceName];
    for (const iface of networkInterface) {
        // Skip IPv6, Internal (127.0.0.1), and VirtualBox (192.168.56.x)
        if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('192.168.56.')) {
            currentIp = iface.address;
            break;
        }
    }
    if (currentIp !== 'localhost') break;
}

const targetUrl = `http://${currentIp}:3002`;

console.log(`\n🌐 Network detected! Your IP is: ${currentIp}`);
console.log(`🚀 Forcing browser to open at: ${targetUrl}\n`);

// 2. Launch the React dev server
// BROWSER=none prevents opening 'localhost' by default
const startProcess = spawn('npx', [
    'cross-env', 
    'BROWSER=none', 
    'HOST=0.0.0.0', 
    'PORT=3002', 
    'DANGEROUSLY_DISABLE_HOST_CHECK=true', 
    'react-scripts', 
    'start'
], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, BROWSER_HOST: currentIp }
});

// 3. Force-open the correct IP after a 3-second delay
setTimeout(() => {
    const startCmd = process.platform === 'win32' ? 'start' : 'open';
    exec(`${startCmd} ${targetUrl}`);
}, 3000); 

startProcess.on('error', (err) => {
    console.error('Failed to start frontend:', err);
});
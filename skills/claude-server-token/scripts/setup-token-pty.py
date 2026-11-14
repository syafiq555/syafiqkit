"""Run `claude setup-token` headless so a remote user can complete the login.

Usage: python3 -I setup-token-pty.py <workdir>
  <workdir>/out.log  everything the CLI prints (holds the token at the end; keep it private)
  <workdir>/in       FIFO: write the pasted code, then a separate "\r", to answer the prompt

The CLI needs a terminal, so it runs under a pty with a 1000-column window
(so the sign-in URL and the token print on one line each) and reads its
input from the FIFO, letting a later shell call feed it the code.
"""

import fcntl
import os
import pty
import select
import struct
import sys
import termios

workdir = sys.argv[1]
fifo = os.path.join(workdir, "in")
if not os.path.exists(fifo):
    os.mkfifo(fifo, 0o600)

pid, fd = pty.fork()
if pid == 0:
    os.environ["COLUMNS"] = "1000"
    os.execvp("claude", ["claude", "setup-token"])

fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 50, 1000, 0, 0))
out = open(os.path.join(workdir, "out.log"), "ab", buffering=0)
inp = os.open(fifo, os.O_RDONLY | os.O_NONBLOCK)

while True:
    ready, _, _ = select.select([fd, inp], [], [], 1)
    if fd in ready:
        try:
            data = os.read(fd, 4096)
        except OSError:
            break
        if not data:
            break
        out.write(data)
    if inp in ready:
        data = os.read(inp, 4096)
        if data:
            os.write(fd, data)
    if os.waitpid(pid, os.WNOHANG)[0]:
        try:
            while data := os.read(fd, 4096):
                out.write(data)
        except OSError:
            pass
        break

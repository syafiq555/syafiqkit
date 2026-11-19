import { homedir } from 'node:os'
import { join } from 'node:path'

export const SECRET_HOME_PATHS = [
  '.ssh',
  '.aws',
  '.gnupg',
  '.kube',
  '.docker',
  '.claude',
  '.claude.json',
  '.config',
  '.npmrc',
  '.netrc',
  '.git-credentials',
  '.pgpass',
  '.zsh_history',
  '.bash_history',
  '.zshenv',
  '.zshrc',
  '.zprofile',
  '.bashrc',
  '.bash_profile',
  '.profile',
  '.gitconfig',
  'Library/Keychains',
  'Library/Mail',
  'Library/Application Support',
  'Library/Cookies',
]

const SECRET_NAMES =
  /(^|\/)(\.env(\.[^/]*)?|id_[a-z0-9]+|[^/]*\.(pem|key|p12|pfx|p8|keystore|jks|kdbx|tfstate|sqlite|sqlite3|db)|auth\.json|\.mcp\.json|\.npmrc|\.netrc|\.pgpass|\.pypirc|\.git-credentials|\.htpasswd|service-account[^/]*\.json|credentials[^/]*|secrets?[^/]*|claude\.local\.md|\.claude\/settings(\.local)?\.json)$/i

export function isSecretPath(resolved: string, home = homedir()): boolean {
  const path = resolved.toLowerCase()
  const inHome = (entry: string) => {
    const base = join(home, entry).toLowerCase()
    return path === base || path.startsWith(`${base}/`)
  }
  return SECRET_HOME_PATHS.some(inHome) || SECRET_NAMES.test(resolved)
}

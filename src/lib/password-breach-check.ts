/**
 * HIBP (Have I Been Pwned) Password Breach Check
 * ================================================
 * Implements k-anonymity to check if a password has been exposed in data breaches
 * without sending the actual password over the network.
 * 
 * How it works:
 * 1. Hash the password with SHA-1
 * 2. Send only the first 5 characters to HIBP API
 * 3. HIBP returns all hashes starting with those 5 chars
 * 4. Check locally if the full hash is in the results
 */

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Generate SHA-1 hash of a password
 */
async function sha1Hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return bufferToHex(hashBuffer);
}

export interface BreachCheckResult {
  isBreached: boolean;
  count: number;
  error?: string;
}

/**
 * Check if a password has been exposed in known data breaches
 * Uses the HIBP Pwned Passwords API with k-anonymity
 * 
 * @param password - The password to check
 * @returns Object containing breach status and occurrence count
 */
export async function checkPasswordBreach(password: string): Promise<BreachCheckResult> {
  try {
    // Generate SHA-1 hash of the password
    const hash = await sha1Hash(password);
    
    // Split into prefix (first 5 chars) and suffix (rest)
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);
    
    // Query HIBP API with only the prefix (k-anonymity)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Adds padding to prevent response size analysis
        'User-Agent': 'Wouaka-Credit-Score-Security-Check',
      },
    });
    
    if (!response.ok) {
      console.error('[HIBP] API error:', response.status);
      // Fail open for availability, but log the issue
      return { isBreached: false, count: 0, error: 'Service unavailable' };
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    // Check if our suffix is in the returned list
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix.trim().toUpperCase() === suffix) {
        const count = parseInt(countStr.trim(), 10);
        return { isBreached: true, count };
      }
    }
    
    return { isBreached: false, count: 0 };
  } catch (error) {
    console.error('[HIBP] Check failed:', error);
    // Fail open for availability - don't block users on network errors
    return { isBreached: false, count: 0, error: 'Check failed' };
  }
}

/**
 * Get a user-friendly message for breached passwords
 */
export function getBreachWarningMessage(count: number): string {
  if (count > 1000000) {
    return `Ce mot de passe a été exposé plus d'un million de fois dans des fuites de données. Veuillez en choisir un autre.`;
  } else if (count > 100000) {
    return `Ce mot de passe a été exposé plus de 100 000 fois dans des fuites de données. Veuillez en choisir un autre.`;
  } else if (count > 10000) {
    return `Ce mot de passe a été exposé plus de 10 000 fois dans des fuites de données. Veuillez en choisir un autre.`;
  } else if (count > 1000) {
    return `Ce mot de passe a été exposé plus de 1 000 fois dans des fuites de données. Veuillez en choisir un autre.`;
  } else {
    return `Ce mot de passe a été exposé ${count.toLocaleString('fr-FR')} fois dans des fuites de données. Veuillez en choisir un autre.`;
  }
}

/**
 * Validate password against breach database
 * Returns error message if breached, null if safe
 */
export async function validatePasswordNotBreached(password: string): Promise<string | null> {
  const result = await checkPasswordBreach(password);
  
  if (result.isBreached) {
    return getBreachWarningMessage(result.count);
  }
  
  return null;
}

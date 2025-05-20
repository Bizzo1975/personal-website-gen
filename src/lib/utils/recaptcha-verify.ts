/**
 * ReCAPTCHA verification utility
 * 
 * This module provides server-side functions to verify Google reCAPTCHA tokens
 */

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export interface RecaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string; // timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ)
  hostname?: string;     // the hostname of the site where the reCAPTCHA was solved
  'error-codes'?: string[]; // optional error codes
  score?: number;        // score for v3 reCAPTCHA (1.0 is very likely a good interaction, 0.0 is very likely a bot)
  action?: string;       // the action name for v3 reCAPTCHA
}

/**
 * Verify a reCAPTCHA token with Google's API
 * @param token The reCAPTCHA token to verify
 * @param remoteip Optional IP address of the user
 * @returns Verification result
 */
export async function verifyRecaptchaToken(
  token: string,
  remoteip?: string
): Promise<RecaptchaVerifyResponse> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.error('RECAPTCHA_SECRET_KEY is not defined in environment variables');
    return { 
      success: false, 
      'error-codes': ['missing-input-secret'] 
    };
  }

  if (!token) {
    return { 
      success: false, 
      'error-codes': ['missing-input-response'] 
    };
  }

  try {
    // Prepare form data for the request
    const formData = new URLSearchParams();
    formData.append('secret', RECAPTCHA_SECRET_KEY);
    formData.append('response', token);
    
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    // Make the verification request to Google
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      console.error('reCAPTCHA verification failed', response.statusText);
      return { 
        success: false, 
        'error-codes': ['bad-request'] 
      };
    }

    const data = await response.json() as RecaptchaVerifyResponse;
    return data;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return { 
      success: false, 
      'error-codes': ['internal-error'] 
    };
  }
}

/**
 * Check if a reCAPTCHA verification was successful
 * @param verifyResponse The verification response from Google
 * @param minScore Minimum score required for v3 reCAPTCHA (0.0 to 1.0)
 * @returns Whether the verification was successful
 */
export function isRecaptchaValid(
  verifyResponse: RecaptchaVerifyResponse,
  minScore?: number
): boolean {
  // For v3 reCAPTCHA, check the score if provided
  if (minScore !== undefined && verifyResponse.score !== undefined) {
    return verifyResponse.success && verifyResponse.score >= minScore;
  }
  
  // For v2 reCAPTCHA, just check success
  return verifyResponse.success;
}

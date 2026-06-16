import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js"

const poolData = {
  UserPoolId: import.meta.env.VITE_USER_POOL_ID || "us-east-1_NBTFc2cXV",
  ClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || "6ermthas4r8n6q3e4ojq9flqf0",
}

const userPool = new CognitoUserPool(poolData)

// Sign up with email — triggers email verification code.
// If `password` is omitted, a random one is generated and stashed for the
// passwordless email-OTP flow (used by AuthScreen).
// `phone` is optional — if provided, stored as Cognito phone_number attribute.
export function signUp(email, password, phone = null) {
  return new Promise((resolve, reject) => {
    const attributes = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
    ]
    if (phone) {
      attributes.push(new CognitoUserAttribute({ Name: "phone_number", Value: phone }))
    }
    const isGenerated = !password
    const finalPassword = password || `Pr5${Math.random().toString(36).slice(2)}!A`
    userPool.signUp(email, finalPassword, attributes, null, (err, result) => {
      if (err) return reject(err)
      // Stash generated password so we can sign in after confirmation
      if (isGenerated) sessionStorage.setItem(`pw_${email}`, finalPassword)
      resolve(result.user)
    })
  })
}

// Confirm the email verification code
export function confirmSignUp(email, code) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool })
    user.confirmRegistration(code, true, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

// Holds the CognitoUser object when a SOFTWARE_TOKEN_MFA challenge is pending.
let _pendingMfaUser = null

// Sign in after confirmation. If `password` is omitted, falls back to the
// stashed password from the passwordless email-OTP flow (AuthScreen).
export function signIn(email, password) {
  return new Promise((resolve, reject) => {
    const finalPassword = password || sessionStorage.getItem(`pw_${email}`)
    const user = new CognitoUser({ Username: email, Pool: userPool })
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: finalPassword,
    })
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        sessionStorage.removeItem(`pw_${email}`)
        resolve(session)
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: () => {
        sessionStorage.setItem(`pw_${email}`, finalPassword)
        resolve({ challengeName: "NEW_PASSWORD_REQUIRED" })
      },
      totpRequired: () => {
        _pendingMfaUser = user
        resolve({ challengeName: "SOFTWARE_TOKEN_MFA" })
      },
    })
  })
}

// Submit a TOTP code in response to a SOFTWARE_TOKEN_MFA challenge during login.
export function respondToTotpChallenge(code) {
  return new Promise((resolve, reject) => {
    if (!_pendingMfaUser) return reject(new Error("No pending MFA challenge"))
    _pendingMfaUser.sendMFACode(
      code,
      {
        onSuccess: (session) => { _pendingMfaUser = null; resolve(session) },
        onFailure: (err)     => { _pendingMfaUser = null; reject(err) },
      },
      "SOFTWARE_TOKEN_MFA"
    )
  })
}

// Start TOTP enrollment for the currently signed-in user. Returns the secret key.
export function associateSoftwareToken() {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser()
    if (!user) return reject(new Error("Not logged in"))
    user.getSession((err, session) => {
      if (err || !session.isValid()) return reject(new Error("Invalid session"))
      user.associateSoftwareToken({
        associateSecretCode: (secretCode) => resolve(secretCode),
        onFailure: (err) => reject(err),
      })
    })
  })
}

// Verify a TOTP code to complete enrollment.
export function verifySoftwareToken(code) {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser()
    if (!user) return reject(new Error("Not logged in"))
    user.getSession((err, session) => {
      if (err || !session.isValid()) return reject(new Error("Invalid session"))
      user.verifySoftwareToken(code, "PR5JECT Authenticator", {
        onSuccess: (result) => resolve(result),
        onFailure: (err)    => reject(err),
      })
    })
  })
}

// Complete a NEW_PASSWORD_REQUIRED challenge for a user who just signed in
// with a temporary password. Re-authenticates with the temporary password
// (stashed by signIn) and then submits the new password.
export function completeNewPasswordChallenge(email, newPassword) {
  return new Promise((resolve, reject) => {
    const tempPassword = sessionStorage.getItem(`pw_${email}`)
    const user = new CognitoUser({ Username: email, Pool: userPool })
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: tempPassword,
    })
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        sessionStorage.removeItem(`pw_${email}`)
        resolve(session)
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: (userAttributes) => {
        delete userAttributes.email_verified
        delete userAttributes.email
        user.completeNewPasswordChallenge(newPassword, userAttributes, {
          onSuccess: (session) => {
            sessionStorage.removeItem(`pw_${email}`)
            resolve(session)
          },
          onFailure: (err) => reject(err),
        })
      },
    })
  })
}

// Get current logged-in user's ID (the sub claim)
export function getCurrentUser() {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser()
    if (!user) return resolve(null)
    user.getSession((err, session) => {
      if (err || !session.isValid()) return resolve(null)
      const sub = session.getIdToken().payload.sub
      const email = session.getIdToken().payload.email
      resolve({ userId: sub, email })
    })
  })
}

export function signOut() {
  const user = userPool.getCurrentUser()
  if (user) user.signOut()
}

// Returns the raw Cognito ID token JWT string for the current session.
// Send this as `Authorization: Bearer <token>` on protected API routes.
export function getIdToken() {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser()
    if (!user) return resolve(null)
    user.getSession((err, session) => {
      if (err || !session.isValid()) return resolve(null)
      resolve(session.getIdToken().getJwtToken())
    })
  })
}

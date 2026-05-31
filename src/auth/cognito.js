import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js"

const poolData = {
  UserPoolId: import.meta.env.VITE_USER_POOL_ID || "us-east-1_ty8I3epyx",
  ClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || "i2atj59jlhoqq7cil8354hu1",
}

const userPool = new CognitoUserPool(poolData)

// Sign up with phone number — triggers SMS code
export function signUp(phone) {
  return new Promise((resolve, reject) => {
    const attributes = [
      new CognitoUserAttribute({ Name: "phone_number", Value: phone }),
    ]
    // Cognito requires a password; we generate a random one since auth is SMS-based
    const password = `Pr5${Math.random().toString(36).slice(2)}!A`
    userPool.signUp(phone, password, attributes, null, (err, result) => {
      if (err) return reject(err)
      // Stash password so we can sign in after confirmation
      sessionStorage.setItem(`pw_${phone}`, password)
      resolve(result.user)
    })
  })
}

// Confirm the SMS code
export function confirmSignUp(phone, code) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: phone, Pool: userPool })
    user.confirmRegistration(code, true, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

// Sign in after confirmation (uses stashed password)
export function signIn(phone) {
  return new Promise((resolve, reject) => {
    const password = sessionStorage.getItem(`pw_${phone}`)
    const user = new CognitoUser({ Username: phone, Pool: userPool })
    const authDetails = new AuthenticationDetails({
      Username: phone,
      Password: password,
    })
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        sessionStorage.removeItem(`pw_${phone}`)
        resolve(session)
      },
      onFailure: (err) => reject(err),
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
      const phone = session.getIdToken().payload.phone_number
      resolve({ userId: sub, phone })
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

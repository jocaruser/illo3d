import * as jose from 'jose'

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
].join(' ')

export async function exchangeSaToken(): Promise<string> {
  const email = import.meta.env.VITE_SA_CLIENT_EMAIL
  const privateKey = import.meta.env.VITE_SA_PRIVATE_KEY

  if (!email || !privateKey) {
    throw new Error('VITE_SA_CREDENTIALS_FILE (path to SA JSON) must be set')
  }

  const key = await jose.importPKCS8(
    privateKey.replace(/\\n/g, '\n'),
    'RS256'
  )

  const iat = Math.floor(Date.now() / 1000)
  const jwt = await new jose.SignJWT({ scope: SCOPES })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(email)
    .setAudience(TOKEN_ENDPOINT)
    .setIssuedAt(iat)
    .setExpirationTime(iat + 3600)
    .sign(key)

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  })

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    // #region agent log
    fetch('http://127.0.0.1:7440/ingest/85491a51-4856-4a34-ba22-bb33abdb1d3a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'070249'},body:JSON.stringify({sessionId:'070249',runId:'pre-fix',hypothesisId:'H1',location:'src/services/auth/devLogin.ts:47',message:'dev login token exchange failed',data:{status:response.status,errorSnippet:text.slice(0,200)},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    throw new Error(`Token exchange failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as {
    access_token: string
    scope?: string
    token_type?: string
    expires_in?: number
  }
  // #region agent log
  fetch('http://127.0.0.1:7440/ingest/85491a51-4856-4a34-ba22-bb33abdb1d3a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'070249'},body:JSON.stringify({sessionId:'070249',runId:'pre-fix',hypothesisId:'H1',location:'src/services/auth/devLogin.ts:60',message:'dev login token exchange success',data:{hasAccessToken:Boolean(data.access_token),scope:data.scope??null,tokenType:data.token_type??null,expiresIn:data.expires_in??null},timestamp:Date.now()})}).catch(()=>{})
  // #endregion
  return data.access_token
}

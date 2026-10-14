import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createAuthorization, credentialsFromToken, REDIRECT_URI, requestToken, validateCallback } from "./spotify-client.mjs";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const authorization = createAuthorization(clientId);
const privateDirectory = fileURLToPath(new URL("../../private-data/music/", import.meta.url));
const credentialsPath = `${privateDirectory}/spotify-authorization.json`;
let processing = false;
let timeout;

const server = createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  if (request.headers.host !== "127.0.0.1:43821" || request.method !== "GET") {
    response.writeHead(400).end("Invalid callback request.");
    return;
  }
  const url = new URL(request.url, REDIRECT_URI);
  if (url.pathname !== "/callback") {
    response.writeHead(404).end("Not found.");
    return;
  }
  let code;
  try { code = validateCallback(url, authorization.state); }
  catch { response.writeHead(400).end("Authorization failed. Restart the connection and try again."); return; }
  if (processing) { response.writeHead(409).end("Authorization is already being processed."); return; }
  processing = true;
  try {
    const token = await requestToken({
      grant_type: "authorization_code", client_id: clientId, code,
      code_verifier: authorization.verifier, redirect_uri: REDIRECT_URI,
    });
    const credentials = credentialsFromToken(token, { client_id: clientId });
    await mkdir(privateDirectory, { recursive: true, mode: 0o700 });
    // Never overwrite existing authorization silently or print tokens.
    await writeFile(credentialsPath, `${JSON.stringify(credentials, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    response.end("Spotify connected locally. You may close this tab. Hosted collection still needs to be configured.");
    console.log("Authorization saved in the Git-ignored private-data/music directory. No collector is running yet.");
  } catch (error) {
    response.writeHead(500).end("Connection could not be saved. Check the local terminal.");
    console.error(error.code === "EEXIST" ? "Existing authorization found. Remove it privately before reconnecting." : "Connection failed; no tokens were printed. Restart to retry.");
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
    server.close();
  }
});
server.on("error", () => { console.error("Could not start the loopback callback server on port 43821."); process.exitCode = 1; });
server.listen(43821, "127.0.0.1", () => {
  console.log(`Open this Spotify authorization link in your browser:\n${authorization.url}`);
  timeout = setTimeout(() => { console.error("Authorization timed out. Restart to try again."); server.close(); process.exitCode = 1; }, 10 * 60_000);
});

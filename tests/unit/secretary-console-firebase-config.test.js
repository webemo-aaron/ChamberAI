import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("secretary console loads firebase config before app bootstrap", () => {
  const indexHtml = read("apps/secretary-console/index.html");

  assert.match(indexHtml, /<script src="\.\/*firebase-config\.js"><\/script>/);
  assert.match(indexHtml, /<script type="module" src="\.\/*app\.js"><\/script>/);
  assert.ok(
    indexHtml.indexOf('<script src="./firebase-config.js"></script>') <
      indexHtml.indexOf('<script type="module" src="./app.js"></script>')
  );
});

test("secretary console firebase config uses production web app and limits emulator auth to localhost", () => {
  const configJs = read("apps/secretary-console/firebase-config.js");

  assert.match(configJs, /window\.location\.hostname === "localhost"/);
  assert.match(configJs, /window\.location\.hostname === "127\.0\.0\.1"/);
  assert.match(configJs, /apiKey: "AIzaSyAuK2PUSKp4-mewEMHsiF9YRuFQuDNsC4M"/);
  assert.match(configJs, /projectId: "cam-aim-dev"/);
  assert.match(configJs, /storageBucket: "cam-aim-dev\.firebasestorage\.app"/);
  assert.match(configJs, /messagingSenderId: "63262052942"/);
  assert.match(configJs, /appId: "1:63262052942:web:0ab2cf03f065df5e16e91f"/);
  assert.match(configJs, /useEmulator: isLocalDevHost/);
});

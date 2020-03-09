---
title: How to find directory containing Firefox policies.json file on Linux
date: 2020-03-03T17:22:04.375Z
description: ' '
---
Recently, I wanted to use one of Firefox's [Enterprise Policies](https://support.mozilla.org/en-US/products/firefox-enterprise/policies-customization-enterprise/policies-overview-enterprise) settings but I didn't know which directory to put the policies.json file in. After some trial and error, I came across [these lines in Firefox's source](https://github.com/mozilla/gecko-dev/blob/445f39a14b9c1f38f1254813e4330ef0d8618b4b/toolkit/components/enterprisepolicies/EnterprisePolicies.js#L472-L481):

```javascript
_getConfigurationFile() {
  let configFile = null;
  try {
    let perUserPath = Services.prefs.getBoolPref(PREF_PER_USER_DIR, false);
    if (perUserPath) {
      configFile = Services.dirsvc.get("XREUserRunTimeDir", Ci.nsIFile);
    } else {
      configFile = Services.dirsvc.get("XREAppDist", Ci.nsIFile);
    }
    configFile.append(POLICIES_FILENAME);
```

The `Services` object is available in Firefox's `about:*` pages (`about:preferences`, `about:policy`, `about:config`, etc.), so you can find Firefox's global `distribution` path on your system by running 

```js
Services.dirsvc.get("XREAppDist", Ci.nsIFile).path
```

in the Firefox console (ctrl + shift + c) on any of these pages.

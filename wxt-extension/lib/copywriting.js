const COPYWRITING_URL =
  "https://ywzhpwcufwtezawhcjxv.supabase.co/storage/v1/object/public/copywriting/copywriting.json";

let copywritingPromise;

function getLocalCopywritingUrl() {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL("/copywriting.json");
  }

  return "/copywriting.json";
}

async function loadCopywriting(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load copywriting: ${response.status}`);
  }

  return response.json();
}

async function loadCopywritingWithFallback() {
  try {
    return await loadCopywriting(COPYWRITING_URL);
  } catch {
    return await loadCopywriting(getLocalCopywritingUrl());
  }
}

export async function getCopywriting() {
  if (!copywritingPromise) {
    copywritingPromise = loadCopywritingWithFallback();
  }

  try {
    return await copywritingPromise;
  } catch (error) {
    copywritingPromise = undefined;
    throw error;
  }
}

export async function getCopywritingSection(sectionName) {
  const copywriting = await getCopywriting();
  return copywriting?.[sectionName];
}

const DEFAULT_APP_URL = "https://www.zhonglens.dev";

export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredUrl) {
    return DEFAULT_APP_URL;
  }

  return configuredUrl.replace(/\/+$/, "");
}

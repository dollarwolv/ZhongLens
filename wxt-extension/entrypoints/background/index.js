import "webext-bridge/background";
import { initOcrHandlers } from "./ocr";
import { initAuthHandlers } from "./auth";

export default defineBackground(() => {
  initOcrHandlers();
  initAuthHandlers();
});

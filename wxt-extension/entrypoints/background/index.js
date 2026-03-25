import "webext-bridge/background";
import { initOcrHandlers } from "./ocr";
import { initAuthHandlers } from "./auth";
import { initPaymentHandlers } from "./payment";

export default defineBackground(() => {
  initOcrHandlers();
  initAuthHandlers();
  initPaymentHandlers();
});

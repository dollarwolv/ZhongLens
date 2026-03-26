import "webext-bridge/background";
import { initOcrHandlers } from "./ocr";
import { initAuthHandlers } from "./auth";
import { initPaymentHandlers } from "./payment";
import { initGeneralHandlers } from "./general";

export default defineBackground(() => {
  initGeneralHandlers();
  initOcrHandlers();
  initAuthHandlers();
  initPaymentHandlers();
});

/*
 * Gemma 4 E2B
 * iPhone / WebGPU Diagnostic Test
 *
 * No console required.
 */


// ============================================================
// Configuration
// ============================================================

const MODEL_URL =
  "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.litertlm";


// ============================================================
// State
// ============================================================

let engine = null;
let conversation = null;

let diagnosticPassed = 0;
let diagnosticFinished = false;


// ============================================================
// DOM
// ============================================================

const diagnosticButton =
  document.getElementById("diagnosticButton");

const loadModelButton =
  document.getElementById("loadModelButton");

const sendButton =
  document.getElementById("sendButton");

const userInput =
  document.getElementById("userInput");

const modelStatus =
  document.getElementById("modelStatus");

const debugOutput =
  document.getElementById("debugOutput");

const diagnosticCount =
  document.getElementById("diagnosticCount");

const overallBadge =
  document.getElementById("overallBadge");

const chat =
  document.getElementById("chat");


// ============================================================
// Utilities
// ============================================================

function now() {

  return new Date().toLocaleTimeString();

}


function log(message) {

  const old =
    debugOutput.textContent;

  debugOutput.textContent =
    `[${now()}] ${message}\n\n${old}`;

}


function errorMessage(error) {

  if (!error) {
    return "Unknown error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }

}


function setTest(id, state, message) {

  const element =
    document.getElementById(id);

  if (!element) return;

  element.classList.remove(
    "pending",
    "running",
    "success",
    "failed"
  );

  element.classList.add(state);

  const icon =
    element.querySelector(".test-icon");

  const text =
    element.querySelector("span");

  if (state === "pending") {
    icon.textContent = "○";
  }

  if (state === "running") {
    icon.textContent = "◌";
  }

  if (state === "success") {
    icon.textContent = "✓";
    diagnosticPassed++;
  }

  if (state === "failed") {
    icon.textContent = "!";
  }

  text.textContent = message;

  updateDiagnosticCount();

}


function updateDiagnosticCount() {

  diagnosticCount.textContent =
    `${diagnosticPassed} / 5`;

}


function setOverall(text, type) {

  overallBadge.textContent = text;

  overallBadge.className =
    `badge ${type}`;

}


function setModelStatus(text, type = "") {

  modelStatus.textContent = text;

  modelStatus.className =
    "status-box";

  if (type) {
    modelStatus.classList.add(type);
  }

}


function addMessage(role, text) {

  const message =
    document.createElement("div");

  message.className =
    `message ${role}`;

  const roleElement =
    document.createElement("div");

  roleElement.className =
    "message-role";

  roleElement.textContent =
    role === "user"
      ? "你"
      : "Gemma";

  const content =
    document.createElement("div");

  content.className =
    "message-content";

  content.textContent =
    text;

  message.appendChild(roleElement);
  message.appendChild(content);

  chat.appendChild(message);

  chat.scrollTop =
    chat.scrollHeight;

  return content;

}


// ============================================================
// Test 1 — Browser
// ============================================================

async function testBrowser() {

  setTest(
    "testBrowser",
    "running",
    "正在檢查瀏覽器..."
  );

  await sleep(200);

  const userAgent =
    navigator.userAgent;

  const isIOS =
    /iPhone|iPad|iPod/i.test(userAgent);

  log(
    `User Agent:\n${userAgent}`
  );

  if (isIOS) {

    setTest(
      "testBrowser",
      "success",
      "iPhone / iPad Safari 環境"
    );

    return true;

  }

  setTest(
    "testBrowser",
    "success",
    "瀏覽器可執行此測試"
  );

  return true;
}


// ============================================================
// Test 2 — WebGPU
// ============================================================

async function testWebGPU() {

  setTest(
    "testWebGPU",
    "running",
    "正在檢查 navigator.gpu..."
  );

  await sleep(200);

  if (!navigator.gpu) {

    setTest(
      "testWebGPU",
      "failed",
      "找不到 navigator.gpu"
    );

    log(
      "❌ WebGPU 不存在"
    );

    return false;
  }

  setTest(
    "testWebGPU",
    "success",
    "navigator.gpu 存在"
  );

  log(
    "✓ navigator.gpu OK"
  );

  return true;
}


// ============================================================
// Test 3 — GPU Adapter
// ============================================================

async function testAdapter() {

  setTest(
    "testAdapter",
    "running",
    "正在取得 GPU Adapter..."
  );

  await sleep(200);

  try {

    const adapter =
      await navigator.gpu.requestAdapter();

    if (!adapter) {

      setTest(
        "testAdapter",
        "failed",
        "requestAdapter() 沒有取得 GPU"
      );

      log(
        "❌ GPU Adapter = null"
      );

      return false;
    }

    log(
      "✓ GPU Adapter OK"
    );

    try {

      if (adapter.info) {

        log(
          `GPU Info:\n${JSON.stringify(
            adapter.info,
            null,
            2
          )}`
        );

      }

    } catch (e) {

      log(
        `GPU Info 讀取失敗：${errorMessage(e)}`
      );

    }

    setTest(
      "testAdapter",
      "success",
      "GPU Adapter 成功"
    );

    return true;

  } catch (error) {

    setTest(
      "testAdapter",
      "failed",
      errorMessage(error)
    );

    log(
      `❌ GPU Adapter Error\n${errorMessage(error)}`
    );

    return false;
  }
}


// ============================================================
// Test 4 — LiteRT-LM
// ============================================================

async function testLiteRT() {

  setTest(
    "testLiteRT",
    "running",
    "正在檢查 LiteRT-LM..."
  );

  await sleep(200);

  if (window.LiteRTModuleError) {

    const message =
      errorMessage(
        window.LiteRTModuleError
      );

    setTest(
      "testLiteRT",
      "failed",
      "LiteRT-LM 載入失敗"
    );

    log(
      `❌ LiteRT-LM Import Error\n${message}`
    );

    return false;
  }


  if (!window.LiteRTModule) {

    setTest(
      "testLiteRT",
      "failed",
      "LiteRT-LM Module 不存在"
    );

    log(
      "❌ window.LiteRTModule 不存在"
    );

    return false;
  }


  const Engine =
    window.LiteRTModule.Engine;


  if (!Engine) {

    setTest(
      "testLiteRT",
      "failed",
      "找不到 Engine"
    );

    log(
      `LiteRT Module keys:\n${Object.keys(
        window.LiteRTModule
      ).join(", ")}`
    );

    return false;
  }


  setTest(
    "testLiteRT",
    "success",
    "LiteRT-LM Engine 成功載入"
  );

  log(
    "✓ LiteRT-LM Engine OK"
  );

  return true;
}


// ============================================================
// Test 5 — Model URL
// ============================================================

async function testModel() {

  setTest(
    "testModel",
    "running",
    "正在檢查 Gemma 模型..."
  );

  log(
    `Model URL:\n${MODEL_URL}`
  );


  try {

    const response =
      await fetch(
        MODEL_URL,
        {
          method: "HEAD"
        }
      );


    if (!response.ok) {

      setTest(
        "testModel",
        "failed",
        `模型 HTTP ${response.status}`
      );

      log(
        `❌ Model HTTP ${response.status}`
      );

      return false;
    }


    const size =
      response.headers.get(
        "content-length"
      );


    if (size) {

      const gb =
        (
          Number(size) /
          1024 /
          1024 /
          1024
        ).toFixed(2);

      log(
        `Model size ≈ ${gb} GB`
      );

    } else {

      log(
        "Model size：Server 沒有提供 Content-Length"
      );

    }


    setTest(
      "testModel",
      "success",
      "Gemma 模型 URL 可取得"
    );

    return true;

  } catch (error) {

    setTest(
      "testModel",
      "failed",
      "模型 URL 無法取得"
    );

    log(
      `❌ Model Fetch Error\n${errorMessage(error)}`
    );

    return false;
  }
}


// ============================================================
// Diagnostic
// ============================================================

async function runDiagnostics() {

  diagnosticButton.disabled = true;

  diagnosticPassed = 0;

  updateDiagnosticCount();

  setOverall(
    "診斷中",
    "running"
  );

  log(
    "========== 開始診斷 =========="
  );


  const browserOK =
    await testBrowser();


  if (!browserOK) {
    finishDiagnostics();
    return;
  }


  const webgpuOK =
    await testWebGPU();


  if (!webgpuOK) {

    setOverall(
      "WebGPU 不可用",
      "failed"
    );

    diagnosticFinished = true;

    diagnosticButton.disabled = false;

    return;
  }


  const adapterOK =
    await testAdapter();


  if (!adapterOK) {

    setOverall(
      "GPU 不可用",
      "failed"
    );

    diagnosticFinished = true;

    diagnosticButton.disabled = false;

    return;
  }


  const liteRTOK =
    await testLiteRT();


  if (!liteRTOK) {

    setOverall(
      "LiteRT-LM 載入失敗",
      "failed"
    );

    diagnosticFinished = true;

    diagnosticButton.disabled = false;

    return;
  }


  const modelOK =
    await testModel();


  diagnosticFinished = true;


  if (
    browserOK &&
    webgpuOK &&
    adapterOK &&
    liteRTOK &&
    modelOK
  ) {

    setOverall(
      "環境 OK",
      "success"
    );

    loadModelButton.disabled =
      false;

    log(
      "========== 診斷完成：OK =========="
    );

  } else {

    setOverall(
      "有項目失敗",
      "failed"
    );

    log(
      "========== 診斷完成：有錯誤 =========="
    );

  }


  diagnosticButton.disabled =
    false;
}


function finishDiagnostics() {

  diagnosticFinished =
    true;

  diagnosticButton.disabled =
    false;

}


// ============================================================
// Load Gemma
// ============================================================

async function loadModel() {

  if (!diagnosticFinished) {

    alert(
      "請先完成診斷"
    );

    return;
  }


  loadModelButton.disabled =
    true;

  setModelStatus(
    "正在初始化 Gemma，第一次可能需要較長時間...",
    "loading"
  );


  addMessage(
    "assistant",
    "正在載入 Gemma 4 E2B，請稍候..."
  );


  log(
    "========== 開始載入模型 =========="
  );


  try {

    const Engine =
      window.LiteRTModule.Engine;


    log(
      "呼叫 Engine.create()..."
    );


    engine =
      await Engine.create({
        model: MODEL_URL
      });


    log(
      "✓ Engine.create() 完成"
    );


    setModelStatus(
      "Engine 已建立，正在建立 Conversation...",
      "loading"
    );


    conversation =
      await engine.createConversation({
        preface: {
          messages: [
            {
              role: "system",
              content:
                "你是一個簡潔、友善的 AI 助手。請使用繁體中文回答。"
            }
          ]
        }
      });


    log(
      "✓ Conversation 建立完成"
    );


    setModelStatus(
      "Gemma 已載入，可以開始聊天。",
      "success"
    );


    userInput.disabled =
      false;

    sendButton.disabled =
      false;


    addMessage(
      "assistant",
      "Gemma 已準備完成。你可以開始提問。"
    );


    log(
      "========== 模型載入成功 =========="
    );


  } catch (error) {

    const message =
      errorMessage(error);


    setModelStatus(
      `模型載入失敗\n${message}`,
      "error"
    );


    addMessage(
      "assistant",
      `模型載入失敗：\n${message}`
    );


    log(
      `❌ Model Error\n${message}`
    );


    loadModelButton.disabled =
      false;
  }
}


// ============================================================
// Chat
// ============================================================

async function sendMessage() {

  const text =
    userInput.value.trim();


  if (!text) {
    return;
  }


  if (!conversation) {

    addMessage(
      "assistant",
      "模型尚未準備完成。"
    );

    return;
  }


  userInput.value =
    "";

  userInput.disabled =
    true;

  sendButton.disabled =
    true;


  addMessage(
    "user",
    text
  );


  const assistantContent =
    addMessage(
      "assistant",
      ""
    );


  try {

    log(
      `User:\n${text}`
    );


    const stream =
      conversation.sendMessageStreaming(
        text
      );


    for await (
      const chunk of stream
    ) {

      if (!chunk) {
        continue;
      }


      if (!chunk.content) {
        continue;
      }


      for (
        const item of chunk.content
      ) {

        if (
          item.type === "text"
        ) {

          assistantContent.textContent +=
            item.text;

          chat.scrollTop =
            chat.scrollHeight;
        }

      }

    }


    log(
      "✓ Gemma response 完成"
    );


  } catch (error) {

    const message =
      errorMessage(error);


    assistantContent.textContent =
      `❌ 生成失敗\n${message}`;


    log(
      `❌ Generation Error\n${message}`
    );

  } finally {

    userInput.disabled =
      false;

    sendButton.disabled =
      false;

    userInput.focus();

  }
}


// ============================================================
// Events
// ============================================================

diagnosticButton.addEventListener(
  "click",
  runDiagnostics
);


loadModelButton.addEventListener(
  "click",
  loadModel
);


sendButton.addEventListener(
  "click",
  sendMessage
);


userInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


// ============================================================
// Helpers
// ============================================================

function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}


// ============================================================
// Initial
// ============================================================

log(
  "頁面初始化完成"
);

log(
  `Model:\n${MODEL_URL}`
);

const MODEL_URL =
  "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.litertlm";


const statusElement =
  document.getElementById("status");

const chatElement =
  document.getElementById("chat");

const loadButton =
  document.getElementById("loadButton");

const sendButton =
  document.getElementById("sendButton");

const messageInput =
  document.getElementById("messageInput");

const chatForm =
  document.getElementById("chatForm");


let engine = null;

let conversation = null;

let generating = false;


/* --------------------------------
   Status
-------------------------------- */

function setStatus(text) {

  statusElement.textContent = text;

}


/* --------------------------------
   Add message
-------------------------------- */

function addMessage(role, text = "") {

  const message =
    document.createElement("div");

  message.className =
    `message ${role}`;


  const bubble =
    document.createElement("div");

  bubble.className =
    "bubble";

  bubble.textContent =
    text;


  message.appendChild(bubble);

  chatElement.appendChild(message);


  chatElement.scrollTop =
    chatElement.scrollHeight;


  return bubble;

}


/* --------------------------------
   Load model
-------------------------------- */

async function loadModel() {

  if (engine) {
    return;
  }


  loadButton.disabled = true;

  setStatus("檢查 WebGPU...");


  try {

    /*
      Check WebGPU
    */

    if (!navigator.gpu) {

      throw new Error(
        "目前瀏覽器不支援 WebGPU。"
      );

    }


    /*
      Check LiteRT-LM
    */

    if (!window.LiteRTEngine) {

      throw new Error(
        "LiteRT-LM JavaScript library 載入失敗。"
      );

    }


    setStatus(
      "正在下載 Gemma 模型..."
    );


    /*
      Create LiteRT engine
    */

    engine =
      await window.LiteRTEngine.create({
        model: MODEL_URL
      });


    /*
      Create conversation
    */

    conversation =
      await engine.createConversation();


    /*
      Remove welcome screen
    */

    const welcome =
      document.querySelector(".welcome");

    if (welcome) {
      welcome.remove();
    }


    /*
      Enable chat
    */

    messageInput.disabled = false;

    sendButton.disabled = false;


    messageInput.placeholder =
      "輸入訊息，例如：什麼是 WebGPU？";


    setStatus(
      "WebGPU · Ready"
    );


    messageInput.focus();

  }

  catch (error) {

    console.error(error);


    engine = null;

    conversation = null;


    setStatus(
      "載入失敗"
    );


    addMessage(
      "assistant",
      "Gemma 載入失敗。\n\n" +
      (error?.message || error)
    );


    loadButton.disabled = false;

  }

}


/* --------------------------------
   Send message
-------------------------------- */

async function sendMessage(text) {

  if (
    !conversation ||
    generating
  ) {

    return;

  }


  generating = true;


  /*
    User message
  */

  addMessage(
    "user",
    text
  );


  /*
    Assistant message
  */

  const assistantBubble =
    addMessage(
      "assistant",
      ""
    );


  messageInput.value = "";

  messageInput.disabled = true;

  sendButton.disabled = true;


  setStatus(
    "Gemma 生成中..."
  );


  try {

    /*
      Streaming response
    */

    for await (
      const chunk
      of conversation.sendMessageStreaming(text)
    ) {

      const textPart =
        chunk?.content?.[0]?.text || "";


      assistantBubble.textContent +=
        textPart;


      chatElement.scrollTop =
        chatElement.scrollHeight;

    }


    setStatus(
      "WebGPU · Ready"
    );

  }

  catch (error) {

    console.error(error);


    assistantBubble.textContent =
      "生成失敗。\n\n" +
      (error?.message || error);


    setStatus(
      "生成失敗"
    );

  }

  finally {

    generating = false;

    messageInput.disabled = false;

    sendButton.disabled = false;

    messageInput.focus();

  }

}


/* --------------------------------
   Load button
-------------------------------- */

loadButton.addEventListener(
  "click",
  loadModel
);


/* --------------------------------
   Chat form
-------------------------------- */

chatForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const text =
      messageInput.value.trim();


    if (!text) {
      return;
    }


    await sendMessage(text);

  }
);


/* --------------------------------
   Enter to send
-------------------------------- */

messageInput.addEventListener(
  "keydown",
  (event) => {

    /*
      Enter = send

      Shift + Enter = newline
    */

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      chatForm.requestSubmit();

    }

  }
);

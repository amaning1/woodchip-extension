const textUrl = `http://localhost:8080/public/api/text`;
const validateAccesKey = `http://localhost:8080/public/api/v1/key/verify`;
let comment = "";
let skipNextClick = false;
let isProcessing = false;

function listenForTextInput() {
  const specificTextArea = document.querySelector(
    'textarea[aria-labelledby="comment-composer-heading"], textarea[placeholder="Use Markdown to format your comment"]'
  );

  if (specificTextArea) {
    specificTextArea.removeEventListener("input", handleInputChange);
    specificTextArea.addEventListener("input", handleInputChange);
    comment = specificTextArea.value;
  }
}

function handleInputChange(event) {
  const input = event.target;
  comment = input.value;
}

async function checkTextWithPerspective(text) {
  try {
    const response = await fetch(textUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: { text },
      }),
    });

    const data = await response.json();
    console.log("Perspective API Response:", data);

    if (data?.toxicityScore !== undefined) {
      const toxicityScore = data.toxicityScore;
      return toxicityScore > 0.2; 
    }

    return false;
  } catch (error) {
    console.error("Error with Perspective API:", error);
    return false;
  }
}

function submitComment(target) {
  target.removeAttribute("disabled");
  target.click();
}

document.addEventListener(
  "click",
  async function handleClick(event) {
    if (skipNextClick) {
      skipNextClick = false;
      return;
    }
    const target = event.target;

  
    if (target.textContent.trim().toLowerCase() === "comment") {
      event.preventDefault();
      event.stopPropagation();

      target.disabled = true; 
  
      const accessKey = await checkAccessKey();
  
      if (accessKey) {
        const isToxic = await checkTextWithPerspective(comment);
        if (isToxic) {
          showPopup();
        } else {
          skipNextClick = true;
          target.click();
        }
      }  
  
       target.disabled = false;
    }
  },
  true
);

async function checkAccessKey(text) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["key"], (result) => {
      if (result.key) {
        resolve(true);
      } else {
       showAccessKey(resolve);
      }
    });
  });
}




function showAccessKey(resolve) {
  if (document.getElementById("accessKey")) return;

  const accessKey = document.createElement("div");
  accessKey.id = "accessKey";
  accessKey.innerHTML = `
    <div class="key-overlay"></div>
    <div class="key-content">
      <div class="key-header" >
       <img src="${chrome.runtime.getURL("images/logo.png")}" alt="Logo" height="40" width:"50">
        <hr class="logo-line">
      </div>
              <h3 style="color: white">Access Key Required</h3>

      <div class="key-form">
      <input type="text" id="emailInput" placeholder="Enter your email">
        <input type="text" id="accessKeyInput" placeholder="Enter your access key">

        <button id="submitKey" class="button">
        Submit
        </button>
      </div>
      <p class="key-info" style="color: white; padding: 10px">Please enter the access key provided by your administrator</p>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `


      h3{
        padding: 10px;
      }

        .key-header {
          padding: 10px;
        }
          .key-form {
        display: flex;
        flex-direction: column;
        gap: 15px; 
        margin: 10px;
      }

      #accessKeyInput, #emailInput {
        padding: 10px;
        font-size: 16px;
        border-radius: 5px;
        border: 1px solid #ccc;
      }

      .button {
        padding: 10px;
        font-size: 16px;
        border: none;
        border-radius: 5px;
        background-color: #1A7F37;
        color: white;
        cursor: pointer;
      }

      .button:hover {
        background-color: #0056b3;
      }

  
   .logo-line {
      border: 0;
      height: 1px;
      background: white;
      margin: 5px;
    }

    .key-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      color: white;
    }

  

  .key-content {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: black;
    padding: 20px;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    text-align: center;
    border-radius: 10px;
    text-align: left;
  }

    
  #closePopup {
    font-size: 20px;
    font-weight: bold;
    color: white;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
`;
  document.head.appendChild(style);
  document.body.appendChild(accessKey);

  function showProcessingState(button) {
    button.innerHTML = "Processing...";
  }
  
  function showErrorBar() {
    const errorBar = document.createElement("div");
    errorBar.id = "errorBar";
    errorBar.style.backgroundColor = "#ff4d4d";
    errorBar.style.color = "white";
    errorBar.style.textAlign = "center";
    errorBar.style.padding = "10px";
    errorBar.innerText = "Error: Invalid Access Key!";
    document.body.insertBefore(errorBar, document.body.firstChild); 
  }
  
  function hideErrorBar() {
    const errorBar = document.getElementById("errorBar");
    if (errorBar) {
      errorBar.remove();
    }
  }
  
const errorBarstyle = document.createElement("style");
errorBarstyle.textContent = `
  #errorBar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: #ff4d4d;
    color: white;
    text-align: center;
    padding: 10px;
    z-index: 10000;
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
  }
`;
document.head.appendChild(errorBarstyle);

function showErrorBar() {
  hideErrorBar();
  
  const errorBar = document.createElement("div");
  errorBar.id = "errorBar";
  errorBar.innerText = "Error: Invalid Access Key!";
  
  document.body.insertBefore(errorBar, document.body.firstChild);
  
  setTimeout(() => {
    hideErrorBar();
  }, 5000);
}

function hideErrorBar() {
  const existingErrorBar = document.getElementById("errorBar");
  if (existingErrorBar) {
    existingErrorBar.remove();
  }
}

document.getElementById("submitKey").addEventListener("click", async () => {
  isProcessing = true;
  const key = document.getElementById("accessKeyInput").value;
  const email = document.getElementById("emailInput").value;
  const submitButton = document.getElementById("submitKey");

  showProcessingState(submitButton);

  try {
    const isValid = await validateAccessKey(email, key);
    if (isValid) {
      isProcessing = true;
      chrome.storage.local.set({ key: key }, () => {
        console.log("Key set", key);
        accessKey.remove();
        resolve(true);
      });
    } else {
      isProcessing = false;
      showErrorBar(); 
    }
  } catch (error) {
    console.error("Error validating access key:", error);
    isProcessing = false;
    showErrorBar();
  } finally {
    submitButton.innerHTML = "Submit";
  }
});



  document.querySelector(".key-overlay").addEventListener("click", () => {
    accessKey.remove();
    style.remove();
    resolve(false);
  });
}

async function validateAccessKey(email, key){

  try {
    const response = await fetch(validateAccesKey, {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        secret: key
      }),
    });

    const data = await response.json();
    console.log("data", data)
    return data.verified;
  } catch(error){
    console.error("Error validating Access Key")
  }
}

function showPopup() {
  if (document.getElementById("githubCommentPopup")) return;

  const popup = document.createElement("div");
  popup.id = "githubCommentPopup";
  popup.innerHTML = `
    <div class="popup-overlay"></div>
    <div class="popup-content">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <img src="${chrome.runtime.getURL("images/logo.png")}" alt="Logo" height="50px" style="padding-bottom: 5px;">
        <button id="closePopup" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">&times;</button>
      </div>
      <hr class="logo-line">
      <div style="color: white; font-size: 16px; line-height: 1.65; padding-top: 10px;padding-bottom: 10px;">
        <span>Your comment suggests an offensive tone</span><br>
        <span>Kindly rephrase your comment as this is an Open Source Project</span>
      </div>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    .logo-line {
      border: 0;
      height: 0.5px;
      background: white;
      margin: 0px 0;
    }

    .popup-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
    }

    .popup-content {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: black;
      padding: 20px;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      text-align: center;
      border-radius: 10px;
      text-align: left;
    }

    #closePopup {
      font-size: 20px;
      font-weight: bold;
      color: white;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(popup);

  document.getElementById("closePopup").addEventListener("click", () => {
    popup.remove();
    style.remove();
  });

  document.querySelector(".popup-overlay").addEventListener("click", () => {
    popup.remove();
    style.remove();
  });
}

const observer = new MutationObserver(() => {
  listenForTextInput();
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.storage.local.clear();

listenForTextInput();


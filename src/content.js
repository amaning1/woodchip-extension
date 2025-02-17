const apiKey = "AIzaSyAKLIWDKpnW9PkQ-rJ-xv6sdZu-4aB0Y68";
const apiUrl = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`;
let comment = ""; 
let skipNextClick = false; 

function listenForTextInput() {
  // const inputs = document.querySelectorAll('input[type="text"], textarea');

  // inputs.forEach((input) => {
  //   input.removeEventListener("input", handleInputChange);
  //   input.addEventListener("input", handleInputChange);
  // });

  const specificTextArea = document.querySelector('textarea[aria-labelledby="comment-composer-heading"], textarea[placeholder="Use Markdown to format your comment"]');
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
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment: { text },
        languages: ["en"],
        requestedAttributes: {
          TOXICITY: {},
        },
      }),
    });

    const data = await response.json();
    console.log("Perspective API Response:", data);

    if (data && data.attributeScores && data.attributeScores.TOXICITY) {
      const toxicityScore = data.attributeScores.TOXICITY.summaryScore.value;
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



document.addEventListener("click", async function handleClick(event) {
  if (skipNextClick) {
    skipNextClick = false;
    return;  
  }

  const target = event.target;
  if (target.textContent.trim().toLowerCase() === "comment") {
    event.preventDefault();
    event.stopPropagation();
    
    const isToxic =  checkAccessKey(comment);

    if (isToxic) {
      showPopup();
      //chrome.runtime.sendMessage({ action: "showPopup" });
    } else {
      skipNextClick = true; 
      target.click();  
    }
  }
}, true);


// document.addEventListener("click", async (event) => {
//   const target = event.target;

//   if (target.textContent.trim().toLowerCase() === "comment") {
//     console.log("Comment button clicked");

//   event.preventDefault();
//   event.stopPropagation();

//    //showPopup();

//     // target.disabled = true;
//     // target.style.opacity = 0.5;
//     // target.style.cursor = "not-allowed";

//     const isToxic = await checkTextWithPerspective(comment);

//      if (isToxic) {
//       chrome.runtime.sendMessage({ action: "showPopup" })
//       console.log("Comment is NOT SAFE for submission");
//     } else {

//       submitComment();
        
//     }
  
//   }
// }, true);



const observer = new MutationObserver(() => {
  listenForTextInput();
});

observer.observe(document.body, { childList: true, subtree: true });

listenForTextInput();

function promptAccessKey(){
  const prompt = window.prompt("Input Access Key");

  chrome.storage.local.set({key:prompt}.then( () => {
    console.log("key set")
  }))
}
function checkAccessKey(text){

  chrome.storage.local.get(["key"]).then((result) => {

    if(result.key){
      checkTextWithPerspective(text)
    } else {
      promptAccessKey();
    }
  });

 

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
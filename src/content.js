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
  console.log("Updated comment:", comment);
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
      console.log("Toxicity Score:", toxicityScore);
      return toxicityScore > 0.55; 
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
    
    const isToxic = await checkTextWithPerspective(comment);

    if (isToxic) {
      showPopup();
      chrome.runtime.sendMessage({ action: "showPopup" });
      console.log("Comment is NOT SAFE for submission");
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

function showPopup() {
  if (document.getElementById("githubCommentPopup")) return;

  const popup = document.createElement("div");
  popup.id = "githubCommentPopup";
  popup.innerHTML = `
    <div class="popup-overlay"></div>
    <div class="popup-content">
      <img src="${chrome.runtime.getURL("images/logo.png")}" alt="Logo">
<h2 style="color: white;">It seems there's a problem with your comment</h2>
      <button id="closePopup">Close</button>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
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
    }
    .popup-content button {
      padding: 5px;
      background: rgb(0, 0, 0);
      color: white;
      border: none;
      cursor: pointer;
      border-radius: 10px;
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
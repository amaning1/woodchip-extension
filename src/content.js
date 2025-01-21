const badWords = ["damn", "hell", "stupid"];

function disableCommentButton() {
  const buttons = document.querySelectorAll('button, a');

  buttons.forEach(button => {
    if (button.textContent.trim().toLowerCase() === "comment") {
      button.disabled = true;
      button.style.opacity = 0.5;
      button.style.cursor = 'not-allowed';
    }
  });
}



function enableCommentButton() {
  const buttons = document.querySelectorAll('button, a');

  buttons.forEach(button => {
    if (button.textContent.trim().toLowerCase() === "comment") {
      button.disabled = false;
      button.style.opacity = 1;
      button.style.cursor = 'pointer';
    }
  });
}

function containsBadWords(text) {
  return badWords.some(word => text.toLowerCase().includes(word));
}

function listenForProfanity() {
  const inputs = document.querySelectorAll('input[type="text"], textarea');

  inputs.forEach(input => {
    input.addEventListener('input', function() {
      console.log('about to listen')
      if (filter.isProfane(input.value)) {
        console.log('is this even working?')
        disableCommentButton();
      } else {
        enableCommentButton();
      }
    });
  });
}

listenForProfanity();

const observer = new MutationObserver(() => {
  listenForProfanity();
});

observer.observe(document.body, { childList: true, subtree: true });
document.getElementById("closePopup").addEventListener("click", () => {
    window.parent.document.body.removeChild(window.frameElement.parentNode);
  });

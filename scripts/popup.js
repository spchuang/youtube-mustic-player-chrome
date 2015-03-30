/*chrome.extension.getBackgroundPage()
   .test();
console.log(chrome.extension.getBackgroundPage());*/


chrome.extension.getBackgroundPage()
   .compilePopup(document.getElementById('popup-content'));

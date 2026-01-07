document.addEventListener('DOMContentLoaded', () => {
    // Get params from current url
    const inIframe = window.self !== window.top

    // If the current page is an iframe, load event handlers
    if (inIframe) {
        // Detect any user navigation and close the iframe
        window.onbeforeunload = function (e) {
            // broadcast to parent window to close the modal
            window.parent.postMessage({ action: 'closeModal' }, '*')
        }
    }
})

/**
 * Inserts a modal HTML structure into the body of the document.
 * The modal includes a background, a header, a body section, and a footer with buttons.
 * It is designed to be used as a reusable modal component.
 *
 * Note: Ensure that the `closeModal` function is defined in your codebase to handle modal closing.
 */
function insertModal() {
    const html = `
        <div class="modal" id="iframe-modal">
            <div class="modal-background" onclick="closeModal()"></div>
                <div class="modal-card">
                    <header class="modal-card-head">
                        <p class="modal-card-title">Modal title</p>
                        <button class="delete" aria-label="close" onclick="closeModal()"></button>
                    </header>
                    <section class="modal-card-body p-0 h-100">
                        <!-- Content ... -->
                    </section>
                    <footer class="modal-card-foot">
                        <div class="buttons"></div>
                    </footer>
                </div>
            </div>
        </div>`

    // Insert modal into the body
    document.body.insertAdjacentHTML('beforeend', html)
}

/**
 * Initializes click event listeners for buttons with the class `js-iframe-modal-button`.
 * When a button is clicked, it activates a modal by adding the `is-active` class
 * to the element with the ID `iframe-modal`.
 */
function initButtons() {
    const buttons = document.querySelectorAll('.js-iframe-modal-button')
    buttons.forEach((button) => {
        button.addEventListener('click', function () {
            // Initialize the iframe
            const iframe = document.createElement('iframe')
            iframe.src = this.dataset.src
            iframe.width = '100%'
            iframe.height = '500px'
            iframe.frameborder = '0'
            iframe.allowFullscreen = true

            // Insert the iframe into the modal body
            const modalBody = document.querySelector('.modal-card-body')
            modalBody.innerHTML = ''
            modalBody.appendChild(iframe)
            
            // Set the modal title
            const modalTitle = document.querySelector('.modal-card-title')
            modalTitle.textContent = this.dataset.title

            // Open the modal
            const modal = document.querySelector('#iframe-modal')
            modal.classList.add('is-active')

            // Read actions dataset from the button and create buttons in the footer
            const actions = JSON.parse(this.dataset.actions)
            const modalFooter = document.querySelector('.modal-card-foot .buttons')
            modalFooter.innerHTML = ''
            actions.forEach((action) => {
                const button = document.createElement('button')
                button.className = `button ${action.className}`
                button.textContent = action.label
                button.onclick = window[action.handler]
                modalFooter.appendChild(button)
            })
        })
    })
}

/**
 * Closes the modal by removing the 'is-active' class from the modal element.
 * The modal is identified by the '#iframe-modal' selector.
 */
function closeModal() {
    const modal = document.querySelector('#iframe-modal')
    modal.classList.remove('is-active')

    // Clear the modal content
    const modalBody = document.querySelector('.modal-card-body')
    modalBody.innerHTML = ''

    // Clear the modal footer
    const modalFooter = document.querySelector('.modal-card-foot .buttons')
    modalFooter.innerHTML = ''

    // Clear the modal title
    const modalTitle = document.querySelector('.modal-card-title')
    modalTitle.textContent = ''
}

function printAll() {
    // Print iframe content
    const iframe = document.querySelector('iframe')
    iframe.contentWindow.print()
}

document.addEventListener('DOMContentLoaded', function () {
    insertModal()
    initButtons()
})

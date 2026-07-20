window.percentaje = (partialValue, totalValue) => {
    return (100 * Number(partialValue)) / Number(totalValue)
}

document.addEventListener('DOMContentLoaded', () => {
    // Navbar burgers
    const burgers = document.querySelectorAll('.navbar-burger')

    if (burgers.length > 0) {
        burgers.forEach((burger) => {
            burger.addEventListener('click', () => {
                const targetId = burger.dataset.target
                const target = document.getElementById(targetId)

                burger.classList.toggle('is-active')
                if (target) {
                    target.classList.toggle('is-active')
                }
            })
        })
    }

    // Dropdowns — click toggle (works on touch, no hover dependency)
    const dropdownTriggers = document.querySelectorAll('.dropdown-trigger .button, .dropdown .dropdown-trigger .button')

    if (dropdownTriggers.length > 0) {
        dropdownTriggers.forEach((button) => {
            const dropdown = button.closest('.dropdown')

            button.addEventListener('click', (e) => {
                e.stopPropagation()
                if (dropdown) {
                    dropdown.classList.toggle('is-active')
                }
            })
        })

        // Close any open dropdown when clicking/tapping outside
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.dropdown.is-active').forEach((open) => {
                if (!open.contains(e.target)) {
                    open.classList.remove('is-active')
                }
            })
        })
    }

    // Automatic print
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('print') === 'true') {
        window.print()
    }

    // Print button
    const printButton = document.getElementById('print-button')
    if (printButton) {
        printButton.addEventListener('click', () => {
            window.print()
        })
    }
    // Flash message close buttons
    const flashCloseButtons = document.querySelectorAll('.notification .delete')
    flashCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Prefer removing the outer container, fallback to the notification itself
            const container = button.closest('.container')
            const notification = button.closest('.notification')
            if (container) {
                container.remove()
            } else if (notification) {
                notification.remove()
            }
        })
    })
})

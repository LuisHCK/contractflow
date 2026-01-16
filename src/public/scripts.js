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

    // Dropdowns
    const dropdownButtons = document.querySelectorAll('.dropdown .button')

    if (dropdownButtons.length > 0) {
        dropdownButtons.forEach((button) => {
            const dropdown = button.closest('.dropdown')
            
            button.addEventListener('click', (e) => {
                // Prevent click from propagating if nested
                e.stopPropagation()
                
                if (dropdown) {
                    dropdown.classList.toggle('is-active')
                }
            })

            // Close when focus receives an outside element
            if (dropdown) {
                dropdown.addEventListener('focusout', (e) => {
                    const newFocus = e.relatedTarget
                    if (!dropdown.contains(newFocus)) {
                        dropdown.classList.remove('is-active')
                    }
                })
            }
        })
    }
})

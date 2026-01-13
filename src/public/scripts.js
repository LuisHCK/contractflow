window.percentaje = function (partialValue, totalValue) {
    return (100 * Number(partialValue)) / Number(totalValue)
}

;(function () {
    var burgers = Array.prototype.slice.call(
        document.querySelectorAll('.navbar-burger'),
        0
    )

    if (burgers.length > 0) {
        burgers.forEach(function (burger) {
            burger.addEventListener('click', function () {
                var targetId = burger.dataset.target
                var target = document.getElementById(targetId)

                burger.classList.toggle('is-active')
                if (target) {
                    target.classList.toggle('is-active')
                }
            })
        })
    }
})()

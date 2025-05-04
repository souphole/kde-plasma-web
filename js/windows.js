const windowContainer = document.getElementById('window-container')
const windowTemplate = document.getElementById('window-template')
const testFirefox = document.getElementById('firefox')

class Window {
    constructor(startWidth, startHeight, startX, startY, iconSrc, title) {
        this.windowNode = windowTemplate.content.cloneNode(true).children[0]
        this.inner = this.windowNode.getElementsByClassName('inner-window')[0]
        this.header = this.windowNode.getElementsByClassName('window-header')[0]
        this.icon = this.windowNode.getElementsByClassName('window-icon')[0]
        this.title = this.windowNode.getElementsByClassName('window-title')[0]
        this.actions = this.windowNode.getElementsByClassName('window-actions')[0]
        this.minimize = this.windowNode.getElementsByClassName('window-minimize')[0]
        this.changeSize = this.windowNode.getElementsByClassName('window-change-size')[0]
        this.close = this.windowNode.getElementsByClassName('window-close')[0]
        this.content = this.windowNode.getElementsByClassName('window-content')[0]
        this.icon.src = iconSrc
        this.title.innerText = title
        this.windowNode.style.width = startWidth + "px"
        this.windowNode.style.height = startHeight + "px"
        this.windowNode.style.left = startX + "px"
        this.windowNode.style.top = startY + "px"
        windowContainer.appendChild(this.windowNode)
        makeWindowDraggable(this)
        makeWindowResizable(this)
    }
    hide(originElement) {
        if (typeof originElement === 'undefined') {
            originElement = this.windowNode
        }
        const rect = originElement.getBoundingClientRect()
        const centerX = (rect.left + rect.right) / 2
        const centerY = (rect.top + rect.bottom) / 2
        this.hidePos(centerX, centerY)
    }
    hidePos(hidePosX, hidePosY) {  
        this.windowNode.classList.add("window-hidden")
        this.windowNode.style.left = (hidePosX - (this.windowNode.offsetWidth / 2)) + "px"
        this.windowNode.style.top = (hidePosY - (this.windowNode.offsetHeight / 2)) + "px"
    }
}

function makeWindowDraggable(targetWindow) {
    var velocityX = 0, velocityY = 0
    var lastPosX = 0, lastPosY = 0
    var windowDraggable = false

    targetWindow.header.addEventListener('mousedown', function(e) {
        lastPosX = e.clientX
        lastPosY = e.clientY
        windowDraggable = true
    })

    document.addEventListener('mousemove', function(e) {
        if (windowDraggable) {
            velocityX = lastPosX - e.clientX
            velocityY = lastPosY - e.clientY
            lastPosX = e.clientX
            lastPosY = e.clientY

            targetWindow.windowNode.style.left = (targetWindow.windowNode.offsetLeft - velocityX) + "px"
            targetWindow.windowNode.style.top = (targetWindow.windowNode.offsetTop - velocityY) + "px"
        }
    })

    document.addEventListener('mouseup', function(e) {
        windowDraggable = false
    })
}

function makeWindowResizable(targetWindow) {
    const windowStyle = window.getComputedStyle(targetWindow.windowNode)
    const valueRe = /\d+/
    const padT = parseInt(valueRe.exec(windowStyle.getPropertyValue('padding-top'))[0])
    const padR = parseInt(valueRe.exec(windowStyle.getPropertyValue('padding-right'))[0])
    const padB = parseInt(valueRe.exec(windowStyle.getPropertyValue('padding-bottom'))[0])
    const padL = parseInt(valueRe.exec(windowStyle.getPropertyValue('padding-left'))[0])

    var lastPosX = 0, lastPosY = 0
    var velocityX = 0, velocityY = 0
    var windowResizeX = 0, windowResizeY = 0 //vector for which direction to resize ((1, 0) for right, (-1, 0) for left, (-1, 1) for bottom-left, etc.)
    var windowResizable = false

    targetWindow.inner.addEventListener('mousedown', function(e) {
        e.stopPropagation() //makes sure to only resize when the outside of the window is clicked
    })

    targetWindow.windowNode.addEventListener('mousedown', function(e) {
        lastPosX = e.clientX
        lastPosY = e.clientY
        //set windowResizeX and Y
        if (e.offsetX < padL) {
            windowResizeX = -1
        }
        if (e.offsetX > (targetWindow.windowNode.offsetWidth - padR - 1)) {
            windowResizeX = 1
        }        
        if (e.offsetY < padT) {
            windowResizeY = -1
        }
        if (e.offsetY > (targetWindow.windowNode.offsetHeight - padB - 1)) {
            windowResizeY = 1
        }
        windowResizable = true
    })

    document.addEventListener('mousemove', function(e) {
        if (windowResizable) {
            velocityX = lastPosX - e.clientX
            velocityY = lastPosY - e.clientY
            lastPosX = e.clientX
            lastPosY = e.clientY
            targetWindow.windowNode.style.width = (targetWindow.windowNode.offsetWidth - padL - padR - (velocityX * windowResizeX)) + "px"
            targetWindow.windowNode.style.height = (targetWindow.windowNode.offsetHeight - padT - padB - (velocityY * windowResizeY)) + "px"
            if (windowResizeX === -1) {
                targetWindow.windowNode.style.left = (targetWindow.windowNode.offsetLeft - velocityX) + "px"
            }  
            if (windowResizeY === -1) {
                targetWindow.windowNode.style.top = (targetWindow.windowNode.offsetTop - velocityY) + "px"
            }            
        }
    })

    document.addEventListener('mouseup', function (e) {
        windowResizeX = 0, windowResizeY = 0
        windowResizable = false
    })
}

var newWindow = new Window(600, 400, 200, 100, 'icons/app/firefox.svg', 'Firefox')
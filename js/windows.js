import { updateCursor } from "./cursor.js"

const windowContainer = document.getElementById('window-container')
const windowTemplate = document.getElementById('window-template')
const testFirefox = document.getElementById('firefox')

let focusedWindow 
let activeWindow 

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
        this.showMemoryX = 0
        this.showMemoryY = 0
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
    hide(originElement = this.windowNode) {
        const rect = originElement.getBoundingClientRect()
        const centerX = (rect.left + rect.right) / 2
        const centerY = (rect.top + rect.bottom) / 2
        this.showMemoryX = this.windowNode.offsetLeft
        this.showMemoryY = this.windowNode.offsetTop
        this.hidePos(centerX, centerY)
    }
    hidePos(hidePosX, hidePosY) {
        const windowNode = this.windowNode
        windowNode.classList.add("window-transition")
        windowNode.classList.add("window-hidden")
        windowNode.style.left = (hidePosX - (this.windowNode.offsetWidth / 2)) + "px"
        windowNode.style.top = (hidePosY - (this.windowNode.offsetHeight / 2)) + "px"
        windowNode.addEventListener('transitionend', function() {
            windowNode.classList.remove('window-transition')
        })
    }
    show() {
        const windowNode = this.windowNode
        windowNode.classList.add("window-transition")
        windowNode.classList.remove("window-hidden")
        windowNode.style.left = this.showMemoryX + "px"
        windowNode.style.top = this.showMemoryY + "px"
        windowNode.addEventListener('transitionend', function() {
            windowNode.classList.remove('window-transition')
        })
    }
}

function resizeStyleString(resizeX, resizeY) {
    if (resizeX === 0 && resizeY === 0) return null

    let ewString = ''
    let nsString = ''
    
    if (resizeX === 1) {
        ewString = 'e'
    }
    if (resizeX === -1) {
        ewString = 'w'
    }
    if (resizeY === -1) {
        nsString = 'n'
    }
    if (resizeY === 1) {
        nsString = 's'
    }

    return nsString + ewString + '-resize'
}

function makeWindowDraggable(targetWindow) {
    let velocityX = 0,
        velocityY = 0
    let lastPosX = 0,
        lastPosY = 0
    let windowDraggable = false

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
    const crossoverResize = 15 //pixel value for where windows can be resized diagonally even if youre more on one edge than another

    let lastPosX = 0,
        lastPosY = 0
    let velocityX = 0,
        velocityY = 0
    let windowResizeX = 0,
        windowResizeY = 0 //vector for which direction to resize ((1, 0) for right, (-1, 0) for left, (-1, 1) for bottom-left, etc.)
    let windowResizable = true
    let windowResizing = false

    targetWindow.inner.addEventListener('mousedown', function(e) {
        e.stopPropagation() //makes sure to only resize when the outside of the window is clicked
    })

    targetWindow.inner.addEventListener('mousedown', function(e) {
        e.stopPropagation() //makes sure to only resize when the outside of the window is clicked
    })

    targetWindow.inner.addEventListener('mouseenter', function(e) {
        if (windowResizing) return
        windowResizable = false
        updateCursor(null)
    })

    targetWindow.inner.addEventListener('mouseleave', function(e) {
        windowResizable = true
    })

    
    targetWindow.windowNode.addEventListener('mouseleave', function(e) {
        if (windowResizing) return
        windowResizable = false
        updateCursor(null)
    })

    targetWindow.windowNode.addEventListener('mouseenter', function(e) {
        windowResizable = true
    })

    targetWindow.windowNode.addEventListener('mousedown', function(e) {
        lastPosX = e.clientX
        lastPosY = e.clientY
        //set windowResizeX and Y
        if (e.offsetX < padL + crossoverResize) {
            windowResizeX = -1
        }
        if (e.offsetX > (targetWindow.windowNode.offsetWidth - padR - crossoverResize - 1)) {
            windowResizeX = 1
        }
        if (e.offsetY < padT + crossoverResize) {
            windowResizeY = -1
        }
        if (e.offsetY > (targetWindow.windowNode.offsetHeight - padB - crossoverResize - 1)) {
            windowResizeY = 1
        }

        windowResizing = true
    })
    
    document.addEventListener('mousemove', function(e) {
        if (!windowResizable) return
        if (!windowResizing) {
            windowResizeX = 0
            windowResizeY = 0

            if (e.offsetX < padL + crossoverResize) {
                windowResizeX = -1
            }
            if (e.offsetX > (targetWindow.windowNode.offsetWidth - padR - crossoverResize - 1)) {
                windowResizeX = 1
            }
            if (e.offsetY < padT + crossoverResize) {
                windowResizeY = -1
            }
            if (e.offsetY > (targetWindow.windowNode.offsetHeight - padB - crossoverResize - 1)) {
                windowResizeY = 1
            }

            updateCursor(resizeStyleString(windowResizeX, windowResizeY))
        }
        else {
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

    document.addEventListener('mouseup', function(e) {
        windowResizeX = 0, windowResizeY = 0
        windowResizing = false
    })
}

let newWindow = new Window(600, 400, 200, 100, 'icons/app/firefox.svg', 'Firefox')
let newWindow2 = new Window(600, 400, 300, 200, 'icons/app/dolphin.svg', 'Dolphin')
import { getCurrentCursorOffest, updateCursor } from "./cursor.js"

const windowContainer = document.getElementById('window-container')
const windowTemplate = document.getElementById('window-template')

class WindowManager {
    constructor() {
        this.activeWindow = null
    }
    set focusedWindow(targetWindow) {
        if (targetWindow === null) return
        
        let windowsFrag = document.createDocumentFragment()
        
        for (const child of windowContainer.children) {
            if (child !== targetWindow.windowNode) {
                windowsFrag.appendChild(child)
                child.classList.remove('focused')
            }
        }

        windowsFrag.appendChild(targetWindow.windowNode)
        windowContainer.appendChild(windowsFrag)
        targetWindow.windowNode.classList.add('focused')
    }
    checkOtherActive(targetWindow) {
        return (this.activeWindow !== targetWindow && this.activeWindow !== null)
    }
}

class Window {
    constructor(wm, startWidth, startHeight, startX, startY, iconSrc, title) {
        this.wm = wm
        this.windowNode = windowTemplate.content.cloneNode(true).children[0]
        this.tooltip = this.windowNode.getElementsByClassName('window-tooltip')[0]
        this.inner = this.windowNode.getElementsByClassName('inner-window')[0]
        this.header = this.windowNode.getElementsByClassName('window-header')[0]
        this.icon = this.windowNode.getElementsByClassName('window-icon')[0]
        this.title = this.windowNode.getElementsByClassName('window-title')[0]
        this.actions = this.windowNode.getElementsByClassName('window-actions')
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
        
        this.windowNode.addEventListener('transitionend', function(e) {
            e.target.classList.remove('window-transition')
        })
        
        windowContainer.appendChild(this.windowNode)
        makeWindowFocusable(this)
        makeWindowDraggable(this)
        makeWindowResizable(this)
        makeWindowTooltips(this)

        this.wm.focusedWindow = this
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
    }
    show() {
        const windowNode = this.windowNode
        windowNode.classList.add("window-transition")
        windowNode.classList.remove("window-hidden")
        windowNode.style.left = this.showMemoryX + "px"
        windowNode.style.top = this.showMemoryY + "px"
    }
}

function resizeStyleString(resizeX, resizeY) {
    if (resizeX === 0 && resizeY === 0) return null

    let horiString = ''
    let vertString = ''
    
    if (resizeX === 1) {
        horiString = 'e'
    }
    if (resizeX === -1) {
        horiString = 'w'
    }
    if (resizeY === -1) {
        vertString = 'n'
    }
    if (resizeY === 1) {
        vertString = 's'
    }

    return vertString + horiString + '-resize'
}
function makeWindowFocusable(targetWindow) {
    targetWindow.windowNode.addEventListener('mousedown', function(e) {
        targetWindow.wm.focusedWindow = targetWindow
    })
}

function makeWindowDraggable(targetWindow) {
    let velocityX = 0,
        velocityY = 0
    let lastPosX = 0,
        lastPosY = 0
    let windowDraggable = false
    targetWindow.tooltip.addEventListener('mousemove', function(e) {}, {capture: true})
    targetWindow.header.addEventListener('mousedown', function(e) {
        lastPosX = e.clientX
        lastPosY = e.clientY
        windowDraggable = true
    })

    document.addEventListener('mouseup', function(e) {
        windowDraggable = false
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
        windowResizable = false
    })

    document.addEventListener('mouseup', function(e) {
        windowResizeX = 0, windowResizeY = 0
        windowResizing = false
        targetWindow.wm.activeWindow = null
    })

    targetWindow.inner.addEventListener('mouseenter', function(e) {
        if (windowResizing || targetWindow.wm.checkOtherActive(targetWindow)) return
        windowResizable = false
        updateCursor(null)
    })

    targetWindow.inner.addEventListener('mouseleave', function(e) {
        windowResizable = true
    })
    
    targetWindow.windowNode.addEventListener('mouseleave', function(e) {
        if (windowResizing || targetWindow.wm.checkOtherActive(targetWindow)) return

        windowResizable = false
        updateCursor(null)
    })

    targetWindow.windowNode.addEventListener('mouseenter', function(e) {
        windowResizable = true
    })

    targetWindow.windowNode.addEventListener('mousedown', function(e) {
        if (!windowResizable || targetWindow.wm.checkOtherActive(targetWindow)) return

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
        targetWindow.wm.activeWindow = targetWindow

        windowResizing = true
    })
    
    document.addEventListener('mousemove', function(e) {
        if (!windowResizable || targetWindow.wm.checkOtherActive(targetWindow)) return

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
}

function makeWindowTooltips(targetWindow) {
    let enterTimeoutID = null
    let exitTimeoutID = null
    let currentX = 0
    let currentY = 0

    function moveToCursor(target) {
        targetWindow.tooltip.innerText = target.getAttribute('window-tooltip')
        targetWindow.tooltip.style.opacity = 1

        targetWindow.tooltip.style.left = (currentX - targetWindow.windowNode.offsetLeft + 2) + 'px'
        targetWindow.tooltip.style.top = (currentY - targetWindow.windowNode.offsetTop + 10) + 'px'
    }

    targetWindow.header.addEventListener('mouseout', function(e){
        if (e.target.getAttribute('window-tooltip') === null) return

        exitTimeoutID = setTimeout(() => {
            targetWindow.tooltip.style.opacity = 0
            exitTimeoutID = null
        }, 250)
        clearTimeout(enterTimeoutID)
    })
    
    targetWindow.header.addEventListener('mouseover', function(e){
        if (e.target.getAttribute('window-tooltip') === null) return
        
        if (exitTimeoutID !== null) {
            clearTimeout(exitTimeoutID)
            exitTimeoutID = null
            moveToCursor(e.target)
        }
        else {
            enterTimeoutID = setTimeout(moveToCursor, 1000, e.target)
        }
        
    })

    targetWindow.header.addEventListener('mousemove', function(e) {
        currentX = e.clientX
        currentY = e.clientY
    })
}

const mainWindowManager = new WindowManager()
let newWindow = new Window(mainWindowManager, 600, 400, 200, 100, 'icons/app/firefox.svg', 'Firefox')
let newWindow2 = new Window(mainWindowManager, 600, 400, 300, 200, 'icons/app/dolphin.svg', 'Dolphin')

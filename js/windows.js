import { updateCursor, getCurrentCursorOffest, getResizeStyleString } from "./cursor.js"

const windowContainer = document.getElementById("window-container")
const windowTemplate = document.getElementById("window-template")

export const WindowStatuses = Object.freeze({
    FOCUSED: Symbol("focused"),
    VISIBLE: Symbol("visible"),
    MINIMIZED: Symbol("minimized"),
    CLOSING: Symbol("closing"),
})

export class WindowManager {
    windows = []
    constructor() {
        this.activeWindow = null
        this.taskbar = document.getElementById("taskbar")
        this.taskbarStaticTop = this.taskbar.offsetTop
        //I couldn't find a good way to make it update on resize so this will just break if the window is resized at all
        document.addEventListener("mousemove", this.checkTaskbarChange.bind(this))
        document.addEventListener("click", this.checkTaskbarChange.bind(this))
    }
    set focusedWindow(targetWindow) {
        if (targetWindow === null) return
        
        let windowsFrag = document.createDocumentFragment()
        for (const managedWindow of this.windows) {
            if (managedWindow.windowStatus === WindowStatuses.CLOSING) continue
            
            if (managedWindow !== targetWindow) {
                windowsFrag.appendChild(managedWindow.windowNode)
                managedWindow.windowNode.classList.remove("focused")
                if (managedWindow.windowStatus === WindowStatuses.FOCUSED) {
                    managedWindow.windowStatus = WindowStatuses.VISIBLE
                }
            }
        }
        targetWindow.windowStatus = WindowStatuses.FOCUSED
        windowsFrag.appendChild(targetWindow.windowNode)
        windowContainer.appendChild(windowsFrag)
        targetWindow.windowNode.classList.add("focused")
    }
    checkOtherActive(targetWindow) {
        return (this.activeWindow !== targetWindow && this.activeWindow !== null)
    }
    checkTaskbarChange(e) {
        for (const managedWindow of this.windows) {
            if (managedWindow.windowStatus === WindowStatuses.MINIMIZED) continue
            
            if (managedWindow.windowNode.offsetTop + managedWindow.windowNode.offsetHeight > this.taskbarStaticTop) {
                const windowHeader = managedWindow.windowNode.getElementsByClassName("window-header")[0]
                if (managedWindow.windowNode.offsetTop > this.taskbarStaticTop - windowHeader.offsetHeight) {
                    managedWindow.windowNode.style.top = this.taskbarStaticTop - windowHeader.offsetHeight + "px"
                }
                this.taskbar.classList.add("taskbar-unintrusive")
                return
            }
        }
        this.taskbar.classList.remove("taskbar-unintrusive")
    }
}

export class Window {
    #windowStatus = WindowStatuses.FOCUSED
    constructor(wm, parentApp, content, iconSrc, title, startWidth, startHeight, startX, startY) {
        this.wm = wm
        this.wm.windows.push(this)
        this.parentApp = parentApp
        this.windowNode = windowTemplate.content.cloneNode(true).children[0]
        this.tooltip = this.windowNode.getElementsByClassName("window-tooltip")[0]
        this.inner = this.windowNode.getElementsByClassName("inner-window")[0]
        this.header = this.windowNode.getElementsByClassName("window-header")[0]
        this.icon = this.windowNode.getElementsByClassName("window-icon")[0]
        this.title = this.windowNode.getElementsByClassName("window-title")[0]
        this.actions = this.windowNode.getElementsByClassName("window-actions")
        this.minimize = this.windowNode.getElementsByClassName("window-minimize")[0]
        this.changeSize = this.windowNode.getElementsByClassName("window-change-size")[0]
        this.maximized = false
        this.close = this.windowNode.getElementsByClassName("window-close")[0]
        this.content = this.windowNode.getElementsByClassName("window-content")[0]
        this.showMemoryX = 0
        this.showMemoryY = 0
        this.icon.src = iconSrc
        this.title.innerText = title
        this.windowNode.style.width = startWidth + "px"
        this.windowNode.style.height = startHeight + "px"
        this.windowNode.style.left = startX + "px"
        this.windowNode.style.top = startY + "px"
        
        this.windowNode.addEventListener("transitionend", this.transitionEnd.bind(this))
        
        windowContainer.appendChild(this.windowNode)
        this.#makeWindowFocusable(this)
        this.#makeWindowDraggable(this)
        this.#makeWindowResizable(this)
        this.#makeWindowTooltips(this)
        this.#makeWindowActions(this)
        this.wm.focusedWindow = this
        
        let windowContent = content.content.cloneNode(true)
        this.content.appendChild(windowContent)
    }
    transitionEnd(e) {
        e.target.classList.remove("window-transition")
        if (this.windowStatus === WindowStatuses.CLOSING) {
            windowContainer.removeChild(this.windowNode)
        }
    }
    set windowStatus(status) {
        this.#windowStatus = status
        this.parentApp.updateStatus(status)
    }
    get windowStatus() {
        return this.#windowStatus
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
        this.windowStatus = WindowStatuses.MINIMIZED
    }
    show() {
        const windowNode = this.windowNode
        windowNode.classList.remove("window-hidden")
        windowNode.style.left = this.showMemoryX + "px"
        windowNode.style.top = this.showMemoryY + "px"
        this.wm.focusedWindow = this
    }
    closeWindow() {
        this.hide()
        this.windowStatus = WindowStatuses.CLOSING
    }
    #makeWindowFocusable(targetWindow) {
        targetWindow.windowNode.addEventListener("mousedown", function(e) {
            targetWindow.wm.focusedWindow = targetWindow
        })
    }

    #makeWindowDraggable(targetWindow) {
        let velocityX = 0,
            velocityY = 0
        let lastPosX = 0,
            lastPosY = 0
        let windowDraggable = false
        targetWindow.tooltip.addEventListener("mousemove", function(e) {}, {capture: true})
        targetWindow.header.addEventListener("mousedown", function(e) {
            lastPosX = e.clientX
            lastPosY = e.clientY
            windowDraggable = true
        })

        document.addEventListener("mouseup", function(e) {
            windowDraggable = false
            updateCursor(null)
        })

        document.addEventListener("mousemove", function(e) {
            if (windowDraggable && e.clientX > 0 && e.clientY > 0 && e.clientX < window.screen.width && e.clientY < targetWindow.wm.taskbarStaticTop && !targetWindow.maximized) {
                velocityX = lastPosX - e.clientX
                velocityY = lastPosY - e.clientY
                lastPosX = e.clientX
                lastPosY = e.clientY

                targetWindow.windowNode.style.left = (targetWindow.windowNode.offsetLeft - velocityX) + "px"
                targetWindow.windowNode.style.top = (targetWindow.windowNode.offsetTop - velocityY) + "px"
            }
        })
    }

    #makeWindowResizable(targetWindow) {
        const windowStyle = window.getComputedStyle(targetWindow.windowNode)
        const valueRe = /\d+/
        const padT = parseInt(valueRe.exec(windowStyle.getPropertyValue("padding-top"))[0])
        const padR = parseInt(valueRe.exec(windowStyle.getPropertyValue("padding-right"))[0])
        const padB = parseInt(valueRe.exec(windowStyle.getPropertyValue("padding-bottom"))[0])
        const padL = parseInt(valueRe.exec(windowStyle.getPropertyValue("padding-left"))[0])
        const minWidth = parseInt(windowStyle.minWidth)
        const minHeight = parseInt(windowStyle.minHeight)
        const crossoverResize = 15 //pixel value for where windows can be resized diagonally even if youre more on one edge than another

        let lastPosX = 0,
            lastPosY = 0
        let velocityX = 0,
            velocityY = 0
        let windowResizeX = 0,
            windowResizeY = 0 //vector for which direction to resize ((1, 0) for right, (-1, 0) for left, (-1, 1) for bottom-left, etc.)
        let windowResizable = true
        let windowResizing = false

        targetWindow.inner.addEventListener("mousedown", function(e) {
            windowResizable = false
        })

        document.addEventListener("mouseup", function(e) {
            windowResizeX = 0, windowResizeY = 0
            windowResizing = false
            targetWindow.wm.activeWindow = null
        })

        targetWindow.inner.addEventListener("mouseenter", function(e) {
            if (windowResizing || targetWindow.wm.checkOtherActive(targetWindow)) return
            windowResizable = false
            updateCursor(null)
        })

        targetWindow.inner.addEventListener("mouseleave", function(e) {
            windowResizable = true
        })
        
        targetWindow.windowNode.addEventListener("mouseleave", function(e) {
            if (windowResizing || targetWindow.wm.checkOtherActive(targetWindow)) return

            windowResizable = false
            updateCursor(null)
        })

        targetWindow.windowNode.addEventListener("mouseenter", function(e) {
            windowResizable = true
        })

        targetWindow.windowNode.addEventListener("mousedown", function(e) {
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
        
        document.addEventListener("mousemove", function(e) {
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

                updateCursor(getResizeStyleString(windowResizeX, windowResizeY))
            }
            else if (e.clientX >= 0 && e.clientX < window.screen.width && e.clientY >= 0 && e.clientY < window.screen.height && !targetWindow.maximized){
                velocityX = lastPosX - e.clientX
                velocityY = lastPosY - e.clientY
                lastPosX = e.clientX
                lastPosY = e.clientY
                let newWidth = targetWindow.windowNode.offsetWidth - padL - padR - (velocityX * windowResizeX)
                let newHeight = targetWindow.windowNode.offsetHeight - padT - padB - (velocityY * windowResizeY)
                let barrierX = (targetWindow.windowNode.offsetLeft + (windowResizeX === 1 ? minWidth + padR : targetWindow.windowNode.offsetWidth - minWidth - padL))
                let barrierY = (targetWindow.windowNode.offsetTop + (windowResizeY === 1 ? minHeight + padB : targetWindow.windowNode.offsetHeight - minHeight - padT))
                if (newWidth > minWidth && e.clientX * windowResizeX > barrierX * windowResizeX) {
                    targetWindow.windowNode.style.width = newWidth + "px"
                    if (windowResizeX === -1) {
                        targetWindow.windowNode.style.left = (targetWindow.windowNode.offsetLeft - velocityX) + "px"
                    }
                }
                //This is also broken but i dont care to fix it
                else if (windowResizeX === 1) {
                    targetWindow.windowNode.style.width = minWidth + "px"
                }
                if (newHeight > minHeight && e.clientY * windowResizeY > barrierY * windowResizeY) {
                    targetWindow.windowNode.style.height = newHeight + "px"
                    if (windowResizeY === -1) {
                        targetWindow.windowNode.style.top = (targetWindow.windowNode.offsetTop - velocityY) + "px"
                    }
                }
                else if (windowResizeY === 1) {
                    targetWindow.windowNode.style.height = minHeight + "px"
                }
            }
        })
    }

    #makeWindowTooltips(targetWindow) {
        let enterTimeoutID = null
        let exitTimeoutID = null
        let currentX = 0
        let currentY = 0

        function moveToCursor(target) {
            targetWindow.tooltip.innerText = target.getAttribute("window-tooltip")
            targetWindow.tooltip.style.opacity = 1

            targetWindow.tooltip.style.left = (currentX - targetWindow.windowNode.offsetLeft + 2) + "px"
            targetWindow.tooltip.style.top = (currentY - targetWindow.windowNode.offsetTop + 10) + "px"
        }
        
        targetWindow.header.addEventListener("mouseout", function(e){
            if (e.target.getAttribute("window-tooltip") === null) return

            exitTimeoutID = setTimeout(() => {
                targetWindow.tooltip.style.opacity = 0
                exitTimeoutID = null
            }, 250)
            clearTimeout(enterTimeoutID)
        })
        
        targetWindow.header.addEventListener("mouseover", function(e){
            if (e.target.getAttribute("window-tooltip") === null) return
            
            if (exitTimeoutID !== null) {
                clearTimeout(exitTimeoutID)
                exitTimeoutID = null
                moveToCursor(e.target)
            }
            else {
                enterTimeoutID = setTimeout(moveToCursor, 1000, e.target)
            }
            
        })

        targetWindow.header.addEventListener("mousemove", function(e) {
            currentX = e.clientX
            currentY = e.clientY
        })
    }

    #makeWindowActions(targetWindow) {
        const windowStyle = window.getComputedStyle(targetWindow.windowNode)
        const valueRe = /\d+/
        const padT = parseInt(valueRe.exec(windowStyle.getPropertyValue("padding-top"))[0])
        const padR = parseInt(valueRe.exec(windowStyle.getPropertyValue("padding-right"))[0])
        const padB = parseInt(valueRe.exec(windowStyle.getPropertyValue("padding-bottom"))[0])
        const padL = parseInt(valueRe.exec(windowStyle.getPropertyValue("padding-left"))[0])
        let normalX = 0
        let normalY = 0
        let normalHeight = 0
        let normalWidth = 0

        targetWindow.minimize.addEventListener("click", targetWindow.hide.bind(targetWindow, targetWindow.parentApp.element))
        targetWindow.changeSize.addEventListener("click", function(e) {
            targetWindow.maximized = !targetWindow.maximized
            if (targetWindow.maximized) {
                normalX = targetWindow.windowNode.offsetLeft
                normalY = targetWindow.windowNode.offsetTop
                normalHeight = targetWindow.windowNode.offsetHeight
                normalWidth = targetWindow.windowNode.offsetWidth
                targetWindow.windowNode.style.left = 0 - padL + "px"
                targetWindow.windowNode.style.top = 0 - padT + "px"
                targetWindow.windowNode.style.width = window.screen.width + "px"
                targetWindow.windowNode.style.height = window.screen.height - targetWindow.wm.taskbar.offsetHeight + "px"
            }
            else {
                targetWindow.windowNode.style.left = normalX + "px"
                targetWindow.windowNode.style.top = normalY + "px"
                targetWindow.windowNode.style.width = normalWidth + "px"
                targetWindow.windowNode.style.height = normalHeight + "px"
            }
        })
        targetWindow.close.addEventListener("click", targetWindow.closeWindow.bind(targetWindow))
    }
}

// const windowManager = new WindowManager()
// const newWindow = new Window(windowManager, null, 'window-mousepad-content', 'icons/app/mousepad.png', 'Mousepad', 500, 200, 300, 300)
// const newWindow2 = new Window(windowManager, null, 'window-mousepad-content', 'icons/app/mousepad.png', 'Mousepad', 500, 200, 300, 300)

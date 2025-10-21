import { WindowManager, Window, WindowStatuses } from "./windows.js"

class App {
    constructor(wm, element, template, title) {
	this.wm = wm
	this.element = element
	this.template = template
	this.title = title
	this.window = null
	this.element.addEventListener("click", this.changeWindow.bind(this))
    }
    changeWindow(e) {
	if (this.window === null) {
	    const startWidth = 500
	    const startHeight = 300
	    this.window = new Window(this.wm, this, this.template, this.element.children[0].src, this.title, startWidth, startHeight, Math.floor((window.screen.width / 2) - (startWidth / 2)), Math.floor((window.screen.height / 2) - (startHeight / 2)))
	}
	else if (this.window.windowStatus === WindowStatuses.FOCUSED) {
	    this.window.hide(this.element)
	}
        else if (this.window.windowStatus === WindowStatuses.VISIBLE) {
            this.wm.focusedWindow = this.window
        }
	else if (this.window.windowStatus === WindowStatuses.MINIMIZED) {
	    this.window.show()
	}
    }
    updateStatus(windowStatus) {
	this.element.classList.remove("app_has_window")
	this.element.classList.remove("app_focused")
	this.element.classList.remove("app_minimized")
	switch (windowStatus) {
	case WindowStatuses.VISIBLE:
	    this.element.classList.add("app_has_window")
	    break
	case WindowStatuses.FOCUSED:
	    this.element.classList.add("app_focused")
	    break
	case WindowStatuses.MINIMIZED:
	    this.element.classList.add("app_minimized")
	    break
	case WindowStatuses.CLOSING:
	    this.window = null
	}
    }
}

const firefox = document.getElementById("firefox")
const mousepad = document.getElementById("mousepad")
const firefoxContent = document.getElementById("window-browser-content")
const mousepadContent = document.getElementById("window-mousepad-content")
const mainWindowManager = new WindowManager()
const firefoxApp = new App(mainWindowManager, firefox, firefoxContent, "Firefox")
const mousepadApp = new App(mainWindowManager, mousepad, mousepadContent, "Mousepad")

const assetMap = new Map()

class CursorImage {
    constructor(url, hotspotX, hotspotY) {
        this.url = url
        this.x = hotspotX
        this.y = hotspotY
    }
}

const defaultCursor = new CursorImage('icons/cursor/default.svg', 4, 4)
const sizeVer = new CursorImage('icons/cursor/size_ver.svg', 16.5, 15.5)
const sizeHor = new CursorImage('icons/cursor/size_hor.svg', 16.5, 15.5)
const sizeFdiag = new CursorImage('icons/cursor/size_fdiag.svg', 16.5, 15.5)
const sizeBiag = new CursorImage('icons/cursor/size_bdiag.svg', 16.5, 15.5)
const dndMove = new CursorImage('icons/cursor/dnd_move.svg', 16, 16)

assetMap.set('default', defaultCursor)
assetMap.set('n-resize', sizeVer)
assetMap.set('s-resize', sizeVer)
assetMap.set('e-resize', sizeHor)
assetMap.set('w-resize', sizeHor)
assetMap.set('ne-resize', sizeBiag)
assetMap.set('nw-resize', sizeFdiag)
assetMap.set('se-resize', sizeFdiag)
assetMap.set('sw-resize', sizeBiag)
assetMap.set('move', dndMove)

let cur

export function updateCursor(style) {
    if (style === null) {
        style = 'default'
    }

    cur = assetMap.get(style)

    document.body.style.cursor = `url(${cur.url}) ${cur.x} ${cur.y}, ${style}`
}

export function getCurrentCursorOffest() {
    return {offsetX: cur.x, offsetY: cur.y}
}

export function getResizeStyleString(resizeX, resizeY) {
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

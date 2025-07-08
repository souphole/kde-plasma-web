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

assetMap.set('default', defaultCursor)
assetMap.set('n-resize', sizeVer)
assetMap.set('s-resize', sizeVer)
assetMap.set('e-resize', sizeHor)
assetMap.set('w-resize', sizeHor)
assetMap.set('ne-resize', sizeBiag)
assetMap.set('nw-resize', sizeFdiag)
assetMap.set('se-resize', sizeFdiag)
assetMap.set('sw-resize', sizeBiag)

export function updateCursor(style) {
    console.log(style)
    if (style === null) {
        style = 'default'
    }

    let cur = assetMap.get(style)

    document.body.style.setProperty('cursor', `url(${cur.url}) ${cur.x} ${cur.y}, ${style}`)
}
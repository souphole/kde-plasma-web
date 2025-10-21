const timeElement = document.getElementById('time')
const dateElement = document.getElementById('date')

function setDate() {
    let now = new Date()
    let hours = now.getHours() % 12 === 0 ? 12 : now.getHours() % 12
    let suffix = now.getHours() < 12 ? "AM" : "PM"
    timeElement.innerText = `${hours}:${now.getMinutes().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})} ${suffix}`
    dateElement.innerText = `${now.getMonth() + 1}/${now.getDate()}/${String(now.getFullYear()).slice(-2)}`
}
setDate()

let timeNow = new Date()
let initialDelay = 6000 - timeNow % 6000

setTimeout(function() { setInterval(setDate, 6000) }, initialDelay)

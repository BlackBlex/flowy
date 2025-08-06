document.addEventListener('DOMContentLoaded', function () {
  let rightcard = false
  let tempblock
  let tempblock2
  let history = []
  let historyStep = -1
  function saveHistory () {
    let data = flowy.output()

    if (!data) {
      data = { html: document.getElementById('canvas').innerHTML, blockarr: [], blocks: [] }
    }

    history = history.slice(0, historyStep + 1)
    history.push(JSON.stringify(data))
    historyStep = history.length - 1
  }

  function undo () {
    if (historyStep > 0) {
      historyStep -= 1
      flowy.import(JSON.parse(history[historyStep]))
    }
  }

  function redo () {
    if (historyStep < history.length - 1) {
      historyStep += 1
      flowy.import(JSON.parse(history[historyStep]))
    }
  }
  document.getElementById('blocklist').innerHTML = '<div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="1"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/eye.svg"></div><div class="blocktext">                        <p class="blocktitle">New visitor</p><p class="blockdesc">Triggers when somebody visits a specified page</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="2"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/action.svg"></div><div class="blocktext">                        <p class="blocktitle">Action is performed</p><p class="blockdesc">Triggers when somebody performs a specified action</p></div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="3"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/time.svg"></div><div class="blocktext">                        <p class="blocktitle">Time has passed</p><p class="blockdesc">Triggers after a specified amount of time</p>          </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="4"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/error.svg"></div><div class="blocktext">                        <p class="blocktitle">Error prompt</p><p class="blockdesc">Triggers when a specified error happens</p>              </div></div></div>'
  flowy(document.getElementById('canvas'), drag, release, snapping)

  setTimeout(function () {
    saveHistory()
  }, 100)

  function addEventListenerMulti (type, listener, capture, selector) {
    const nodes = document.querySelectorAll(selector)
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].addEventListener(type, listener, capture)
    }
  }

  function snapping (drag, first) {
    const grab = drag.querySelector('.grabme')
    grab.parentNode.removeChild(grab)
    const blockin = drag.querySelector('.blockin')
    blockin.parentNode.removeChild(blockin)
    if (drag.querySelector('.blockelemtype').value == '1') {
      drag.innerHTML += "<div class='blockyleft'><img src='assets/eyeblue.svg'><p class='blockyname'>New visitor</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>When a <span>new visitor</span> goes to <span>Site 1</span></div>"
    } else if (drag.querySelector('.blockelemtype').value == '2') {
      drag.innerHTML += "<div class='blockyleft'><img src='assets/actionblue.svg'><p class='blockyname'>Action is performed</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>When <span>Action 1</span> is performed</div>"
    } else if (drag.querySelector('.blockelemtype').value == '3') {
      drag.innerHTML += "<div class='blockyleft'><img src='assets/timeblue.svg'><p class='blockyname'>Time has passed</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>When <span>10 seconds</span> have passed</div>"
    } else if (drag.querySelector('.blockelemtype').value == '4') {
      drag.innerHTML += "<div class='blockyleft'><img src='assets/errorblue.svg'><p class='blockyname'>Error prompt</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>When <span>Error 1</span> is triggered</div>"
    } else if (drag.querySelector('.blockelemtype').value == '5') {
      drag.innerHTML += "<div class='blockyleft'><img src='assets/databaseorange.svg'><p class='blockyname'>New database entry</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Add <span>Data object</span> to <span>Database 1</span></div>"
    } else if (drag.querySelector('.blockelemtype').value == '6') {
      drag.innerHTML += "<div class='blockyleft'><img src='assets/databaseorange.svg'><p class='blockyname'>Update database</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Update <span>Database 1</span></div>"
    } else if (drag.querySelector('.blockelemtype').value == '7') {
      drag.innerHTML += "<div class='blockyleft'><img src='assets/actionorange.svg'><p class='blockyname'>Perform an action</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Perform <span>Action 1</span></div>"
    } else if (drag.querySelector('.blockelemtype').value == '8') {
      drag.innerHTML += "<div class='blockyleft'><img src='assets/twitterorange.svg'><p class='blockyname'>Make a tweet</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Tweet <span>Query 1</span> with the account <span>@alyssaxuu</span></div>"
    } else if (drag.querySelector('.blockelemtype').value == '9') {
      drag.innerHTML += "<div class='blockyleft'><img src='assets/logred.svg'><p class='blockyname'>Add new log entry</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Add new <span>success</span> log entry</div>"
    } else if (drag.querySelector('.blockelemtype').value == '10') {
      drag.innerHTML += "<div class='blockyleft'><img src='assets/logred.svg'><p class='blockyname'>Update logs</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Edit <span>Log Entry 1</span></div>"
    } else if (drag.querySelector('.blockelemtype').value == '11') {
      drag.innerHTML += "<div class='blockyleft'><img src='assets/errorred.svg'><p class='blockyname'>Prompt an error</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Trigger <span>Error 1</span></div>"
    }
    setTimeout(function () {
      saveHistory()
    }, 100)
    return true
  }
  function drag (block) {
    block.classList.add('blockdisabled')
    tempblock2 = block
  }
  function release () {
    if (tempblock2) {
      tempblock2.classList.remove('blockdisabled')
    }
  }

  const disabledClick = function () {
    document.querySelector('.navactive').classList.add('navdisabled')
    document.querySelector('.navactive').classList.remove('navactive')
    this.classList.add('navactive')
    this.classList.remove('navdisabled')
    if (this.getAttribute('id') == 'triggers') {
      document.getElementById('blocklist').innerHTML = '<div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="1"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/eye.svg"></div><div class="blocktext">                        <p class="blocktitle">New visitor</p><p class="blockdesc">Triggers when somebody visits a specified page</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="2"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/action.svg"></div><div class="blocktext">                        <p class="blocktitle">Action is performed</p><p class="blockdesc">Triggers when somebody performs a specified action</p></div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="3"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/time.svg"></div><div class="blocktext">                        <p class="blocktitle">Time has passed</p><p class="blockdesc">Triggers after a specified amount of time</p>          </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="4"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/error.svg"></div><div class="blocktext">                        <p class="blocktitle">Error prompt</p><p class="blockdesc">Triggers when a specified error happens</p>              </div></div></div>'
    } else if (this.getAttribute('id') == 'actions') {
      document.getElementById('blocklist').innerHTML = '<div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="5"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/database.svg"></div><div class="blocktext">                        <p class="blocktitle">New database entry</p><p class="blockdesc">Adds a new entry to a specified database</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="6"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/database.svg"></div><div class="blocktext">                        <p class="blocktitle">Update database</p><p class="blockdesc">Edits and deletes database entries and properties</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="7"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/action.svg"></div><div class="blocktext">                        <p class="blocktitle">Perform an action</p><p class="blockdesc">Performs or edits a specified action</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="8"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/twitter.svg"></div><div class="blocktext">                        <p class="blocktitle">Make a tweet</p><p class="blockdesc">Makes a tweet with a specified query</p>        </div></div></div>'
    } else if (this.getAttribute('id') == 'loggers') {
      document.getElementById('blocklist').innerHTML = '<div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="9"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/log.svg"></div><div class="blocktext">                        <p class="blocktitle">Add new log entry</p><p class="blockdesc">Adds a new log entry to this project</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="10"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/log.svg"></div><div class="blocktext">                        <p class="blocktitle">Update logs</p><p class="blockdesc">Edits and deletes log entries in this project</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="11"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/error.svg"></div><div class="blocktext">                        <p class="blocktitle">Prompt an error</p><p class="blockdesc">Triggers a specified error</p>        </div></div></div>'
    }
  }
  addEventListenerMulti('click', disabledClick, false, '.side')
  document.getElementById('close').addEventListener('click', function () {
    if (rightcard) {
      rightcard = false
      document.getElementById('properties').classList.remove('expanded')
      setTimeout(function () {
        document.getElementById('propwrap').classList.remove('itson')
      }, 300)
      tempblock.classList.remove('selectedblock')
    }
  })

  document.getElementById('removeblock').addEventListener('click', function () {
    flowy.deleteBlocks()
    setTimeout(function () {
      saveHistory()
    }, 100)
  })

  let aclick = false
  let noinfo = false
  const beginTouch = function (event) {
    aclick = true
    noinfo = false
    if (event.target.closest('.create-flowy')) {
      noinfo = true
    }
  }
  const checkTouch = function (event) {
    aclick = false
  }
  const doneTouch = function (event) {
    if (event.type === 'mouseup' && aclick && !noinfo) {
      if (!rightcard && event.target.closest('.block') && !event.target.closest('.block').classList.contains('dragging')) {
        tempblock = event.target.closest('.block')
        rightcard = true
        document.getElementById('properties').classList.add('expanded')
        document.getElementById('propwrap').classList.add('itson')
        tempblock.classList.add('selectedblock')

        setTimeout(function () {
          saveHistory()
        }, 100)
      }
    }
  }
  addEventListener('mousedown', beginTouch, false)
  addEventListener('mousemove', checkTouch, false)
  addEventListener('mouseup', doneTouch, false)
  addEventListenerMulti('touchstart', beginTouch, false, '.block')

  document.getElementById('rightswitch').addEventListener('click', function () {
    document.getElementById('leftswitch').classList.remove('switchactive')
    this.classList.add('switchactive')
    document.getElementById('canvas').style.display = 'none'
    document.getElementById('editor').style.display = 'block'
    document.getElementById('codearea').value = JSON.stringify(flowy.output(), null, 2)
  })

  document.getElementById('leftswitch').addEventListener('click', function () {
    document.getElementById('rightswitch').classList.remove('switchactive')
    this.classList.add('switchactive')
    document.getElementById('editor').style.display = 'none'
    document.getElementById('canvas').style.display = 'block'
  })

  document.getElementById('applyjson').addEventListener('click', function () {
    try {
      const data = JSON.parse(document.getElementById('codearea').value)
      flowy.import(data)
      saveHistory()
    } catch (e) {
      alert('Invalid JSON')
    }
  })

  document.getElementById('undo').addEventListener('click', undo)
  document.getElementById('redo').addEventListener('click', redo)

  let zoom = 1
  function applyZoom () {
    document.getElementById('canvas').style.transform = 'scale(' + zoom + ')'
    document.getElementById('canvas').style.transformOrigin = '0 0'
  }
  document.getElementById('canvas').addEventListener('click', function (e) {
    if (e.target && e.target.id === 'zoom_in') {
      zoom += 0.1
      applyZoom()
    } else if (e.target && e.target.id === 'zoom_out') {
      zoom = Math.max(0.1, zoom - 0.1)
      applyZoom()
    }
  })
})

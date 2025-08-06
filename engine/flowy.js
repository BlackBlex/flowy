/**
 * Initializes the flowy engine
 * @param {HTMLElement} canvas - Container for flowy blocks
 * @param {Function} grab - Callback when a block is grabbed
 * @param {Function} release - Callback when a block is released
 * @param {Function} snapping - Callback when blocks snap
 * @param {Function} rearrange - Callback when blocks are rearranged
 * @param {number} spacing_x - Horizontal spacing between blocks
 * @param {number} spacing_y - Vertical spacing between blocks
 * @returns {void}
 */
const flowy = function (canvas, grab, release, snapping, rearrange, spacing_x, spacing_y) {
  grab = grab || function () {}
  release = release || function () {}
  snapping = snapping || function () { return true }
  rearrange = rearrange || function () { return false }
  spacing_x = !spacing_x ? 20 : spacing_x
  spacing_y = !spacing_y ? 80 : spacing_y

  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector ||
            Element.prototype.webkitMatchesSelector
  }
  if (!Element.prototype.closest) {
    /**
     * Polyfill for Element.closest
     * @param {string} s - Selector to match
     * @returns {Element|null} Matching ancestor element or null
     */
    Element.prototype.closest = function (s) {
      let el = this
      do {
        if (Element.prototype.matches.call(el, s)) return el
        el = el.parentElement || el.parentNode
      } while (el !== null && el.nodeType === 1)
      return null
    }
  }
  let loaded = false
  /**
   * Sets up event listeners and internal data structures
   * @returns {void}
   */
  flowy.load = function () {
    if (!loaded) { loaded = true } else { return }
    let blocks = []
    let blockstemp = []
    const canvas_div = canvas
    let absx = 0
    let absy = 0
    if (window.getComputedStyle(canvas_div).position == 'absolute' || window.getComputedStyle(canvas_div).position == 'fixed') {
      absx = canvas_div.getBoundingClientRect().left
      absy = canvas_div.getBoundingClientRect().top
    }
    let active = false
    const paddingx = spacing_x
    const paddingy = spacing_y
    let offsetleft = 0
    let rearrange = false
    let drag, dragx, dragy, original
    let mouse_x, mouse_y
    let begin_mouse_x, begin_mouse_y
    let dragblock = false
    let prevblock = 0
    const el = document.createElement('DIV')
    el.classList.add('indicator')
    el.classList.add('invisible')
    canvas_div.appendChild(el)
    /**
     * Imports a previously exported flowchart
     * @param {Object} output - Data created by flowy.output
     * @returns {void}
     */
    flowy.import = function (output) {
      blocks = []
      blockstemp = []
      canvas_div.innerHTML = output.html
      for (let a = 0; a < output.blockarr.length; a++) {
        blocks.push({
          childwidth: parseFloat(output.blockarr[a].childwidth),
          parent: parseFloat(output.blockarr[a].parent),
          id: parseFloat(output.blockarr[a].id),
          x: parseFloat(output.blockarr[a].x),
          y: parseFloat(output.blockarr[a].y),
          width: parseFloat(output.blockarr[a].width),
          height: parseFloat(output.blockarr[a].height)
        })
      }
      if (blocks.length > 1) {
        rearrangeMe()
        checkOffset()
      }
    }
    /**
     * Serializes the current flowchart state
     * @returns {Object|undefined} Serialized flowchart data
     */
    flowy.output = function () {
      const html_ser = canvas_div.innerHTML
      const json_data = {
        html: html_ser,
        blockarr: blocks,
        blocks: []
      }
      if (blocks.length > 0) {
        for (var i = 0; i < blocks.length; i++) {
          json_data.blocks.push({
            id: blocks[i].id,
            parent: blocks[i].parent,
            data: [],
            attr: []
          })
          const blockParent = document.querySelector(".blockid[value='" + blocks[i].id + "']").parentNode
          blockParent.querySelectorAll('input').forEach(function (block) {
            const json_name = block.getAttribute('name')
            const json_value = block.value
            json_data.blocks[i].data.push({
              name: json_name,
              value: json_value
            })
          })
          Array.prototype.slice.call(blockParent.attributes).forEach(function (attribute) {
            const jsonobj = {}
            jsonobj[attribute.name] = attribute.value
            json_data.blocks[i].attr.push(jsonobj)
          })
        }
        return json_data
      }
    }
    /**
     * Removes all blocks from the canvas
     * @returns {void}
     */
    flowy.deleteBlocks = function () {
      blocks = []
      canvas_div.innerHTML = "<div class='indicator invisible'></div>"
    }

    flowy.deleteBlock = function (id) {
      let newParentId

      if (!Number.isInteger(id)) {
        id = parseInt(id)
      }

      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].id === id) {
          newParentId = blocks[i].parent
          canvas_div.appendChild(document.querySelector('.indicator'))
          removeBlockEls(blocks[i].id)
          blocks.splice(i, 1)
          modifyChildBlocks(id)
          break
        }
      }

      if (blocks.length > 1) {
        rearrangeMe()
      }

      return Math.max.apply(
        Math,
        blocks.map((a) => a.id)
      )

      function modifyChildBlocks (parentId) {
        const children = []
        const blocko = blocks.map((a) => a.id)
        for (var i = blocko.length - 1; i >= 0; i--) {
          const currentBlock = blocks.filter((a) => a.id == blocko[i])[0]
          if (currentBlock.parent === parentId) {
            children.push(currentBlock.id)
            removeBlockEls(currentBlock.id)
            blocks.splice(i, 1)
          }
        }

        for (var i = 0; i < children.length; i++) {
          modifyChildBlocks(children[i])
        }
      }
      function removeBlockEls (id) {
        document
          .querySelector(".blockid[value='" + id + "']")
          .parentNode.remove()
        if (document.querySelector(".arrowid[value='" + id + "']")) {
          document
            .querySelector(".arrowid[value='" + id + "']")
            .parentNode.remove()
        }
      }
    }

    /**
     * Handles user drag start events
     * @param {MouseEvent|TouchEvent} event - Drag start event
     * @returns {void}
     */
    flowy.beginDrag = function (event) {
      if (window.getComputedStyle(canvas_div).position == 'absolute' || window.getComputedStyle(canvas_div).position == 'fixed') {
        absx = canvas_div.getBoundingClientRect().left
        absy = canvas_div.getBoundingClientRect().top
      }
      if (event.targetTouches) {
        mouse_x = event.changedTouches[0].clientX
        mouse_y = event.changedTouches[0].clientY
      } else {
        mouse_x = event.clientX
        mouse_y = event.clientY
      }
      begin_mouse_x = mouse_x
      begin_mouse_y = mouse_y

      if (event.which != 3 && event.target.closest('.create-flowy')) {
        original = event.target.closest('.create-flowy')
        const newNode = event.target.closest('.create-flowy').cloneNode(true)
        event.target.closest('.create-flowy').classList.add('dragnow')
        newNode.classList.add('block')
        newNode.classList.remove('create-flowy')
        if (blocks.length === 0) {
          newNode.innerHTML += "<input type='hidden' name='blockid' class='blockid' value='" + blocks.length + "'>"
          document.body.appendChild(newNode)
          drag = document.querySelector(".blockid[value='" + blocks.length + "']").parentNode
        } else {
          newNode.innerHTML += "<input type='hidden' name='blockid' class='blockid' value='" + (Math.max.apply(Math, blocks.map(a => a.id)) + 1) + "'>"
          document.body.appendChild(newNode)
          drag = document.querySelector(".blockid[value='" + (parseInt(Math.max.apply(Math, blocks.map(a => a.id))) + 1) + "']").parentNode
        }
        blockGrabbed(event.target.closest('.create-flowy'))
        drag.classList.add('dragging')
        active = true
        dragx = mouse_x - (event.target.closest('.create-flowy').getBoundingClientRect().left)
        dragy = mouse_y - (event.target.closest('.create-flowy').getBoundingClientRect().top)
        drag.style.left = mouse_x - dragx + 'px'
        drag.style.top = mouse_y - dragy + 'px'
      }
    }

    /**
     * Handles user drag end events
     * @param {MouseEvent|TouchEvent} event - Drag end event
     * @returns {void}
     */
    flowy.endDrag = function (event) {
      const diffx = mouse_x - begin_mouse_x
      const diffy = mouse_y - begin_mouse_y

      if (
        Math.abs(diffx) < 50 &&
                Math.abs(diffy) < 50 &&
                rearrange &&
                parseInt(drag.querySelector('.blockid').value) !== 0
      ) {
        var blocko = blocks.map((a) => a.id)
        active = false
        drag.classList.remove('dragging')
        snap(drag, blocko.indexOf(prevblock), blocko)
        document.querySelector('.indicator').classList.add('invisible')
        return
      }

      if (event.which != 3 && (active || rearrange)) {
        dragblock = false
        blockReleased()
        if (!document.querySelector('.indicator').classList.contains('invisible')) {
          document.querySelector('.indicator').classList.add('invisible')
        }
        if (active) {
          original.classList.remove('dragnow')
          drag.classList.remove('dragging')
        }
        if (parseInt(drag.querySelector('.blockid').value) === 0 && rearrange) {
          firstBlock('rearrange')
        } else if (active && blocks.length == 0 && (drag.getBoundingClientRect().top + window.scrollY) > (canvas_div.getBoundingClientRect().top + window.scrollY) && (drag.getBoundingClientRect().left + window.scrollX) > (canvas_div.getBoundingClientRect().left + window.scrollX)) {
          firstBlock('drop')
        } else if (active && blocks.length == 0) {
          removeSelection()
        } else if (active) {
          var blocko = blocks.map(a => a.id)
          for (var i = 0; i < blocks.length; i++) {
            if (checkAttach(blocko[i])) {
              active = false
              if (blockSnap(drag, false, document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode)) {
                snap(drag, i, blocko)
              } else {
                active = false
                removeSelection()
              }
              break
            } else if (i == blocks.length - 1) {
              active = false
              removeSelection()
            }
          }
        } else if (rearrange) {
          var blocko = blocks.map(a => a.id)
          for (var i = 0; i < blocks.length; i++) {
            if (checkAttach(blocko[i])) {
              active = false
              drag.classList.remove('dragging')
              snap(drag, i, blocko)
              break
            } else if (i == blocks.length - 1) {
              if (beforeDelete(drag, blocks.filter(id => id.id == blocko[i])[0])) {
                active = false
                drag.classList.remove('dragging')
                snap(drag, blocko.indexOf(prevblock), blocko)
                break
              } else {
                rearrange = false
                blockstemp = []
                active = false
                removeSelection()
                break
              }
            }
          }
        }
      }
    }

    /**
     * Determines if the dragged block can attach to a target block
     * @param {number} id - ID of the potential parent block
     * @returns {boolean} True if the block can attach
     */
    function checkAttach (id) {
      const xpos = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left
      const ypos = (drag.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top
      if (xpos >= blocks.filter(a => a.id == id)[0].x - (blocks.filter(a => a.id == id)[0].width / 2) - paddingx &&
              xpos <= blocks.filter(a => a.id == id)[0].x + (blocks.filter(a => a.id == id)[0].width / 2) + paddingx &&
              ypos >= blocks.filter(a => a.id == id)[0].y - (3 * (blocks.filter(a => a.id == id)[0].height / 2)) &&
              ypos <= blocks.filter(a => a.id == id)[0].y + (3 * (blocks.filter(a => a.id == id)[0].height / 2))) {
        return true
      } else {
        return false
      }
    }

    /**
     * Removes a dragged block when it cannot be placed
     * @returns {void}
     */
    function removeSelection () {
      canvas_div.appendChild(document.querySelector('.indicator'))
      if (drag.parentNode !== null) { drag.parentNode.removeChild(drag) }
    }

    /**
     * Handles placing or rearranging the first block
     * @param {string} type - Operation type ('drop' or 'rearrange')
     * @returns {void}
     */
    function firstBlock (type) {
      if (type == 'drop') {
        active = false
        if (!blockSnap(drag, true, undefined)) {
          removeSelection()
          return false
        }
        drag.style.top = (drag.getBoundingClientRect().top + window.scrollY) - (absy + window.scrollY) + canvas_div.scrollTop + 'px'
        drag.style.left = (drag.getBoundingClientRect().left + window.scrollX) - (absx + window.scrollX) + canvas_div.scrollLeft + 'px'
        canvas_div.appendChild(drag)
        blocks.push({
          parent: -1,
          childwidth: 0,
          id: parseInt(drag.querySelector('.blockid').value),
          x: (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left,
          y: (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top,
          width: parseInt(window.getComputedStyle(drag).width),
          height: parseInt(window.getComputedStyle(drag).height)
        })
      } else if (type == 'rearrange') {
        drag.classList.remove('dragging')
        rearrange = false
        for (let w = 0; w < blockstemp.length; w++) {
          if (blockstemp[w].id != parseInt(drag.querySelector('.blockid').value)) {
            const blockParent = document.querySelector(".blockid[value='" + blockstemp[w].id + "']").parentNode
            const arrowParent = document.querySelector(".arrowid[value='" + blockstemp[w].id + "']").parentNode
            blockParent.style.left = (blockParent.getBoundingClientRect().left + window.scrollX) - (window.scrollX) + canvas_div.scrollLeft - 1 - absx + 'px'
            blockParent.style.top = (blockParent.getBoundingClientRect().top + window.scrollY) - (window.scrollY) + canvas_div.scrollTop - absy - 1 + 'px'
            arrowParent.style.left = (arrowParent.getBoundingClientRect().left + window.scrollX) - (window.scrollX) + canvas_div.scrollLeft - absx - 1 + 'px'
            arrowParent.style.top = (arrowParent.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop - 1 - absy + 'px'
            canvas_div.appendChild(blockParent)
            canvas_div.appendChild(arrowParent)
            blockstemp[w].x = (blockParent.getBoundingClientRect().left + window.scrollX) + (parseInt(blockParent.offsetWidth) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left - 1
            blockstemp[w].y = (blockParent.getBoundingClientRect().top + window.scrollY) + (parseInt(blockParent.offsetHeight) / 2) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top - 1
          }
        }
        blockstemp.filter(a => a.id == 0)[0].x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left
        blockstemp.filter(a => a.id == 0)[0].y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top
        blocks = blocks.concat(blockstemp)
        blockstemp = []
      }
    }

    /**
     * Draws a connection arrow between two blocks
     * @param {Object} arrow - Arrow block data
     * @param {number} x - Horizontal offset
     * @param {number} y - Vertical offset
     * @param {number} id - Parent block id
     * @returns {void}
     */
    function drawArrow (arrow, x, y, id) {
      if (x < 0) {
        canvas_div.innerHTML += '<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.querySelector('.blockid').value + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(a => a.id == id)[0].x - arrow.x + 5) + ' 0L' + (blocks.filter(a => a.id == id)[0].x - arrow.x + 5) + ' ' + (paddingy / 2) + 'L5 ' + (paddingy / 2) + 'L5 ' + y + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (y - 5) + 'H10L5 ' + y + 'L0 ' + (y - 5) + 'Z" fill="#C5CCD0"/></svg></div>'
        document.querySelector('.arrowid[value="' + drag.querySelector('.blockid').value + '"]').parentNode.style.left = (arrow.x - 5) - (absx + window.scrollX) + canvas_div.scrollLeft + canvas_div.getBoundingClientRect().left + 'px'
      } else {
        canvas_div.innerHTML += '<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.querySelector('.blockid').value + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + (paddingy / 2) + 'L' + (x) + ' ' + (paddingy / 2) + 'L' + x + ' ' + y + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (x - 5) + ' ' + (y - 5) + 'H' + (x + 5) + 'L' + x + ' ' + y + 'L' + (x - 5) + ' ' + (y - 5) + 'Z" fill="#C5CCD0"/></svg></div>'
        document.querySelector('.arrowid[value="' + parseInt(drag.querySelector('.blockid').value) + '"]').parentNode.style.left = blocks.filter(a => a.id == id)[0].x - 20 - (absx + window.scrollX) + canvas_div.scrollLeft + canvas_div.getBoundingClientRect().left + 'px'
      }
      document.querySelector('.arrowid[value="' + parseInt(drag.querySelector('.blockid').value) + '"]').parentNode.style.top = blocks.filter(a => a.id == id)[0].y + (blocks.filter(a => a.id == id)[0].height / 2) + canvas_div.getBoundingClientRect().top - absy + 'px'
    }

    /**
     * Updates an existing connection arrow
     * @param {Object} arrow - Arrow block data
     * @param {number} x - Horizontal offset
     * @param {number} y - Vertical offset
     * @param {Object} children - Child block data
     * @returns {void}
     */
    function updateArrow (arrow, x, y, children) {
      if (x < 0) {
        document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = (arrow.x - 5) - (absx + window.scrollX) + canvas_div.getBoundingClientRect().left + 'px'
        document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(id => id.id == children.parent)[0].x - arrow.x + 5) + ' 0L' + (blocks.filter(id => id.id == children.parent)[0].x - arrow.x + 5) + ' ' + (paddingy / 2) + 'L5 ' + (paddingy / 2) + 'L5 ' + y + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (y - 5) + 'H10L5 ' + y + 'L0 ' + (y - 5) + 'Z" fill="#C5CCD0"/></svg>'
      } else {
        document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = blocks.filter(id => id.id == children.parent)[0].x - 20 - (absx + window.scrollX) + canvas_div.getBoundingClientRect().left + 'px'
        document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + (paddingy / 2) + 'L' + (x) + ' ' + (paddingy / 2) + 'L' + x + ' ' + y + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (x - 5) + ' ' + (y - 5) + 'H' + (x + 5) + 'L' + x + ' ' + y + 'L' + (x - 5) + ' ' + (y - 5) + 'Z" fill="#C5CCD0"/></svg>'
      }
    }

    /**
     * Attaches a dragged block to its parent and positions children
     * @param {HTMLElement} drag - Block being dragged
     * @param {number} i - Index of the parent in block list
     * @param {number[]} blocko - Array of block ids
     * @returns {void}
     */
    function snap (drag, i, blocko) {
      if (!rearrange) {
        canvas_div.appendChild(drag)
      }
      let totalwidth = 0
      let totalremove = 0
      const maxheight = 0
      for (var w = 0; w < blocks.filter(id => id.parent == blocko[i]).length; w++) {
        var children = blocks.filter(id => id.parent == blocko[i])[w]
        if (children.childwidth > children.width) {
          totalwidth += children.childwidth + paddingx
        } else {
          totalwidth += children.width + paddingx
        }
      }
      totalwidth += parseInt(window.getComputedStyle(drag).width)
      for (var w = 0; w < blocks.filter(id => id.parent == blocko[i]).length; w++) {
        var children = blocks.filter(id => id.parent == blocko[i])[w]
        if (children.childwidth > children.width) {
          document.querySelector(".blockid[value='" + children.id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2) - (children.width / 2) + 'px'
          children.x = blocks.filter(id => id.parent == blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2)
          totalremove += children.childwidth + paddingx
        } else {
          document.querySelector(".blockid[value='" + children.id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[i])[0].x - (totalwidth / 2) + totalremove + 'px'
          children.x = blocks.filter(id => id.parent == blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.width / 2)
          totalremove += children.width + paddingx
        }
      }
      drag.style.left = blocks.filter(id => id.id == blocko[i])[0].x - (totalwidth / 2) + totalremove - (window.scrollX + absx) + canvas_div.scrollLeft + canvas_div.getBoundingClientRect().left + 'px'
      drag.style.top = blocks.filter(id => id.id == blocko[i])[0].y + (blocks.filter(id => id.id == blocko[i])[0].height / 2) + paddingy - (window.scrollY + absy) + canvas_div.getBoundingClientRect().top + 'px'
      if (rearrange) {
        blockstemp.filter(a => a.id == parseInt(drag.querySelector('.blockid').value))[0].x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left
        blockstemp.filter(a => a.id == parseInt(drag.querySelector('.blockid').value))[0].y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top
        blockstemp.filter(a => a.id == drag.querySelector('.blockid').value)[0].parent = blocko[i]
        for (var w = 0; w < blockstemp.length; w++) {
          if (blockstemp[w].id != parseInt(drag.querySelector('.blockid').value)) {
            const blockParent = document.querySelector(".blockid[value='" + blockstemp[w].id + "']").parentNode
            const arrowParent = document.querySelector(".arrowid[value='" + blockstemp[w].id + "']").parentNode
            blockParent.style.left = (blockParent.getBoundingClientRect().left + window.scrollX) - (window.scrollX + canvas_div.getBoundingClientRect().left) + canvas_div.scrollLeft + 'px'
            blockParent.style.top = (blockParent.getBoundingClientRect().top + window.scrollY) - (window.scrollY + canvas_div.getBoundingClientRect().top) + canvas_div.scrollTop + 'px'
            arrowParent.style.left = (arrowParent.getBoundingClientRect().left + window.scrollX) - (window.scrollX + canvas_div.getBoundingClientRect().left) + canvas_div.scrollLeft + 20 + 'px'
            arrowParent.style.top = (arrowParent.getBoundingClientRect().top + window.scrollY) - (window.scrollY + canvas_div.getBoundingClientRect().top) + canvas_div.scrollTop + 'px'
            canvas_div.appendChild(blockParent)
            canvas_div.appendChild(arrowParent)

            blockstemp[w].x = (blockParent.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(blockParent).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left
            blockstemp[w].y = (blockParent.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(blockParent).height) / 2) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top
          }
        }
        blocks = blocks.concat(blockstemp)
        blockstemp = []
      } else {
        blocks.push({
          childwidth: 0,
          parent: blocko[i],
          id: parseInt(drag.querySelector('.blockid').value),
          x: (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left,
          y: (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top,
          width: parseInt(window.getComputedStyle(drag).width),
          height: parseInt(window.getComputedStyle(drag).height)
        })
      }

      const arrowblock = blocks.filter(a => a.id == parseInt(drag.querySelector('.blockid').value))[0]
      const arrowx = arrowblock.x - blocks.filter(a => a.id == blocko[i])[0].x + 20
      const arrowy = paddingy
      drawArrow(arrowblock, arrowx, arrowy, blocko[i])

      if (blocks.filter(a => a.id == blocko[i])[0].parent != -1) {
        let flag = false
        let idval = blocko[i]
        while (!flag) {
          if (blocks.filter(a => a.id == idval)[0].parent == -1) {
            flag = true
          } else {
            let zwidth = 0
            for (var w = 0; w < blocks.filter(id => id.parent == idval).length; w++) {
              var children = blocks.filter(id => id.parent == idval)[w]
              if (children.childwidth > children.width) {
                if (w == blocks.filter(id => id.parent == idval).length - 1) {
                  zwidth += children.childwidth
                } else {
                  zwidth += children.childwidth + paddingx
                }
              } else {
                if (w == blocks.filter(id => id.parent == idval).length - 1) {
                  zwidth += children.width
                } else {
                  zwidth += children.width + paddingx
                }
              }
            }
            blocks.filter(a => a.id == idval)[0].childwidth = zwidth
            idval = blocks.filter(a => a.id == idval)[0].parent
          }
        }
        blocks.filter(id => id.id == idval)[0].childwidth = totalwidth
      }
      if (rearrange) {
        rearrange = false
        drag.classList.remove('dragging')
      }
      rearrangeMe()
      checkOffset()
    }

    /**
     * Prepares a block for dragging when clicked or touched
     * @param {MouseEvent|TouchEvent} event - Pointer event
     * @returns {void}
     */
    function touchblock (event) {
      dragblock = false
      if (hasParentClass(event.target, 'block')) {
        const theblock = event.target.closest('.block')
        if (event.targetTouches) {
          mouse_x = event.targetTouches[0].clientX
          mouse_y = event.targetTouches[0].clientY
        } else {
          mouse_x = event.clientX
          mouse_y = event.clientY
        }
        if (event.type !== 'mouseup' && hasParentClass(event.target, 'block')) {
          if (event.which != 3) {
            if (!active && !rearrange) {
              dragblock = true
              drag = theblock
              dragx = mouse_x - (drag.getBoundingClientRect().left + window.scrollX)
              dragy = mouse_y - (drag.getBoundingClientRect().top + window.scrollY)
            }
          }
        }
      }
    }

    /**
     * Checks if an element or its parents have a class
     * @param {HTMLElement} element - Element to check
     * @param {string} classname - Class name to look for
     * @returns {boolean} True if class exists in parent chain
     */
    function hasParentClass (element, classname) {
      if (element.className) {
        if (element.className.split(' ').indexOf(classname) >= 0) return true
      }
      return element.parentNode && hasParentClass(element.parentNode, classname)
    }

    /**
     * Moves the currently dragged block
     * @param {MouseEvent|TouchEvent} event - Move event
     * @returns {void}
     */
    flowy.moveBlock = function (event) {
      if (event.targetTouches) {
        mouse_x = event.targetTouches[0].clientX
        mouse_y = event.targetTouches[0].clientY
      } else {
        mouse_x = event.clientX
        mouse_y = event.clientY
      }
      if (dragblock) {
        rearrange = true
        drag.classList.add('dragging')
        const blockid = parseInt(drag.querySelector('.blockid').value)
        prevblock = blocks.filter(a => a.id == blockid)[0].parent
        blockstemp.push(blocks.filter(a => a.id == blockid)[0])
        blocks = blocks.filter(function (e) {
          return e.id != blockid
        })
        if (blockid != 0) {
          document.querySelector(".arrowid[value='" + blockid + "']").parentNode.remove()
        }
        let layer = blocks.filter(a => a.parent == blockid)
        let flag = false
        let foundids = []
        const allids = []
        while (!flag) {
          for (var i = 0; i < layer.length; i++) {
            if (layer[i] != blockid) {
              blockstemp.push(blocks.filter(a => a.id == layer[i].id)[0])
              const blockParent = document.querySelector(".blockid[value='" + layer[i].id + "']").parentNode
              const arrowParent = document.querySelector(".arrowid[value='" + layer[i].id + "']").parentNode
              blockParent.style.left = (blockParent.getBoundingClientRect().left + window.scrollX) - (drag.getBoundingClientRect().left + window.scrollX) + 'px'
              blockParent.style.top = (blockParent.getBoundingClientRect().top + window.scrollY) - (drag.getBoundingClientRect().top + window.scrollY) + 'px'
              arrowParent.style.left = (arrowParent.getBoundingClientRect().left + window.scrollX) - (drag.getBoundingClientRect().left + window.scrollX) + 'px'
              arrowParent.style.top = (arrowParent.getBoundingClientRect().top + window.scrollY) - (drag.getBoundingClientRect().top + window.scrollY) + 'px'
              drag.appendChild(blockParent)
              drag.appendChild(arrowParent)
              foundids.push(layer[i].id)
              allids.push(layer[i].id)
            }
          }
          if (foundids.length == 0) {
            flag = true
          } else {
            layer = blocks.filter(a => foundids.includes(a.parent))
            foundids = []
          }
        }
        for (var i = 0; i < blocks.filter(a => a.parent == blockid).length; i++) {
          var blocknumber = blocks.filter(a => a.parent == blockid)[i]
          blocks = blocks.filter(function (e) {
            return e.id != blocknumber
          })
        }
        for (var i = 0; i < allids.length; i++) {
          var blocknumber = allids[i]
          blocks = blocks.filter(function (e) {
            return e.id != blocknumber
          })
        }
        if (blocks.length > 1) {
          rearrangeMe()
        }
        dragblock = false
      }
      if (active) {
        drag.style.left = mouse_x - dragx + 'px'
        drag.style.top = mouse_y - dragy + 'px'
      } else if (rearrange) {
        drag.style.left = mouse_x - dragx - (window.scrollX + absx) + canvas_div.scrollLeft + 'px'
        drag.style.top = mouse_y - dragy - (window.scrollY + absy) + canvas_div.scrollTop + 'px'
        blockstemp.filter(a => a.id == parseInt(drag.querySelector('.blockid').value)).x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft
        blockstemp.filter(a => a.id == parseInt(drag.querySelector('.blockid').value)).y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop
      }
      if (active || rearrange) {
        if (mouse_x > canvas_div.getBoundingClientRect().width + canvas_div.getBoundingClientRect().left - 10 && mouse_x < canvas_div.getBoundingClientRect().width + canvas_div.getBoundingClientRect().left + 10) {
          canvas_div.scrollLeft += 10
        } else if (mouse_x < canvas_div.getBoundingClientRect().left + 10 && mouse_x > canvas_div.getBoundingClientRect().left - 10) {
          canvas_div.scrollLeft -= 10
        } else if (mouse_y > canvas_div.getBoundingClientRect().height + canvas_div.getBoundingClientRect().top - 10 && mouse_y < canvas_div.getBoundingClientRect().height + canvas_div.getBoundingClientRect().top + 10) {
          canvas_div.scrollTop += 10
        } else if (mouse_y < canvas_div.getBoundingClientRect().top + 10 && mouse_y > canvas_div.getBoundingClientRect().top - 10) {
          canvas_div.scrollLeft -= 10
        }
        const xpos = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft - canvas_div.getBoundingClientRect().left
        const ypos = (drag.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop - canvas_div.getBoundingClientRect().top
        const blocko = blocks.map(a => a.id)
        for (var i = 0; i < blocks.length; i++) {
          if (checkAttach(blocko[i])) {
            document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.appendChild(document.querySelector('.indicator'))
            document.querySelector('.indicator').style.left = (document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.offsetWidth / 2) - 5 + 'px'
            document.querySelector('.indicator').style.top = document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.offsetHeight + 'px'
            document.querySelector('.indicator').classList.remove('invisible')
            break
          } else if (i == blocks.length - 1) {
            if (!document.querySelector('.indicator').classList.contains('invisible')) {
              document.querySelector('.indicator').classList.add('invisible')
            }
          }
        }
      }
    }

    /**
     * Ensures blocks stay within canvas bounds
     * @returns {void}
     */
    function checkOffset () {
      offsetleft = blocks.map(a => a.x)
      const widths = blocks.map(a => a.width)
      const mathmin = offsetleft.map(function (item, index) {
        return item - (widths[index] / 2)
      })
      offsetleft = Math.min.apply(Math, mathmin)
      if (offsetleft < (canvas_div.getBoundingClientRect().left + window.scrollX - absx)) {
        const blocko = blocks.map(a => a.id)
        for (var w = 0; w < blocks.length; w++) {
          document.querySelector(".blockid[value='" + blocks.filter(a => a.id == blocko[w])[0].id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[w])[0].x - (blocks.filter(a => a.id == blocko[w])[0].width / 2) - offsetleft + canvas_div.getBoundingClientRect().left - absx + 20 + 'px'
          if (blocks.filter(a => a.id == blocko[w])[0].parent != -1) {
            const arrowblock = blocks.filter(a => a.id == blocko[w])[0]
            const arrowx = arrowblock.x - blocks.filter(a => a.id == blocks.filter(a => a.id == blocko[w])[0].parent)[0].x
            if (arrowx < 0) {
              document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = (arrowblock.x - offsetleft + 20 - 5) + canvas_div.getBoundingClientRect().left - absx + 'px'
            } else {
              document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = blocks.filter(id => id.id == blocks.filter(a => a.id == blocko[w])[0].parent)[0].x - 20 - offsetleft + canvas_div.getBoundingClientRect().left - absx + 20 + 'px'
            }
          }
        }
        for (var w = 0; w < blocks.length; w++) {
          blocks[w].x = (document.querySelector(".blockid[value='" + blocks[w].id + "']").parentNode.getBoundingClientRect().left + window.scrollX) + (canvas_div.scrollLeft) + (parseInt(window.getComputedStyle(document.querySelector(".blockid[value='" + blocks[w].id + "']").parentNode).width) / 2) - 20 - canvas_div.getBoundingClientRect().left
        }
      }
    }

    /**
     * Recalculates child positions after a change
     * @returns {void}
     */
    function rearrangeMe () {
      const result = blocks.map(a => a.parent)
      for (var z = 0; z < result.length; z++) {
        if (result[z] == -1) {
          z++
        }
        let totalwidth = 0
        let totalremove = 0
        const maxheight = 0
        for (var w = 0; w < blocks.filter(id => id.parent == result[z]).length; w++) {
          var children = blocks.filter(id => id.parent == result[z])[w]
          if (blocks.filter(id => id.parent == children.id).length == 0) {
            children.childwidth = 0
          }
          if (children.childwidth > children.width) {
            if (w == blocks.filter(id => id.parent == result[z]).length - 1) {
              totalwidth += children.childwidth
            } else {
              totalwidth += children.childwidth + paddingx
            }
          } else {
            if (w == blocks.filter(id => id.parent == result[z]).length - 1) {
              totalwidth += children.width
            } else {
              totalwidth += children.width + paddingx
            }
          }
        }
        if (result[z] != -1) {
          blocks.filter(a => a.id == result[z])[0].childwidth = totalwidth
        }
        for (var w = 0; w < blocks.filter(id => id.parent == result[z]).length; w++) {
          var children = blocks.filter(id => id.parent == result[z])[w]
          const r_block = document.querySelector(".blockid[value='" + children.id + "']").parentNode
          const r_array = blocks.filter(id => id.id == result[z])
          r_block.style.top = r_array.y + paddingy + canvas_div.getBoundingClientRect().top - absy + 'px'
          r_array.y = r_array.y + paddingy
          if (children.childwidth > children.width) {
            r_block.style.left = r_array[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2) - (children.width / 2) - (absx + window.scrollX) + canvas_div.getBoundingClientRect().left + 'px'
            children.x = r_array[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2)
            totalremove += children.childwidth + paddingx
          } else {
            r_block.style.left = r_array[0].x - (totalwidth / 2) + totalremove - (absx + window.scrollX) + canvas_div.getBoundingClientRect().left + 'px'
            children.x = r_array[0].x - (totalwidth / 2) + totalremove + (children.width / 2)
            totalremove += children.width + paddingx
          }

          const arrowblock = blocks.filter(a => a.id == children.id)[0]
          const arrowx = arrowblock.x - blocks.filter(a => a.id == children.parent)[0].x + 20
          const arrowy = paddingy
          updateArrow(arrowblock, arrowx, arrowy, children)
        }
      }
    }

    document.addEventListener('mousedown', flowy.beginDrag)
    document.addEventListener('mousedown', touchblock, false)
    document.addEventListener('touchstart', flowy.beginDrag)
    document.addEventListener('touchstart', touchblock, false)

    document.addEventListener('mouseup', touchblock, false)
    document.addEventListener('mousemove', flowy.moveBlock, false)
    document.addEventListener('touchmove', flowy.moveBlock, false)

    document.addEventListener('mouseup', flowy.endDrag, false)
    document.addEventListener('touchend', flowy.endDrag, false)
  }

  /**
   * Wrapper for the grab callback
   * @param {HTMLElement} block - Block that was grabbed
   * @returns {void}
   */
  function blockGrabbed (block) {
    grab(block)
  }

  /**
   * Wrapper for the release callback
   * @returns {void}
   */
  function blockReleased () {
    release()
  }

  /**
   * Wrapper for the snap callback
   * @param {HTMLElement} drag - Block being snapped
   * @param {boolean} first - Whether it is the first block
   * @param {HTMLElement|undefined} parent - Parent block element
   * @returns {boolean} Result of snapping callback
   */
  function blockSnap (drag, first, parent) {
    return snapping(drag, first, parent)
  }

  /**
   * Wrapper for the rearrange callback before a block is deleted
   * @param {HTMLElement} drag - Block being removed
   * @param {Object} parent - Parent block data
   * @returns {boolean} Result of rearrange callback
   */
  function beforeDelete (drag, parent) {
    return rearrange(drag, parent)
  }

  /**
   * Adds an event listener to multiple nodes
   * @param {string} type - Event type
   * @param {Function} listener - Listener function
   * @param {boolean} capture - Use capture phase
   * @param {string} selector - CSS selector for nodes
   * @returns {void}
   */
  function addEventListenerMulti (type, listener, capture, selector) {
    const nodes = document.querySelectorAll(selector)
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].addEventListener(type, listener, capture)
    }
  }

  /**
   * Removes an event listener from multiple nodes
   * @param {string} type - Event type
   * @param {Function} listener - Listener function
   * @param {boolean} capture - Use capture phase
   * @param {string} selector - CSS selector for nodes
   * @returns {void}
   */
  function removeEventListenerMulti (type, listener, capture, selector) {
    const nodes = document.querySelectorAll(selector)
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].removeEventListener(type, listener, capture)
    }
  }

  flowy.load()
}

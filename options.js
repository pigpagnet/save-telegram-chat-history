$.fn.exists = function () {
  return this.length !== 0
}

function getElValue(el){
  if (el.is('input')){
    return el.val()
  }else{
    return el.html()
  }
}

function getSelectedFormatName(tableId, keySelected){
  var el = $('#'+tableId+' .selected .formatName')
  if (el.exists()){
    return el.html()
  }else{
    return defaultFormatSettings[keySelected]
  }
}

function extract_options_from_UI(tableId, keySelected){
  var mapFormatOptions = {}
  $('#'+tableId+' tr').each(function() {
    var fmtName = $('.formatName',$(this)).html()
    var fmtVal = getElValue($('.formatValue',$(this)))
    mapFormatOptions[fmtName] = fmtVal
  })
  mapFormatOptions[keySelected] = getSelectedFormatName(tableId, keySelected)
  return mapFormatOptions
}

function save_options() {
  var a = extract_options_from_UI('tableFormat', 'formatSelected')
  var b = extract_options_from_UI('tableFormatDate', 'formatDateSelected')
  var mapFormatOptions = Object.assign({}, a, b)
  
  chrome.storage.sync.set(mapFormatOptions, function() {
    // Update status to let user know options were saved.
    $('#status').html('Options saved.')
    setTimeout(function() {
      $('#status').html('')
    }, 1000)
  })
}


function render(mapFormats) {
  renderMap(mapFormats, 'tableFormat', 
    ['formatCompact', 'formatLarge'],'formatCustom', mapFormats['formatSelected'])
  renderMap(mapFormats, 'tableFormatDate', 
    ['formatDate1', 'formatDate2'],'formatDateCustom', mapFormats['formatDateSelected'])
}

function renderMap(mapValues, tableId, keysToDisplay, customKey, selectedKey, ){
  var table = $('#'+tableId)
  keysToDisplay.push(customKey)
  $.each(keysToDisplay, function(i, k) {
    var tr = $('<tr/>').appendTo(table)
    var tdText = $('<td/>')
      .addClass('formatName')
      .addClass('visible')
      .text(k) // format name
      .appendTo(tr);
    var tdValue = $('<td/>')
      .addClass('visible')
      .appendTo(tr)
    var code = null
    if (k === customKey){
      code = $('<input/>').attr('type','text').val(mapValues[k])
    } else{
      code = $('<pre/>').text(mapValues[k])
    }
    code.addClass('formatValue').appendTo(tdValue)
    if (k === selectedKey) {
      tr.addClass('selected')
    }
  })
  $('#'+tableId+' tr').click(function() {
    $(this).addClass('selected').siblings().removeClass('selected')
  })
}

function restore_options() {
  chrome.storage.sync.get(defaultFormatSettings, function(items) {
    render(items)
  })
}

document.addEventListener('DOMContentLoaded', restore_options)

$(document).ready(function() {
  $('#save').click(save_options)
  $('#tryFormat').click(function() {
    var msgFormat = prepareFormat(getElValue($('#tableFormat .selected .formatValue')))
    var datetimeFormat = prepareFormat(getElValue($('#tableFormatDate .selected .formatValue')))
    var dt2 = new Date()
    var dt1 = new Date()
    dt1.setSeconds(dt1.getSeconds() - 15)
    var sampleRendered = formatMsg(msgFormat, formatDate(dt1, datetimeFormat), "Alice", "Hi, Bob.")
    sampleRendered += "\n" + formatMsg(msgFormat, formatDate(dt2, datetimeFormat), "Bob", "Hello, Alice.")
    $('#sampleOutput').html(sampleRendered)
  })
})

$.fn.exists = function () {
  return this.length !== 0
}

function getFormatValue(el){
  if (el.is('input')){
    return el.val()
  }else{
    return el.html()
  }
}

function getSelectedFormatName(){
  var el = $('#table .selected .formatName')
  if (el.exists()){
    return el.html()
  }else{
    return defaultMapFormats['selected']
  }
}

function save_options() {
  var mapFormats = {}
  $('#table tr').each(function() {
    var fmtName = $('.formatName',$(this)).html()
    var fmtVal = getFormatValue($('.formatValue',$(this)))
    mapFormats[fmtName] = fmtVal
  })
  mapFormats['selected'] = getSelectedFormatName()
  
  chrome.storage.sync.set(mapFormats, function() {
    // Update status to let user know options were saved.
    $('#status').html('Options saved.')
    setTimeout(function() {
      $('#status').html('')
    }, 1000)
  })
}

function render(mapFormats) {
  var table = $('#table')
  var selectedFormat = mapFormats['selected']
  $.each(Object.keys(mapFormats), function(i, item) {
    if (item !== 'selected') {      
      var tr = $('<tr/>').appendTo(table)
      var tdText = $('<td/>')
        .addClass('formatName')
        .addClass('visible')
        .text(item) // format name
        .appendTo(tr);
      var tdValue = $('<td/>')
        .addClass('visible')
        .appendTo(tr)
      var code = null
      if (item === 'formatCustom'){
        code = $('<input/>').attr('type','text').val(mapFormats[item])
      } else{
        code = $('<pre/>').text(mapFormats[item])
      }
      code.addClass('formatValue').appendTo(tdValue)
      if (item === selectedFormat) {
        tr.addClass('selected')
      }
    }
  })
  $('#table tr').click(function() {
    $(this).addClass('selected').siblings().removeClass('selected')
  })
}

function restore_options() {
  chrome.storage.sync.get(defaultMapFormats, function(items) {
    render(items)
  })
}

document.addEventListener('DOMContentLoaded', restore_options)

$(document).ready(function() {
  $('#save').click(save_options)
  $('#tryFormat').click(function() {
    var format = prepareFormat(getFormatValue($('#table .selected .formatValue')))
    var dt2 = new Date()
    var dt1 = new Date()
    dt1.setSeconds(dt1.getSeconds() - 15)
    var sampleRendered = formatMsg(format, formatDate(dt1), "Alice", "Hi, Bob.")
    sampleRendered += "\n" + formatMsg(format, formatDate(dt2), "Bob", "Hello, Alice.")
    $('#sampleOutput').html(sampleRendered)
  });
});

MAX_INP_SIZE = 9

INP_ID = 'inpPageNo'
DIV_PAGES = 'divPages'
DEFAULT_PAGE_NO = '1'

function page_control_init(div_id, action_handler){
  var div = $(div_id)
  div.text('')
  var table = $('<table/>').appendTo(div)
  var tr = $('<tr/>').appendTo(table)
  
  var btnLeft = $('<button/>').attr('title','Navigate to more recent messages')
    .text('<')
  append_to_tr(btnLeft, tr)
  
  var divPage = $('<div/>').text('Page')
  append_to_tr(divPage, tr)
  
  var inpCurPage = $('<input/>').attr('id',INP_ID).on('input', function(e){
    var cur_val = $(this).val()
    if (cur_val.length > MAX_INP_SIZE){
      var trim_val = cur_val.substring(0,MAX_INP_SIZE)
      page_control_set_page(trim_val)
    }else if (cur_val.length < 1){
      page_control_set_page(DEFAULT_PAGE_NO)
    }else{
      page_control_set_page($(this).val())
    }
  }).keypress(function(e){
    if (e.keyCode == 13){
      action_handler && action_handler()
    }
  })
  // initialization
  append_to_tr(inpCurPage, tr)
  page_control_set_page(1)

  var divOf = $('<div/>').text('of')
  append_to_tr(divOf, tr)

  var divPages = $('<div/>').attr('id',DIV_PAGES).text('?')
  append_to_tr(divPages, tr)

  var btnRight = $('<button/>').attr('title','Navigate to older messages')
    .text('>')

  btnLeft.click(function(){
    var p = page_control_get_pageNo()
    var p2 = parseInt(p) - 1
    page_control_set_page(p2)
    action_handler()
  })
  btnRight.click(function (){
    var p = page_control_get_pageNo()
    var p2 = parseInt(p) + 1
    page_control_set_page(p2)
    action_handler()
  })
  append_to_tr(btnRight, tr)
}


function page_control_set_page(pageNo){
  // validate input before set
  var s = null
  var num = parseInt(''+pageNo)
  if (isNaN(num)){
    s = '1'
  }else{
    if (num < 1)
      num = 1
    s = '' + num
  }
  var el = $('#'+INP_ID)
  el.val(s)
  var size = (s && s.length) || 0
  el.width((size+1)*8)
}

function page_control_get_pageNo(){
  return $('#'+INP_ID).val()
}

function page_control_set_total_pages(total_pages){
  $('#'+DIV_PAGES).text(''+total_pages)
}

function append_to_tr(el, tr){
  var td = $('<td/>').appendTo(tr)
  el.appendTo(td)
}
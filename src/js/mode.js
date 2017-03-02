function changeMode(mode) {
  if (mode == 0)// edit
  {
    // just reload character data from scratch
    loadSaved();
    // display back all elements


    // display editables
    $('.list span.editable').each(function () {
      if ($(this).css('display') == 'none') {
        $(this).css('display', 'inline-block');
      }
    });
    // show empty dots
    showDots('.other_traits_container');
    showDots('.advantages');
    showDots('.merits');
    showDots('.flaws');
    showDots('.custom_props');

  } else // hide some elements and set some values to zero
  {
    // reset health
    $('.health-table').find('span').editable('setValue', '');
    // reset experience
    $('span[data-name="experience"]').editable('setValue', '');
    // reset used willpower
    $('select[name="Willpower_current"]')
      .barrating('set', 0)
      .barrating('clear');

    // hide all non used editables
    $('.list span.editable').each(function () {
      if ($(this).html() == 'None') {
        $(this).css('display', 'none');
      }
    });
    // hide all empty dots
    hideDots('.other_traits_container');
    hideDots('.advantages');
    hideDots('.merits');
    hideDots('.flaws');
    hideDots('.custom_props');

  }

}
function hideDots(container) {
  $(`${container} select option[value=""]:selected`).each(function () {
    // console.log($(this));
    $(this).parent().barrating('destroy');
    $(this).parent().css('display', 'none');
  });
}
function showDots(container) {
  // display empty dots
  $(`${container} select option[value=""]:selected`).each(function () {
    const a = $(this).parent().next();
    if (a.attr('class') != 'br-widget') {
      $(this).parent().css('display', 'inline-block');
      $(this).parent().barrating('show', {
        wrapperClass: 'br-wrapper-f',
        showSelectedRating: false,
        onSelect(value, text) {
          sendDots($(this).parent().attr('name'), value);
        },
      });
    }
  });
}
